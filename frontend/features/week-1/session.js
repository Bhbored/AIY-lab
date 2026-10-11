import { HTTP_STATUS } from "../../Utils/http-status.js";

export async function login(
  inspectResult,
  username,
  password,
  setCookieMessage,
) {
  let response;
  try {
    response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const body = await response.json();
    const applicationOk = body?.ok === true;
    const loginSucceeded = response.ok && applicationOk;
    let failureType = null;
    if (response.status === HTTP_STATUS.UNAUTHORIZED) {
      failureType = "HTTP 401: invalid credentials";
    } else if (!response.ok) {
      failureType = "HTTP status";
    } else if (!applicationOk) {
      failureType = "application operation";
    }
    inspectResult("Login", {
      status: response.status,
      responseOk: response.ok,
      applicationOk,
      body,
      failureType,
    });
    setCookieMessage(
      loginSucceeded
        ? `document.cookie: ${document.cookie || "(empty)"} — session is HttpOnly; inspect Set-Cookie in Network.`
        : "Login failed. The server cleared the session cookie; click Read session to confirm.",
    );
  } catch (error) {
    setCookieMessage("Login result unavailable.");
    inspectResult("Login", {
      status: response?.status ?? null,
      responseOk: response?.ok ?? null,
      applicationOk: null,
      body: null,
      failureType: response ? "response parsing" : "fetch rejected",
      error: String(error),
    });
  }
}

export async function readSession(inspectResult) {
  let response;
  try {
    response = await fetch("/api/session");
    const body = await response.json();
    inspectResult("Session", {
      status: response.status,
      responseOk: response.ok,
      applicationOk: body.ok,
      body,
      failureType: body.ok ? null : "no session",
    });
  } catch (error) {
    inspectResult("Session", {
      status: response?.status ?? null,
      responseOk: response?.ok ?? null,
      applicationOk: null,
      body: null,
      failureType: response ? "response parsing" : "fetch rejected",
      error: String(error),
    });
  }
}
