import { Router } from "express";

const router = Router();

router.get("/block", (req, res) => {
  const started = Date.now();
  while (Date.now() - started < 2000) {}
  res.json({ ok: true, message: "Blocking work finished" });
});

router.get("/delay", async (req, res) => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  res.json({ ok: true, message: "Delay finished" });
});

router.get("/ping", (req, res) => {
  res.json({ ok: true, message: "Pong" });
});

export default router;
