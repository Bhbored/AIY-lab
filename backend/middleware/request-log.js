import { randomUUID, createHash } from "node:crypto";

export function requestLog(logger) {
  return (req, res, next) => {
    req.correlationId = randomUUID();
    res.set("X-Correlation-ID", req.correlationId);
    const key = req.get("Idempotency-Key");
    req.keyId = key ? createHash("sha256").update(key).digest("hex").slice(0, 12) : null;
    const started = performance.now();
    let logged = false;
    const write = () => {
      if (logged) return;
      logged = true;
      const completed = res.writableFinished;
      logger({
        type: "request",
        correlationId: req.correlationId,
        method: req.method,
        path: req.originalUrl.split("?")[0],
        status: completed ? res.statusCode : null,
        durationMs: Math.round(performance.now() - started),
        keyId: req.keyId,
        outcome: completed ? "completed" : req.aborted ? "aborted" : "disconnected",
      });
    };
    res.once("finish", write);
    res.once("close", write);
    next();
  };
}
