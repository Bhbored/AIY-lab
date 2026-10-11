# Repository Guidelines

## Project Structure & Module Organization

`backend/server.js` starts the server; `backend/app.js` assembles Express and the static site. Keep API handlers in `backend/routes/`, request middleware in `backend/middleware/`, mock records in `backend/data/`, and tests in `backend/tests/`. `backend/scripts/async-order.js` is a standalone event-loop exercise. The site lives in `frontend/index.html`; its handlers and styles are in `frontend/src/`, with request examples in `frontend/features/` and constants in `frontend/Utils/`. There is no frontend build step.

## Build, Test, and Development Commands

Run these from the repository root in PowerShell:

```powershell
cd backend
npm.cmd install
npm.cmd start
```

Open `http://localhost:3000`. Use `npm.cmd run dev` instead of `start` to restart the server when backend files change. Run `npm.cmd test` for Node's built-in test suite, or `npm.cmd run async-order` for the event-loop example. There is no build command.

## Coding Style & Naming Conventions

Use two-space indentation, semicolons, double quotes, and ES modules (`import`/`export`), matching the existing JavaScript. Name route and feature files by topic in lowercase kebab case, such as `http-examples.js`. Keep API paths under `/api` and preserve the existing response shapes when reorganizing code. Keep browser code plain JavaScript; the frontend does not use React or Vite. No formatter or linter is configured.

## Testing Guidelines

Use `node:test` and `node:assert/strict` in `backend/tests/*.test.js`; `npm.cmd test` runs them. There is no coverage threshold. Tests should use isolated `createApp()` instances and temporary ports. After frontend changes, also try affected controls in a browser and inspect the Network panel.

## What's New Log

`WHATS_NEW.md` records the current app as a baseline. Whenever you implement a new feature, API route, UI control, or runnable example, update its "Changes after the baseline" section in the same task. Add a dated entry at the top that says what was added and how someone can try it. Replace the "No new features recorded yet" line when the first change is logged. Keep the baseline intact so readers can tell what was already present.

## Commits & Pull Requests

This workspace has no Git history to establish a commit convention. Use short, imperative commit subjects that name the change, such as `Group session routes`. In a pull request, describe the behavior changed, list the checks you ran, and include a screenshot when the page appearance changes.
