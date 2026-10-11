# Week 1 and 2 HTTP lab

This small Express and plain JavaScript lab lets you see what an HTTP client knows, what the server did, and why those can differ. It keeps the Week 1 basics while adding Week 2 cancellation, unknown outcomes, retries, correlation IDs, and Node tests. The data lives in memory and resets when the server restarts.

## Run it

From the repository root in PowerShell:

```powershell
cd backend
npm.cmd install
npm.cmd start
```

Open `http://localhost:3000`. Keep the terminal visible for server logs and open the browser's DevTools Network panel. For automatic restarts during backend edits, use `npm.cmd run dev` instead of `start`. In another PowerShell window, run:

```powershell
cd backend
npm.cmd test
npm.cmd run async-order
node --test tests/idempotency.test.js
```

There is no frontend build step. The event-loop script prints synchronous work, `nextTick`, Promise, timer, immediate, and file I/O callbacks. Some timer/immediate ordering can vary; the script shows the queues rather than promising one fixed order.

## Where the code lives

| File | Responsibility |
| --- | --- |
| `backend/server.js`, `backend/app.js` | Start Express; register middleware, API routes, and the static page. |
| `backend/routes/http-examples.js`, `session.js`, `timing.js`, `operations.js` | Week 1 responses, cookie/session, timing, and Week 2 operation state. |
| `backend/middleware/request-log.js` | Give each request a correlation ID and log arrival and finish/disconnect. |
| `backend/middleware/idempotency.js` | Reserve keys, reject changed requests or an in-progress duplicate, replay finished results. |
| `backend/data/users.js` | Mock users. |
| `backend/tests/lab.test.js`, `idempotency.test.js` | Behavior tests and the original regression test. |
| `backend/evidence/` | Historical before/after regression output. |
| `backend/scripts/async-order.js` | Standalone event-loop example. |
| `frontend/index.html`, `frontend/src/main.js`, `styles.css` | One learning page, button wiring, and simple styles. |
| `frontend/features/week-1/` | HTTP errors, parsing, session, and timing requests. |
| `frontend/features/week-2/` | Cancellation, timeout, operations/retries, and the login comparison. |
| `frontend/Utils/http-status.js` | HTTP status constants used by Week 1 examples. |

## Week 1

- **Success (200)** requests `/api/users` and displays mock users. **Missing URL (404)** requests a route that does not exist. `fetch()` resolves in both cases; inspect `response.ok` and status.
- **Closed port** requests `127.0.0.1:59999`, where this lab has no listener. Here `fetch()` rejects and there is no HTTP status.
- **200, application failure** gets a valid HTTP response with `{ ok: false }`. HTTP delivery succeeded; the requested business action did not.
- **200, invalid JSON** gets HTTP 200, then `response.json()` throws `SyntaxError`. The frontend reports a parsing failure after a successful fetch, rather than calling it an HTTP or network error.
- **Send login** uses fake `lab-user` / `lab-pass` credentials. A wrong password returns 401; a correct one sets an HttpOnly session cookie. **Read session** asks `/api/session` whether the cookie is present. JavaScript cannot read the HttpOnly cookie; inspect `Set-Cookie` in Network.
- **Block + ping** and **Delay + ping** start both requests before awaiting either. `/api/block` runs a two-second synchronous loop that holds Node's event loop, so ping waits. `/api/delay` uses an asynchronous timer, so ping can finish during the delay. Compare the timings in Network and the Latest result panel. `npm.cmd run async-order` gives another view of event-loop scheduling.

## Week 2

### Cancellation and client timeout

**Start delayed request** calls `/api/delay` with an `AbortController`; **Cancel request** calls `abort()` while it is pending. The browser reports an intentional `AbortError`. **Client timeout** starts the same request and calls `abort()` after 400 ms. Its timer is cleared when the request ends, so it cannot affect later work. Both actions stop this client's wait. They do not prove that server work stopped; the `/api/delay` route still has its own timer.

### Unknown outcome, status, and retries

**Start operation** creates an operation ID, a key, and the fixed product `notebook`, then posts to `/api/operations`. The server stores `pending` in an in-memory Map, finishes the operation after about 700 ms, and delays its HTTP response another 900 ms. The browser's 500 ms timer aborts before it receives confirmation. Expect “client timeout; server outcome unknown” in Latest result. The terminal separately logs request arrival, operation start, request disconnect, and operation completion. Check status after completion to see `completed`.

