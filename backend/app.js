import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import httpExamples from "./routes/http-examples.js";
import sessionRoutes from "./routes/session.js";
import timingRoutes from "./routes/timing.js";
import { createOperationsRouter } from "./routes/operations.js";
import { requestLog } from "./middleware/request-log.js";

const frontendDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../frontend");

export function createApp({ delayMs = 250, responseDelayMs = 900, logger = console.log } = {}) {
  const app = express();
  const operations = new Map();
  const idempotencyRecords = new Map();

  app.use(requestLog(logger));
  app.use(express.json());
  app.use("/api", httpExamples, sessionRoutes, timingRoutes);
  app.use("/api", createOperationsRouter({ operations, records: idempotencyRecords, delayMs, responseDelayMs, logger }));

  app.get("/", (req, res) => res.sendFile(path.join(frontendDirectory, "index.html")));
  app.use("/src", express.static(path.join(frontendDirectory, "src")));
  app.use("/features", express.static(path.join(frontendDirectory, "features")));
  app.use("/Utils", express.static(path.join(frontendDirectory, "Utils")));

  return { app, operations, idempotencyRecords };
}
