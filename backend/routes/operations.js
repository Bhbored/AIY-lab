import { Router } from "express";
import { idempotency } from "../middleware/idempotency.js";

export function createOperationsRouter({ operations, records, delayMs, responseDelayMs, logger }) {
  const router = Router();

  router.post("/operations", (req, res, next) => {
    const { operationId, productId } = req.body ?? {};
    if (
      typeof operationId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(operationId) ||
      !["notebook", "pen", "broken-item"].includes(productId) ||
      Object.keys(req.body ?? {}).some((key) => !["operationId", "productId"].includes(key))
    ) {
      return res.status(400).json({ ok: false, message: "Use a UUID operationId and productId (notebook, pen or broken-item)." });
    }
    next();
  }, idempotency(records), (req, res) => {
    const { operationId, productId } = req.body;

    if (operations.has(operationId)) {
      records.delete(req.get("Idempotency-Key"));
      return res.status(409).json({ ok: false, message: "Operation ID already exists", operationId });
    }

    const operation = { id: operationId, productId, state: "pending" };
    operations.set(operationId, operation);
    logger({ type: "operation", operationId, state: "started", keyId: req.keyId, correlationId: req.correlationId });

    // The work is independent of the HTTP connection, so a client timeout cannot undo it.
    setTimeout(() => {
      operation.state = productId === "broken-item" ? "failed" : "completed";
      const status = operation.state === "completed" ? 201 : 500;
      const result = { ok: operation.state === "completed", operation: { ...operation } };
      if (req.idempotencyRecord) {
        req.idempotencyRecord.state = operation.state;
        req.idempotencyRecord.status = status;
        req.idempotencyRecord.result = result;
      }
      logger({ type: "operation", operationId, state: operation.state, keyId: req.keyId, correlationId: req.correlationId });
      setTimeout(() => {
        if (!res.destroyed) res.status(status).json(result);
      }, responseDelayMs);
    }, delayMs);
  });

  router.get("/operations/:id", (req, res) => {
    const operation = operations.get(req.params.id);
    if (!operation) return res.status(404).json({ ok: false, message: "Operation not found" });
    res.json({ ok: operation.state === "completed", operation: { ...operation } });
  });

  return router;
}
