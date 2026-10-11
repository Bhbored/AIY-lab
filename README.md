# HTTP and async learning lab

Requires Node.js and npm. From the project root, run:

```powershell
cd backend
npm.cmd install
npm.cmd start
```

Open **http://localhost:3001**. The backend serves the static frontend and API.

Run `npm.cmd test` from `backend/` to run the automated tests. See
[`WEEK2-LAB-GUIDE.md`](WEEK2-LAB-GUIDE.md) for the Week 2 walkthrough and
regression evidence.

## Verification

From `backend/`, `npm.cmd test` passed 19 tests with 0 failures. The timing tests confirm that ping responds while `/api/delay` is pending but waits for `/api/block` to finish. The invalid-JSON test confirms an HTTP 200 response whose body fails JSON parsing; the browser example labels this a parsing failure, separately from HTTP and network failures.

The unchanged idempotency regression test is active in that suite. [`regression-before.txt`](backend/evidence/regression-before.txt) records `node --test tests/idempotency.test.js` failing with `2 !== 1` when the middleware was removed; [`regression-after.txt`](backend/evidence/regression-after.txt) records the same command passing with the middleware restored. These historical files were not regenerated.

Browser controls still need a manual check after the final file moves: start the server, open `http://localhost:3001` with DevTools Network, and click **Delay + ping** and **Block + ping**. The result panel and Network timings should show a quick ping during the delay and a ping held until blocking work finishes. Click **200 invalid JSON**; expect HTTP 200 in Network and `response parsing / expected JSON` in the result panel. Check the Week 2 cancellation, timeout, status, and retry buttons as described in the guide.
