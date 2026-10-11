import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createApp } from "../app.js";

test("the same key cannot create a second operation with a changed ID", async (t) => {
  const { app, operations } = createApp({ delayMs: 10, responseDelayMs: 10, logger: () => {} });
  const server = app.listen(0);
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (operationId) => fetch(`${base}/api/operations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": "same-key" },
    body: JSON.stringify({ operationId, productId: "notebook" }),
  });

  const first = await request(randomUUID());
  const second = await request(randomUUID());
  assert.equal(operations.size, 1);
  assert.equal(first.status, 201);
  assert.equal(second.status, 409);
});
