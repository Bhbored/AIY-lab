import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function startServer(t, logger = () => {}) {
  const { app } = createApp({ logger });
  const server = app.listen(0);
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

test("HTTP success returns users", async (t) => {
  const base = startServer(t);
  const response = await fetch(`${base}/api/users`);

  assert.equal(response.status, 200);
  assert.equal((await response.json()).users.length, 5);
});

test("HTTP 404 is a response, not a rejected fetch", async (t) => {
  const base = startServer(t);
  const response = await fetch(`${base}/api/users/999`);

  // fetch() resolves when a server replies with an error status.
  assert.equal(response.status, 404);
  assert.equal(response.ok, false);
});

test("invalid JSON fails after HTTP 200", async (t) => {
  const base = startServer(t);
  const response = await fetch(`${base}/api/invalid-json`);

  assert.equal(response.status, 200);
  // The HTTP request succeeded; parsing its body is a separate step.
  await assert.rejects(response.json(), SyntaxError);
});

test("AbortController cancels a pending request", async (t) => {
  let markReceived;
  const received = new Promise((resolve) => {
    markReceived = resolve;
  });
  const base = startServer(t, (entry) => {
    if (
      entry.type === "request" &&
      entry.event === "received" &&
      entry.path === "/api/delay"
    ) {
      markReceived();
    }
  });
  const controller = new AbortController();
  const pending = fetch(`${base}/api/delay`, { signal: controller.signal });

  // Wait for the server log so this tests cancellation of an active request.
  await received;
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
});
