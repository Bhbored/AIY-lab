import { Router } from "express";

const router = Router();
const sessionValue = "learning-lab-session";
const cookieOptions = { httpOnly: true, sameSite: "lax", path: "/" };

router.post("/login", (req, res) => {
  const valid =
    req.body?.username === "lab-user" && req.body?.password === "lab-pass";

  if (!valid) {
    res.clearCookie("session", cookieOptions);
    return res.status(401).json({ ok: false, message: "Invalid credentials" });
  }

  res.cookie("session", sessionValue, cookieOptions);
  return res.status(200).json({ ok: true, message: "Logged in" });
});

router.get("/session", (req, res) => {
  const cookieParts = (req.headers.cookie || "")
    .split(";")
    .map((part) => part.trim());
  const sessionCookie = cookieParts.find((part) => part.startsWith("session="));
  const value = sessionCookie?.slice("session=".length);
  const hasSession = typeof value === "string" && value === sessionValue;
  res.json({ ok: hasSession, hasSession });
});

export default router;