**Check operation status** calls `GET /api/operations/:id`. It reads the server's `pending`, `completed`, or `failed` state. The `broken-item` product is available in the API to demonstrate a failed operation, although the main button uses `notebook`. Checking status matters because an HTTP timeout says nothing certain about the operation outcome.

**Retry with same key** resends the original operation ID, product, and idempotency key. The middleware checks the key before work begins and reserves a new key before any asynchronous work. A duplicate during processing receives 409 with the operation ID; a duplicate after completion receives the saved result with `Idempotency-Replayed: true`. Different parameters with an existing key receive 409. The operation does not execute again. **Unsafe retry: new key** deliberately creates a new ID and key, so the server can execute a second operation. Use it only to see the risk, not as a default recovery step.

Each HTTP request gets a fresh `X-Correlation-ID`. It links that request to terminal records. The original request and same-key retry have different correlation IDs because they are separate HTTP attempts. Their idempotency key identifies one logical operation. Terminal logs contain a short hash of the key, not its raw value. Request logs report arrival, HTTP completion or disconnect, status when available, and duration; operation logs report start, completion, or failure independently. The server does not log request bodies, credentials, authorization headers, or cookies.

For real retries, first check an unknown outcome when possible. Retry only transient failures or unknown results, reuse the same key and parameters, set a maximum attempt count, and wait between attempts. Exponential backoff increases each wait, often with jitter. A 401 caused by invalid credentials is not a reason to retry automatically.

## Classify the result

| Observation | Meaning | Example |
| --- | --- | --- |
| HTTP error | `fetch()` resolved, but `response.ok` is false. | 404 missing URL; 401 login. |
| Network error | `fetch()` rejected before an HTTP response. | Closed port. |
| JSON parsing error | An HTTP response arrived, then `response.json()` failed. | 200 invalid JSON. |
| Intentional cancellation | You clicked Cancel; `AbortController` ended the wait. | Start delayed request, then Cancel. |
| Client timeout | A client timer called `abort()`. Server outcome may be unknown. | Client timeout or Start operation. |
| Application failure | HTTP may be 200, but the body reports `ok: false`. | 200, application failure. |

## Automated and regression tests

`node:test` finds and runs the tests. `node:assert/strict` checks expected values; a failed assertion fails its test. From `backend/`, `npm.cmd test` runs both test files. The five tests cover a 200 response with users, a 404 response that still resolves `fetch()`, an HTTP 200 body that fails JSON parsing, an intentional `AbortController` cancellation, and the idempotency regression. The other Week 1 and Week 2 features remain in the app and can be demonstrated manually with the page, DevTools Network, and server console.

Run the regression test alone with `node --test tests/idempotency.test.js`. Its assertion checks that changing the operation ID while reusing a key cannot create a second operation. The historical `backend/evidence/regression-before.txt` records a failure (`2 !== 1`) with middleware removed; `regression-after.txt` records a pass after it was restored. Those files are preserved as provided. Their original run cannot be independently authenticated from this repository; rerunning the active test verifies the current fix without breaking the app.

## Inspect requests in Charles or mitmproxy

Start the server and open the main page through your proxy. If localhost traffic is not captured, use a proxy-specific localhost alias such as `http://localhost.charlesproxy.com:3000` in Charles, or configure the proxy to capture loopback traffic. Click **Send login pair** under Network inspection. The browser sends two `POST /api/login` requests with the same URL, JSON header, and body shape. The fake password changes, giving 200 and 401. In the proxy, inspect method, URL, request and response headers, request and response bodies, status, and timing. The two calls are made in order, but ordinary network timing can vary. You can also use the Week 1 missing-URL button for a 404. Redact password values, Cookie, Set-Cookie, Authorization, and any personal data before sharing captures.

## Limits

The Maps reset on restart and are not shared across server instances. There is no durable idempotency, distributed coordination, queue, or production retry policy. A disconnected HTTP client does not cancel server work in this example. The fixed demo credentials and session value are only for local learning. The timing examples are approximate and should be observed in Network rather than treated as exact benchmarks.
