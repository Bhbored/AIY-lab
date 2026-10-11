import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { createServer as createHttpServer } from "node:http";
import { Worker } from "node:worker_threads";
import { createApp } from "../app.js";

function start(t, options = {}) {
  const logs = [];
  const { logger: onLog, ...appOptions } = options;
  const lab = createApp({
    delayMs: 20,
    responseDelayMs: 80,
    ...appOptions,
    logger: (entry) => {
      logs.push(entry);
      onLog?.(entry);
    },
  });
  const server = lab.app.listen(0);
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return { ...lab, logs, base: `http://127.0.0.1:${server.address().port}` };
}

function post(base, key, operationId = randomUUID(), productId = "notebook", signal) {
  return fetch(`${base}/api/operations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": key },
    body: JSON.stringify({ operationId, productId }),
    signal,
  });
}

test("HTTP 200 returns users", async (t) => {
  const { base } = start(t);
  const response = await fetch(`${base}/api/users`);
  assert.equal(response.status, 200);
  assert.equal(response.ok, true);
  assert.equal((await response.json()).users.length, 5);
});

test("fetch fulfills for HTTP 404 but response.ok is false", async (t) => {
  const { base } = start(t);
  const response = await fetch(`${base}/api/users/999`);
  assert.equal(response.status, 404);
  assert.equal(response.ok, false);
});

test("a closed local port rejects without an HTTP response", async () => {
  const listener = createServer();
  await new Promise((resolve) => listener.listen(0, "127.0.0.1", resolve));
  const closedPort = listener.address().port;
  await new Promise((resolve) => listener.close(resolve));
  await assert.rejects(fetch(`http://127.0.0.1:${closedPort}/no-server`));
});

test("invalid JSON has HTTP 200 but fails during parsing", async (t) => {
  const { base } = start(t);
  const response = await fetch(`${base}/api/invalid-json`);
  assert.equal(response.status, 200);
  await assert.rejects(response.json(), SyntaxError);
});

test("HTTP 200 can report application failure", async (t) => {
  const { base } = start(t);
  const response = await fetch(`${base}/api/application-failure`, { method: "POST" });
  assert.equal(response.status, 200);
  assert.equal(response.ok, true);
  assert.equal((await response.json()).ok, false);
});

test("login sets an HttpOnly cookie that the session route recognizes", async (t) => {
  const { base } = start(t);
  const login = await fetch(`${base}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "lab-user", password: "lab-pass" }),
  });
  assert.equal(login.status, 200);
  assert.match(login.headers.get("set-cookie"), /HttpOnly/);
  const cookie = login.headers.get("set-cookie").split(";")[0];
  const session = await fetch(`${base}/api/session`, { headers: { Cookie: cookie } });
  assert.equal((await session.json()).hasSession, true);
});

test("invalid login returns HTTP 401", async (t) => {
  const { base } = start(t);
  const response = await fetch(`${base}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "lab-user", password: "wrong-pass" }),
  });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).ok, false);
});

test("ping responds while the non-blocking delay is pending", async (t) => {
  const { base } = start(t);
  const delay = fetch(`${base}/api/delay`).then((response) => response.json());
  const ping = fetch(`${base}/api/ping`).then((response) => response.json());
  assert.equal(await Promise.race([delay.then(() => "delay"), ping.then(() => "ping")]), "ping");
  assert.equal((await ping).message, "Pong");
  assert.equal((await delay).message, "Delay finished");
});

test("synchronous blocking work holds a ping until it finishes", async (t) => {
  const { app } = createApp({ logger: () => {} });
  const worker = new Worker(`
    const { parentPort } = require("node:worker_threads");
    parentPort.on("message", async (base) => {
      const sentAt = Date.now();
      const response = await fetch(base + "/api/ping");
      parentPort.postMessage({ sentAt, receivedAt: Date.now(), status: response.status });
    });
  `, { eval: true });
  const workerReady = new Promise((resolve) => worker.once("online", resolve));
  let blockFinishedAt;
  let base;
  const server = createHttpServer((req, res) => {
    if (req.url === "/api/block") {
      worker.postMessage(base);
      app(req, res);
      blockFinishedAt = Date.now();
    } else {
      app(req, res);
    }
  });
  t.after(async () => {
    await worker.terminate();
    await new Promise((resolve) => server.close(resolve));
  });
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  await workerReady;
  const ping = new Promise((resolve, reject) => {
    worker.once("message", resolve);
    worker.once("error", reject);
  });
  const block = await fetch(`${base}/api/block`);
  const pong = await ping;
  assert.equal(block.status, 200);
  assert.equal(pong.status, 200);
  assert.ok(pong.sentAt < blockFinishedAt, "ping was sent during the block");
  assert.ok(pong.receivedAt >= blockFinishedAt, "ping replied after the block");
});

test("the blocking Week 1 endpoint still completes", async (t) => {
  const { base } = start(t);
  const response = await fetch(`${base}/api/block`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).message, "Blocking work finished");
});

