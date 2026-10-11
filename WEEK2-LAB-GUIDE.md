# Week 2 HTTP Lab Guide

## Run the lab

From the repository root in PowerShell:

```powershell
cd backend
npm.cmd install
npm.cmd start
```

Open `http://localhost:3001` and use the Week 2 section. Run `npm.cmd test` from `backend/` for the automated tests. `npm.cmd run async-order` still runs the Week 1 event-loop example.

## Project map

- `backend/server.js` starts the server; `backend/app.js` assembles Express, creates fresh in-memory Maps, and serves the frontend. Tests call `createApp()` and listen on a temporary port, so they do not need the running lab server.
- `backend/routes/operations.js` validates a small demo order, starts work, records its state, and exposes `GET /api/operations/:id`. The existing Week 1 routes remain in `backend/routes/http-examples.js`, `session.js`, and `timing.js`.
- `backend/middleware/idempotency.js` checks and reserves keys. `request-log.js` creates correlation IDs and writes structured request logs. `backend/data/users.js` holds Week 1 mock users.
- `frontend/index.html` contains the controls. `frontend/src/main.js` attaches button handlers and provides the shared `inspectResult` callback. `frontend/features/week-1/` contains the HTTP, session, and timing examples; `frontend/features/week-2/` contains cancellation, timeout, and operation examples. Each reports to the existing **Latest result** panel through `inspectResult`.
- `backend/tests/` contains Node tests. `backend/evidence/` holds the regression test's actual failing and passing output.

## Cancellation, timeout, and an unknown outcome

The browser calls the Express API with `fetch`. For manual cancellation, **Start delayed request** passes an `AbortController.signal` to `fetch`; **Cancel request** calls `abort()`. The rejected fetch is labeled *intentionally cancelled*, distinct from an HTTP error or connection failure. **Try client timeout** starts `/api/delay` and calls `abort()` after 400 ms. Its label is *client timeout*. The timer is cleared in `finally`, which runs whether the request succeeds or fails. Stopping the client's wait does not prove the server stopped.

**Start operation** sends `POST /api/operations` with a stable UUID `operationId`, a `productId` from the demo catalog, and an `Idempotency-Key` header. By default, the server finishes the work after about 250 ms but delays its response another 900 ms; the client times out after 500 ms. A server `setTimeout` continues independently of the abandoned HTTP response. `GET /api/operations/:id` then reveals `pending`, `completed`, or `failed`. The `broken-item` product is a deliberate failure example for API/tests.

## Keys, retries, and logs

The middleware uses a `Map` scoped to `POST /api/operations` in one running server. It synchronously reserves a new key before starting work, which prevents two nearly simultaneous requests from starting two operations. A duplicate with the same operation ID and product returns `409` while processing, or replays the saved status and result after completion. Changed parameters with the same key return `409`. The route accepts only demo catalog IDs and never stores credentials or arbitrary request bodies. Records have **no time-based expiration**; they remain until restart. This is a teaching model, not durable or distributed idempotency.

**Retry with same key** keeps the operation ID, key, and product. **Check operation status** is the safest first step after a timeout. **Unsafe: create another operation with a new key** requires a separate click and creates a new operation ID, illustrating a duplicate logical purchase. The page does not automatically retry uncertain state-changing requests.

`request-log.js` gives *each HTTP request* a new `X-Correlation-ID` using Node's `randomUUID()`. A retry has a new correlation ID but reuses its idempotency key. JSON request logs show method, path, status (or `null` after a disconnect), duration, a short SHA-256 identifier for the key, and whether the response completed, disconnected, or was aborted. Separate operation logs record the start and final state with the operation ID, key identifier, and correlation ID, even when the client left. Cookies, credentials, request bodies, and raw keys are not logged. `res.once("finish")` and `res.once("close")` cover normal responses and disconnects without double logging.

## Tests and regression evidence

`node:test` runs backend tests; `node:assert/strict` checks exact statuses, response bodies, rejection types, operation counts, and logs. API tests create isolated app instances and close their temporary servers. Run `npm.cmd test` in `backend/`. Check frontend controls manually in a browser with DevTools Network open.

The duplicate-operation test sends the same key with two different operation IDs. `backend/evidence/regression-before.txt` records a failing run (`2 !== 1` operations) with the middleware temporarily removed. `regression-after.txt` records a passing run with it restored. Both files show the same assertion and command; the full suite also tests replay, concurrent requests, changed parameters, timeout recovery, and other paths.

## Limits

All operations and keys disappear on restart. The Maps have no cleanup limit and do not coordinate across server processes. The short delays and fixed products are for learning; there is no database, authentication, payment, or production retry policy. Network timing can vary, so use the status endpoint and server logs to inspect the actual outcome rather than inferring it from the client's timeout.
