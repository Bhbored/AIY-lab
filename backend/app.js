import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import httpExamples from "./routes/http-examples.js";
import sessionRoutes from "./routes/session.js";
import timingRoutes from "./routes/timing.js";
import { createOperationsRouter } from "./routes/operations.js";
import { createLogsRouter } from "./routes/logs.js";
import { requestLog } from "./middleware/request-log.js";

const frontendDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../frontend",
);

export function createApp({
  delayMs = 700,
  responseDelayMs = 900,
  logger = console.log,
} = {}) {
  const app = express();
  const operations = new Map();
  const idempotencyRecords = new Map();
  const recentLogs = [];
  const recordLog = (entry) => {
    logger(entry);
    // Keep only useful API and operation events; loading the viewer should not fill it.
    if (
      entry.type === "operation" ||
      (entry.path?.startsWith("/api/") && entry.path !== "/api/logs")
    ) {
      recentLogs.push({ timestamp: new Date().toISOString(), ...entry });
      if (recentLogs.length > 30) recentLogs.shift();
    }
  };
  app.use(requestLog(recordLog));
  app.use(express.json());
  app.use("/api", httpExamples, sessionRoutes, timingRoutes);
  app.use("/api", createLogsRouter(recentLogs));
  app.use(
    "/api",
    createOperationsRouter({
      operations,
      records: idempotencyRecords,
      delayMs,
      responseDelayMs,
      logger: recordLog,
    }),
  );

  app.get("/", (req, res) =>
    res.sendFile(path.join(frontendDirectory, "index.html")),
  );
  app.use("/src", express.static(path.join(frontendDirectory, "src")));
  app.use(
    "/features",
    express.static(path.join(frontendDirectory, "features")),
  );
  app.use("/Utils", express.static(path.join(frontendDirectory, "Utils")));
  app.use("/logs", express.static(path.join(frontendDirectory, "logs")));

  return { app, operations, idempotencyRecords };
}
