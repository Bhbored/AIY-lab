# Week 2 — What was added to the HTTP lab

This document focuses on **new Week 2 concepts and changes**, not a button-by-button user guide. It is intended as a reference when writing the Week 2 progress report. The descriptions below are based on the supplied lab source; *implementation present* does not mean the behavior has been independently verified in a running browser.

## 1. Request cancellation (`AbortController`)

- **What was added:** A delayed request that can be cancelled intentionally from the browser, using an `AbortController` and its `signal` passed to `fetch()`.
- **What it demonstrates:** An aborted client request is different from receiving an HTTP error status or failing to parse a response. Stopping the client's request does **not** prove that server-side work was undone.
- **Report relevance:** Covers the requirement to extend the lab with request cancellation; provides a scenario to verify and an automated cancellation test to discuss.

## 2. Client-side timeout

- **What was added:** A separate timeout demonstration in which the client aborts its wait before the delayed response arrives. In the documented demo, the timeout is 400 ms.
- **What it demonstrates:** A timeout is about what the *client observed*, not proof that the server never received or completed the request. The UI classifies this separately from manual cancellation.
- **Report relevance:** Directly supports the Week 2 timeout case and the explanation that an uncertain outcome must be checked before retrying.

## 3. Server operation continuing after client timeout

- **What was added:** `POST /api/operations` creates a simulated operation identified by a UUID. The server tracks `pending`, `completed`, or `failed` in memory and can complete the work before sending its response. By default, the documented lab uses about 250 ms for work, another 900 ms before the response, and a 500 ms client timeout.
- **What it demonstrates:** The server-side operation and the HTTP response are separate events. The client may lose its response even though the operation was completed.
- **Report relevance:** Meets the explicit requirement to simulate an operation finishing before the client receives the result.

## 4. Checking an uncertain outcome (reconciliation)

- **What was added:** `GET /api/operations/:id` looks up the stored operation and returns its current state.
- **What it demonstrates:** Following a timeout, check the operation by its stable ID rather than assuming failure and starting another operation.
- **Report relevance:** Explains *how* the lab checks the outcome before retrying; this is a key safe-retry expectation.

## 5. Idempotency protection

- **What was added:** Express middleware in `backend/middleware/idempotency.js` reads an `Idempotency-Key` on the operation POST route and tracks it in an in-memory Map.
- **What it demonstrates:** Repeated attempts with the **same key and request parameters** represent one logical operation. The lab reserves a new key before async work begins, rejects changed parameters, responds to in-progress duplicates with a conflict, and replays a stored result after completion.
- **Report relevance:** Shows the practical reason idempotency exists: protecting state-changing operations against duplicate side effects during retries.
- **Limit:** Protection applies within one running Node process; records disappear on restart, are not shared across instances, and have no time-based expiry. This is not a production guarantee or a claim about TSB's behavior.

## 6. Safe and unsafe retry comparison

- **What was added:** The client can retry the same operation with its existing idempotency key and parameters, or explicitly start another operation with a **new key and operation ID** to demonstrate the duplicate risk. Unsafe retry requires a manual action; the lab does not automatically repeat uncertain state-changing requests.
- **What it demonstrates:** A new HTTP attempt does not always mean a new logical operation. Reusing the same key is meaningful only when the server implements the matching idempotency behavior.
- **Report relevance:** Direct evidence for explaining when retries are safe, when the outcome should be checked first, and why a new key can create duplicates.

## 7. Correlation IDs and request / operation logging

- **What was added:** `backend/middleware/request-log.js` assigns a fresh `X-Correlation-ID` to each incoming HTTP request and logs method, path, observed response outcome/status, elapsed time, a safe hash identifier for the idempotency key, and outcome. A separate operation log records completion, including after a client disconnects.
- **What it demonstrates:** A **correlation ID** identifies an HTTP request for tracing, while an **idempotency key** identifies a logical operation across retries. Two attempts can have different correlation IDs but the same idempotency key.
- **Report relevance:** Supports evidence of tracing requests through the server and distinguishing *request outcome* from *operation outcome*. Do not include credentials, cookies, raw keys, or sensitive data in screenshots/logs.

## 8. Automated testing with Node.js

- **What was added:** Backend test files under `backend/tests/`, using Node's built-in `node:test` and `node:assert/strict`. The provided project has `lab.test.js`, `idempotency.test.js`, and (in the supplied ZIP) `frontend.test.js`.
- **What it demonstrates:** Assertions check expected HTTP and application behavior instead of relying only on manual clicking. Tests exercise success, HTTP errors, invalid JSON, cancellation/timeout, and idempotency-related cases. The frontend test uses substitutes rather than a real browser; it is not required by the Week 2 assignment.
- **Report relevance:** The assignment specifically requests tests for **successful responses, HTTP errors, invalid JSON, and cancellation**. Include the actual command and observed results, not merely the presence of test files.

## 9. Regression test: fail before fix, pass after

- **What was added:** Two evidence files: `backend/evidence/regression-before.txt` and `regression-after.txt`. The documented scenario sends the same idempotency key with two different operation IDs; without the protection, the test sees two operations where it expects one (`2 !== 1`), and the protected version passes.
- **What it demonstrates:** A regression test captures an unwanted behavior, then the **same expectation** passes after the implementation is corrected.
- **Report relevance:** Directly maps to the requested failing-before/passing-after evidence. Reference the real evidence files and the exact commands recorded there; independently verify the current tests before claiming they pass on your machine.

## 10. Existing lab preserved and code organized

- **What changed:** The existing Week 1 demonstrations remain, while new backend routes/middleware and frontend feature modules separate responsibilities. This division was deliberately requested; it is code organization, not a new technical requirement.
- **Report relevance:** Mention that the Week 2 work *extends* the previous HTTP lab rather than replacing it. The required Week 1 ping-comparison and invalid-JSON corrections should be confirmed in the final submitted version.

## Evidence to gather before reporting completion

- [ ] Screenshot or DevTools capture showing manual cancellation classified correctly.
- [ ] Timeout followed by an operation status check showing what actually happened.
- [ ] Same-key replay and unsafe new-key duplicate demonstration, with sanitized logs.
- [ ] Request correlation IDs versus the reused idempotency key in server logs.
- [ ] Actual `npm.cmd test` output for the four required test categories.
- [ ] Before/after regression evidence and commands, verified against the source.
- [ ] A short statement of what Codex changed versus what you personally inspected, ran, and confirmed.

**Scope note:** These are Week 2 *lab* changes only. Charles/mitmproxy captures, office iPhone traffic, TSB activation/code tracing, and Udemy completion are separate assignment items and are not claimed here.
