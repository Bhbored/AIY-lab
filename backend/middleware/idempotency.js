export function idempotency(records) {
  return (req, res, next) => {
    const key = req.get("Idempotency-Key");
    if (!key || !/^[a-zA-Z0-9_-]{1,100}$/.test(key)) {
      return res.status(400).json({ ok: false, message: "Provide an Idempotency-Key (1-100 letters, numbers, _ or -)." });
    }

    // Validation permits only a UUID and demo product ID; no arbitrary body data is saved.
    const fingerprint = JSON.stringify([req.body.operationId, req.body.productId]);
    const existing = records.get(key);
    if (existing) {
      if (existing.fingerprint !== fingerprint) {
        return res.status(409).json({ ok: false, message: "Key was used with different parameters" });
      }
      if (existing.state === "processing") {
        return res.status(409).json({ ok: false, message: "Operation is still processing", operationId: existing.operationId });
      }
      return res.set("Idempotency-Replayed", "true").status(existing.status).json(existing.result);
    }

    // Reserve before asynchronous work so another request cannot start the same operation.
    const record = { fingerprint, operationId: req.body.operationId, state: "processing" };
    records.set(key, record);
    req.idempotencyRecord = record;
    next();
  };
}
