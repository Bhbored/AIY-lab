# What's new

## Baseline

The existing lab serves a static frontend and an Express API. It already includes `POST /api/login` for demo credentials, `GET /api/ping`, and a two-second `GET /api/delay`, along with HTTP, session, timing, and Week 2 operation examples.

## Changes after the baseline

**2026-10-11:** Simplified the lab into one page with console request logs and a two-request login comparison. Start the server with `cd backend; npm.cmd start`, open `http://localhost:3000`, use the buttons, and watch DevTools Network plus the terminal. The Week 2 operation, status, and retry flow remains available on that page.

### 1. Week 1 corrections

- The blocking and non-blocking comparison starts slow work and ping before awaiting either response. A synchronous block holds ping; an asynchronous delay lets ping reply while work is pending. Implemented in `frontend/features/week-1/timing.js` and `backend/routes/timing.js`.
- The invalid JSON example keeps HTTP 200 visible and labels the later `response.json()` error as parsing. Implemented in `frontend/features/week-1/http-examples.js` and `backend/routes/http-examples.js`.
- The success, 404, closed-port, application failure, cookie/session, and event-loop examples remain available.

### 2. Week 2 additions

- `frontend/features/week-2/cancellation.js` uses `AbortController` for a manual cancel. `timeout.js` aborts after a client timer. Both show that stopping a client wait does not prove server work stopped.
- `backend/routes/operations.js` keeps an operation Map and separates completion from the delayed HTTP response. `frontend/features/week-2/operations.js` starts an operation, checks status, retries with the same key, or deliberately starts another with a new key. This demonstrates unknown outcomes and the danger of an unsafe retry.
- `backend/middleware/idempotency.js` reserves a key before asynchronous work, rejects changed parameters and processing duplicates, and replays a completed result. It stays separate from `backend/middleware/request-log.js`, which assigns a fresh correlation ID to each HTTP request. Console logs show request arrival, completion or disconnect, and independent operation events. Keys appear only as short hashes.
- `frontend/features/week-2/request-comparison.js` sends a valid and invalid demo login from the main page. The two requests support Charles or mitmproxy inspection without a second page or a login deadline feature.

### 3. Testing

Run `npm.cmd test` from `backend/`. The five tests cover HTTP 200, HTTP 404, invalid JSON, cancellation, and the unchanged idempotency regression. Check the other demonstrations manually through the page, DevTools Network, and server console. Run the regression test alone with `node --test tests/idempotency.test.js`. The provided historical files in `backend/evidence/` show a failure with protection removed and a pass with it restored. Their origin cannot be independently authenticated from this repository.

### 4. AI contribution

Codex removed the live log dashboard, the extra comparison page and timing cases, redundant tests, and overlapping guides. It simplified the main page, route wiring, console logs, comparison feature, test suite, and these two learner documents while retaining the Week 1 and Week 2 teaching paths.

### 5. Independent verification checklist

- [ ] Start the server, open the page, and inspect the 200, 404, closed-port, application-failure, and invalid-JSON results in DevTools Network.
- [ ] Log in with the demo credentials, inspect `Set-Cookie`, and click Read session.
- [ ] Compare Block + ping with Delay + ping in Network; run `npm.cmd run async-order`.
- [ ] Start and cancel a delay, then run Client timeout.
- [ ] Start an operation, check its status after the timeout, and retry with the same key. Confirm the terminal shows separate request and operation events and no second operation start.
- [ ] Click Unsafe retry: new key and confirm it starts another operation.
- [ ] Send the login pair through Charles or mitmproxy and inspect method, URL, headers, bodies, statuses, and timings. Redact credential and cookie values before sharing captures.
- [ ] Run `npm.cmd test` and the regression test independently.

### 6. Remaining limitations or unfinished work

Browser button and proxy interactions still need direct manual verification if no browser automation is available. Idempotency and operation state are in memory and disappear on restart; separate server instances do not share them. Timing depends on local scheduling. The provided historical regression output was not regenerated or independently authenticated.
