import assert from "node:assert/strict";
import test from "node:test";

import { buildApp } from "../src/app";

test("service status and route guards are available without a database", async (t) => {
  const app = await buildApp();
  t.after(async () => app.close());

  const health = await app.inject({ method: "GET", url: "/" });
  assert.equal(health.statusCode, 200);
  assert.equal(health.json().success, true);

  const invalidReadingPage = await app.inject({
    method: "GET",
    url: "/api/reading/tests?limit=51",
  });
  assert.equal(invalidReadingPage.statusCode, 400);
  assert.equal(invalidReadingPage.json().success, false);

  const unauthenticatedReadingStart = await app.inject({
    method: "POST",
    url: "/api/reading/tests/test-id/attempts",
  });
  assert.equal(unauthenticatedReadingStart.statusCode, 401);

  const invalidListeningPage = await app.inject({
    method: "GET",
    url: "/api/listening/tests?limit=51",
  });
  assert.equal(invalidListeningPage.statusCode, 400);
  assert.equal(invalidListeningPage.json().success, false);

  const unauthenticatedListeningStart = await app.inject({
    method: "POST",
    url: "/api/listening/tests/test-id/attempts",
  });
  assert.equal(unauthenticatedListeningStart.statusCode, 401);

  const invalidSpeakingQuery = await app.inject({
    method: "GET",
    url: "/api/speaking/tests?limit=51",
  });
  assert.equal(invalidSpeakingQuery.statusCode, 400);

  const unauthenticatedSpeakingStart = await app.inject({
    method: "POST",
    url: "/api/speaking/tests/test-id/attempts",
  });
  assert.equal(unauthenticatedSpeakingStart.statusCode, 401);

  const userToken = app.jwt.sign({
    id: "user-id",
    email: "user@example.com",
    role: "USER",
  });
  const forbiddenAdminRequest = await app.inject({
    method: "GET",
    url: "/api/auth/admin-test",
    headers: { authorization: `Bearer ${userToken}` },
  });
  assert.equal(forbiddenAdminRequest.statusCode, 403);

  const adminToken = app.jwt.sign({
    id: "admin-id",
    email: "admin@example.com",
    role: "ADMIN",
  });
  const permittedAdminRequest = await app.inject({
    method: "GET",
    url: "/api/auth/admin-test",
    headers: { authorization: `Bearer ${adminToken}` },
  });
  assert.equal(permittedAdminRequest.statusCode, 200);

  const forbiddenLearnerRequest = await app.inject({
    method: "POST",
    url: "/api/reading/tests/test-id/attempts",
    headers: { authorization: `Bearer ${adminToken}` },
  });
  assert.equal(forbiddenLearnerRequest.statusCode, 403);
});
