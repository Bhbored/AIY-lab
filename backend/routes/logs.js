import { Router } from "express";

export function createLogsRouter(recentLogs) {
  const router = Router();

  router.get("/logs", (req, res) => {
    res.set("Cache-Control", "no-store");
    res.json({ entries: recentLogs });
  });

  router.delete("/logs", (req, res) => {
    recentLogs.length = 0;
    res.status(204).end();
  });

  return router;
}
