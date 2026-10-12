# What's new

## Baseline

The existing lab serves a static frontend and an Express API. It already includes `POST /api/login` for demo credentials, `GET /api/ping`, and a two-second `GET /api/delay`, along with HTTP, session, timing, and Week 2 operation examples.

## Changes after the baseline

**2026-10-11:** Capped the recent-logs page at 30 events and clarified the idempotency key hash column. Run Start operation and Retry with same key, then refresh `/logs/` to compare their hashes and different correlation IDs.

**2026-10-11:** Organized `/logs/` into a table with separate request and operation fields and added Clear recent logs. Open the logs link, run an example, refresh, then clear the in-memory list to try it.

**2026-10-11:** Added a small recent-logs page at `/logs/`, linked from the main page. Run an example, open the link, and click Refresh logs to see the server's sanitized request and operation events. The page reads an in-memory snapshot from `GET /api/logs`.

**2026-10-11:** Expanded the main page's Network inspection section. Choose a failing login case, run the working/failing pair, and compare method, URL, headers, bodies, status, and timing in the table or a proxy capture.

**2026-10-11:** Simplified the lab into one page with console request logs and a two-request login comparison. Start the server with `cd backend; npm.cmd start`, open `http://localhost:3000`, use the buttons, and watch DevTools Network plus the terminal. The Week 2 operation, status, and retry flow remains available on that page.

### 1. Week 1 corrections

- The blocking and non-blocking comparison starts slow work and ping before awaiting either response. A synchronous block holds ping; an asynchronous delay lets ping reply while work is pending. Implemented in `frontend/features/week-1/timing.js` and `backend/routes/timing.js`.
- The invalid JSON example keeps HTTP 200 visible and labels the later `response.json()` error as parsing. Implemented in `frontend/features/week-1/http-examples.js` and `backend/routes/http-examples.js`.
- The success, 404, closed-port, application failure, cookie/session, and event-loop examples remain available.

### 2. Week 2 additions

- `frontend/features/week-2/cancellation.js` uses `AbortController` for a manual cancel. `timeout.js` aborts after a client timer. Both show that stopping a client wait does not prove server work stopped.
- `backend/routes/operations.js` keeps an operation Map and separates completion from the delayed HTTP response. `frontend/features/week-2/operations.js` starts an operation, checks status, retries with the same key, or deliberately starts another with a new key. This demonstrates unknown outcomes and the danger of an unsafe retry.
- `backend/middleware/idempotency.js` reserves a key before asynchronous work, rejects changed parameters and processing duplicates, and replays a completed result. It stays separate from `backend/middleware/request-log.js`, which assigns a fresh correlation ID to each HTTP request. Console logs show request arrival, completion or disconnect, and independent operation events. Keys appear only as short hashes.
- `frontend/features/week-2/request-comparison.js` sends a working login and one selected failure: wrong password, method, URL, header, or missing body field. The main page compares the two requests without a second page or a login deadline feature.
- `frontend/logs/` shows recent request and operation events in separate table columns. Refresh reads `GET /api/logs`; Clear calls `DELETE /api/logs` to empty the in-memory history. Neither action changes terminal output.
