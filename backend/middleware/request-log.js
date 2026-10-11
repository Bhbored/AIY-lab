import { randomUUID, createHash } from "node:crypto";

export function requestLog(logger) {
  return (req, res, next) => {
    // A retry gets a new correlation ID. Its idempotency key can stay the same.
    req.correlationId = randomUUID();
    res.set("X-Correlation-ID", req.correlationId);
    const key = req.get("Idempotency-Key");
    req.keyId = key ? createHash("sha256").update(key).digest("hex").slice(0, 12) : null;
    const started = performance.now();
    const details = {
      type: "request",
      correlationId: req.correlationId,
      method: req.method,
      path: req.originalUrl.split("?")[0],
      keyId: req.keyId,
    };
    logger({ ...details, event: "received" });
    let logged = false;
    const write = () => {
      if (logged) return;
      logged = true;
      const completed = res.writableFinished;
      logger({
        ...details,
        event: "finished",
        status: completed ? res.statusCode : null,
        durationMs: Math.round(performance.now() - started),
        replayed: res.getHeader("Idempotency-Replayed") === "true",
        outcome: completed ? "completed" : req.aborted ? "aborted" : "disconnected",
      });
    };
    res.once("finish", write);
    res.once("close", write);
    next();
  };
}
