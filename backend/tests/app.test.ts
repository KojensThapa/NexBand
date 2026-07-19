import assert from "node:assert/strict";
import test from "node:test";

import { buildApp } from "../src/app";

test("service status and reading-route guards are available without a database", async (t) => {
  const app = await buildApp();
  t.after(async () => app.close());

  const health = await app.inject({ method: "GET", url: "/" });
  assert.equal(health.statusCode, 200);
  assert.equal(health.json().success, true);

  const invalidPage = await app.inject({
    method: "GET",
    url: "/api/reading/tests?limit=51",
  });
  assert.equal(invalidPage.statusCode, 400);
  assert.equal(invalidPage.json().success, false);

  const unauthenticatedStart = await app.inject({
    method: "POST",
    url: "/api/reading/tests/test-id/attempts",
  });
  assert.equal(unauthenticatedStart.statusCode, 401);

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
});
