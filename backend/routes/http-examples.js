import { Router } from "express";
import { users } from "../data/users.js";

const router = Router();

router.get("/users", (req, res) => {
  res.status(200).json({
    ok: true,
    users,
  });
});

router.get("/invalid-json", (req, res) => {
  res.status(200).type("json").send('{ "ok": true, ');
});

router.post("/application-failure", (req, res) => {
  res
    .status(200)
    .json({ ok: false, message: "Operation could not be completed" });
});

export default router;
