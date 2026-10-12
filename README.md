# HTTP lab

## Start the app

From the repository root in PowerShell:

```powershell
cd backend
npm.cmd install
npm.cmd start
```

Open `http://localhost:3000`. Keep the server terminal open. To restart automatically after backend edits, use `npm.cmd run dev` instead of `npm.cmd start`. The frontend has no build step.

## Run the tests

From `backend/` in PowerShell:

```powershell
npm.cmd test
node --test tests/idempotency.test.js
```

The first command runs all five Node tests. The second runs the idempotency regression test by itself. The separate event-loop example runs with `npm.cmd run async-order`.

## Where to see results

The **Latest result** panel at the bottom right of the main page shows results from the Week 1 and Week 2 demonstration buttons. **Network inspection: working versus failing** uses its own comparison table and does not update that panel.

For server request and operation logs, use **View recent server logs** near the top of the main page. That page opens in a new tab; click **Refresh logs** after running an example. It shows up to 30 recent events from the current server session. You can also inspect the requests in DevTools Network.
