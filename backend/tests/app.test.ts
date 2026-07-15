import assert from "node:assert/strict";
import test from "node:test";

import { buildApp } from "../src/app";
import type { AppConfig } from "../src/config/env";

const testConfig: AppConfig = {
  nodeEnv: "test",
  host: "127.0.0.1",
  port: 4000,
  corsOrigin: "http://localhost:3000",
  jwtSecret: "test-only-secret-that-is-longer-than-thirty-two-characters",
  jwtExpiresIn: "1h",
  allowAdminRegistration: true,
  logLevel: "info",
  trustProxy: false,
};

async function createTestApp() {
  const app = await buildApp({ config: testConfig });
  app.addHook("onClose", async () => undefined);
  return app;
}

async function register(
  app: Awaited<ReturnType<typeof buildApp>>,
  path: "/api/v1/auth/register" | "/api/v1/auth/admin/register",
  email: string
) {
  const response = await app.inject({
    method: "POST",
    url: path,
    payload: { name: "Test Account", email, password: "a-strong-test-password" },
  });

  assert.equal(response.statusCode, 201);
  return response.json().data as { accessToken: string; user: { id: string; role: string } };
}

test("health check exposes service status", async (t) => {
  const app = await createTestApp();
  t.after(async () => app.close());

  const response = await app.inject({ method: "GET", url: "/api/v1/health" });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().data.status, "ok");
});

test("only administrators can publish test content and public responses hide answer keys", async (t) => {
  const app = await createTestApp();
  t.after(async () => app.close());

  const student = await register(app, "/api/v1/auth/register", "student@example.com");
  const denied = await app.inject({
    method: "POST",
    url: "/api/v1/admin/tests",
    headers: { authorization: `Bearer ${student.accessToken}` },
    payload: { skill: "writing", category: "practice", title: "Should fail" },
  });
  assert.equal(denied.statusCode, 403);

  const admin = await register(app, "/api/v1/auth/admin/register", "admin@example.com");
  const created = await app.inject({
    method: "POST",
    url: "/api/v1/admin/tests",
    headers: { authorization: `Bearer ${admin.accessToken}` },
    payload: {
      skill: "writing",
      category: "practice",
      title: "Academic Task 1",
      content: { prompt: "Describe the graph." },
      answerKey: { markingNotes: "Look for an overview." },
      published: false,
    },
  });
  assert.equal(created.statusCode, 201);
  const testId = created.json().data.id as string;

  const hiddenDraft = await app.inject({ method: "GET", url: "/api/v1/tests" });
  assert.deepEqual(hiddenDraft.json().data, []);

  const published = await app.inject({
    method: "PATCH",
    url: `/api/v1/admin/tests/${testId}/publish`,
    headers: { authorization: `Bearer ${admin.accessToken}` },
    payload: { published: true },
  });
  assert.equal(published.statusCode, 200);

  const publicTest = await app.inject({ method: "GET", url: `/api/v1/tests/${testId}` });
  assert.equal(publicTest.statusCode, 200);
  assert.equal(publicTest.json().data.answerKey, undefined);

  const adminTests = await app.inject({
    method: "GET",
    url: "/api/v1/admin/tests",
    headers: { authorization: `Bearer ${admin.accessToken}` },
  });
  assert.deepEqual(adminTests.json().data[0].answerKey, {
    markingNotes: "Look for an overview.",
  });
});

test("a signed-in learner can create a processing submission with a pending report", async (t) => {
  const app = await createTestApp();
  t.after(async () => app.close());

  const student = await register(app, "/api/v1/auth/register", "writer@example.com");
  const submission = await app.inject({
    method: "POST",
    url: "/api/v1/submissions",
    headers: { authorization: `Bearer ${student.accessToken}` },
    payload: {
      skill: "writing",
      responseText: "This is a complete IELTS writing response.",
      timeTakenSeconds: 1200,
    },
  });

  assert.equal(submission.statusCode, 202);
  const submissionBody = submission.json().data as { reportId: string; status: string };
  assert.equal(submissionBody.status, "processing");

  const report = await app.inject({
    method: "GET",
    url: `/api/v1/reports/${submissionBody.reportId}`,
    headers: { authorization: `Bearer ${student.accessToken}` },
  });
  assert.equal(report.statusCode, 200);
  assert.equal(report.json().data.status, "pending");
});
