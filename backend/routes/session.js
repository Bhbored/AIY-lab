import { Router } from "express";

const router = Router();
const sessionValue = "learning-lab-session";
const cookieOptions = { httpOnly: true, sameSite: "lax", path: "/" };
router.post("/login", (req, res) => {
  if (!req.is("application/json")) {
    return res
      .status(415)
      .json({ ok: false, message: "Content-Type must be application/json" });
  }

  const valid =
    req.body?.username === "lab-user" && req.body?.password === "lab-pass";

  if (!valid) {
    res.clearCookie("session", cookieOptions);
    return res.status(401).json({ ok: false, message: "Invalid credentials" });
  }

  res.cookie("session", sessionValue, cookieOptions);
  return res.status(200).json({ ok: true, message: "Logged in" });
});

router.all("/login", (req, res) => {
  res.set("Allow", "POST");
  return res.status(405).json({ ok: false, message: "Use POST for login" });
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