test("manual AbortController cancellation rejects the fetch", async (t) => {
  const { base } = start(t);
  const controller = new AbortController();
  const pending = fetch(`${base}/api/delay`, { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
});

test("a client timeout aborts before the delayed response", async (t) => {
  const { base } = start(t);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 200);
  try {
    await assert.rejects(fetch(`${base}/api/delay`, { signal: controller.signal }), { name: "AbortError" });
  } finally {
    clearTimeout(timeout);
  }
});

test("different keys create different operations", async (t) => {
  const { base, operations } = start(t);
  const first = await post(base, "key-one");
  const second = await post(base, "key-two");
  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  assert.notEqual((await first.json()).operation.id, (await second.json()).operation.id);
  assert.equal(operations.size, 2);
});

test("a key cannot be reused with changed parameters", async (t) => {
  const { base, operations } = start(t);
  const operationId = randomUUID();
  assert.equal((await post(base, "same-key", operationId)).status, 201);
  const changed = await post(base, "same-key", operationId, "pen");
  assert.equal(changed.status, 409);
  assert.match((await changed.json()).message, /different parameters/);
  assert.equal(operations.size, 1);
});

test("concurrent same-key requests create one operation", async (t) => {
  let signalStarted;
  const started = new Promise((resolve) => { signalStarted = resolve; });
  const { base, operations } = start(t, {
    delayMs: 500,
    logger: (entry) => {
      if (entry.type === "operation" && entry.state === "started") signalStarted();
    },
  });
  const operationId = randomUUID();
  const first = post(base, "race-key", operationId);
  await started;
  const responses = await Promise.all([first, post(base, "race-key", operationId)]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409]);
  assert.equal(operations.size, 1);
});

test("status reveals completion after the original client times out", async (t) => {
  let signalStarted;
  let signalCompleted;
  let signalDisconnected;
  const started = new Promise((resolve) => { signalStarted = resolve; });
  const completed = new Promise((resolve) => { signalCompleted = resolve; });
  const disconnected = new Promise((resolve) => { signalDisconnected = resolve; });
  const { base, operations, logs } = start(t, {
    delayMs: 20,
    responseDelayMs: 200,
    logger: (entry) => {
      if (entry.type === "operation" && entry.state === "started") signalStarted(entry);
      if (entry.type === "operation" && entry.state === "completed") signalCompleted(entry);
      if (entry.type === "request" && entry.path === "/api/operations" && entry.outcome === "disconnected") signalDisconnected(entry);
    },
  });
  const operationId = randomUUID();
  const controller = new AbortController();
  const request = post(base, "timeout-key", operationId, "notebook", controller.signal);
  const startedLog = await started;
  controller.abort();
  await assert.rejects(request, { name: "AbortError" });
  const requestLog = await disconnected;
  const completedLog = await completed;
  const status = await fetch(`${base}/api/operations/${operationId}`);
  assert.equal(status.status, 200);
  assert.equal((await status.json()).operation.state, "completed");
  assert.equal(operations.size, 1);
  assert.equal(requestLog.status, null);
  assert.equal(requestLog.correlationId, startedLog.correlationId);
  assert.equal(completedLog.correlationId, startedLog.correlationId);
  assert.equal(completedLog.keyId, requestLog.keyId);
  assert.equal(completedLog.operationId, operationId);
  assert.equal(requestLog.outcome, "disconnected");
  assert.equal(logs.filter((entry) => entry === requestLog).length, 1);
});

test("request logs use different correlation IDs and hide the raw key", async (t) => {
  const { base, logs } = start(t);
  const operationId = randomUUID();
  const first = await post(base, "private-demo-key", operationId);
  const second = await post(base, "private-demo-key", operationId);
  assert.equal(second.headers.get("Idempotency-Replayed"), "true");
  assert.notEqual(first.headers.get("X-Correlation-ID"), second.headers.get("X-Correlation-ID"));
  assert.ok(logs.some((entry) => entry.type === "request" && entry.outcome === "completed" && entry.status === 201));
  assert.ok(logs.some((entry) => entry.type === "request" && entry.path === "/api/operations"));
  assert.equal(JSON.stringify(logs).includes("private-demo-key"), false);
});

test("failed operations keep a failed state and replay their result", async (t) => {
  const { base, logs } = start(t);
  const operationId = randomUUID();
  const first = await post(base, "failed-key", operationId, "broken-item");
  const retry = await post(base, "failed-key", operationId, "broken-item");
  const status = await fetch(`${base}/api/operations/${operationId}`);
  assert.equal(first.status, 500);
  assert.equal(retry.status, 500);
  assert.equal((await status.json()).operation.state, "failed");
  assert.ok(logs.some((entry) => entry.type === "request" && entry.outcome === "completed" && entry.status === 500));
  assert.ok(logs.some((entry) => entry.type === "operation" && entry.operationId === operationId && entry.state === "failed"));
});
