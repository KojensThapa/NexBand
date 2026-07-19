import assert from "node:assert/strict";
import test from "node:test";

import { buildApp } from "../src/app";

test("service status and speaking route guards work without a database", async (t) => {
  const app = await buildApp();
  t.after(async () => app.close());

  const health = await app.inject({ method: "GET", url: "/" });
  assert.equal(health.statusCode, 200);
  assert.equal(health.json().success, true);

  const invalidQuery = await app.inject({
    method: "GET",
    url: "/api/speaking/tests?limit=51",
  });
  assert.equal(invalidQuery.statusCode, 400);

  const startWithoutLogin = await app.inject({
    method: "POST",
    url: "/api/speaking/tests/test-id/attempts",
  });
  assert.equal(startWithoutLogin.statusCode, 401);
});
