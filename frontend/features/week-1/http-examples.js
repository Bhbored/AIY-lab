import { HTTP_STATUS } from "../../Utils/http-status.js";

export async function showSuccess(inspectResult, setUsers) {
  let response;
  try {
    response = await fetch("/api/users");
    const body = await response.json();
    setUsers(body.users);
    inspectResult("Success", {
      status: response.status,
      expectedStatus: HTTP_STATUS.OK,
      responseOk: response.ok,
      applicationOk: body.ok,
      body,
      failureType: null,
    });
  } catch (error) {
    inspectResult("Success", {
      status: response?.status ?? null,
      responseOk: response?.ok ?? null,
      applicationOk: null,
      body: null,
      failureType: response ? "response parsing" : "fetch rejected",
      error: String(error),
    });
  }
}

export async function showNotFound(inspectResult) {
  let response;
  try {
    response = await fetch("/api/users/999");
    const body = await response.text();
    inspectResult("HTTP 404", {
      status: response.status,
      expectedStatus: HTTP_STATUS.NOT_FOUND,
      responseOk: response.ok,
      applicationOk: null,
      body,
      failureType:
        response.status === HTTP_STATUS.NOT_FOUND ? "HTTP status" : null,
    });
  } catch (error) {
    inspectResult("HTTP 404", {
      status: response?.status ?? null,
      responseOk: response?.ok ?? null,
      applicationOk: null,
      body: null,
      failureType: response ? "response reading" : "fetch rejected",
      error: String(error),
    });
  }
}

export async function showConnectionFailure(inspectResult) {
  try {
    const response = await fetch("http://127.0.0.1:59999/no-server");
    inspectResult("Closed port", {
      status: response.status,
      responseOk: response.ok,
      applicationOk: null,
      body: null,
      failureType: null,
    });
  } catch (error) {
    inspectResult("Closed port", {
      status: null,
      responseOk: null,
      applicationOk: null,
      body: null,
      failureType: "fetch rejected; no HTTP response",
      error: String(error),
    });
  }
}

export async function showApplicationFailure(inspectResult) {
  let response;
  try {
    response = await fetch("/api/application-failure", { method: "POST" });
    const body = await response.json();
    inspectResult("Application failure", {
      status: response.status,
      responseOk: response.ok,
      applicationOk: body?.ok === true,
      body,
      failureType: response.ok ? "application operation" : "HTTP status",
    });
  } catch (error) {
    inspectResult("Application failure", {
      status: response?.status ?? null,
      responseOk: response?.ok ?? null,
      applicationOk: null,
      body: null,
      failureType: response ? "response parsing" : "fetch rejected",
      error: String(error),
    });
  }
}

export async function showInvalidJson(inspectResult) {
  let response;
  try {
    response = await fetch("/api/invalid-json");
    // Fetch can succeed with HTTP 200 while JSON parsing still throws.
    const body = await response.json();
    inspectResult("Invalid JSON", {
      status: response.status,
      responseOk: response.ok,
      applicationOk: body.ok ?? null,
      body,
      failureType: null,
    });
  } catch (error) {
    inspectResult("Invalid JSON", {
      status: response?.status ?? null,
      responseOk: response?.ok ?? null,
      applicationOk: null,
      body: null,
      failureType: response
        ? "response parsing / expected JSON"
        : "fetch rejected",
      error: String(error),
    });
  }
}
