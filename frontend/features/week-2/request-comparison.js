const working = {
  method: "POST",
  path: "/api/login",
  contentType: "application/json",
  body: { username: "lab-user", password: "lab-pass" },
  shownBody: '{"username":"lab-user","password":"[valid demo value]"}',
};

const failures = {
  password: {
    ...working,
    body: { username: "lab-user", password: "bad-pass" },
    shownBody: '{"username":"lab-user","password":"[wrong demo value]"}',
  },
  method: { ...working, method: "PUT" },
  url: { ...working, path: "/api/missing-login" },
  header: { ...working, contentType: "text/plain" },
  body: {
    ...working,
    body: { username: "lab-user" },
    shownBody: '{"username":"lab-user"}',
  },
};

const fields = [
  "method", "url", "request-headers", "request-body",
  "status", "response-headers", "response-body", "timing",
];

function showRequest(column, details) {
  for (const field of fields) {
    document.getElementById(`${column}-${field}`).textContent = details?.[field] ?? "";
  }
}

async function send(request) {
  const url = new URL(request.path, location.origin).href;
  const details = {
    method: request.method,
    url,
    "request-headers": `Content-Type: ${request.contentType}`,
    "request-body": request.shownBody,
  };
  const started = performance.now();

  try {
    const response = await fetch(url, {
      method: request.method,
      headers: { "Content-Type": request.contentType },
      body: JSON.stringify(request.body),
      credentials: "omit",
    });
    const body = await response.text();
    return {
      ...details,
      status: String(response.status),
      "response-headers": [
        `Content-Type: ${response.headers.get("Content-Type") ?? "(none)"}`,
        `X-Correlation-ID: ${response.headers.get("X-Correlation-ID") ?? "(none)"}`,
        response.headers.has("Allow") ? `Allow: ${response.headers.get("Allow")}` : null,
      ].filter(Boolean).join("\n"),
      "response-body": body,
      timing: `${Math.round(performance.now() - started)} ms`,
    };
  } catch (error) {
    return {
      ...details,
      status: "No HTTP response",
      "response-headers": "",
      "response-body": String(error),
      timing: `${Math.round(performance.now() - started)} ms`,
    };
  }
}

export async function runComparison(failure) {
  const button = document.getElementById("compare-run");
  const state = document.getElementById("comparison-state");
  button.disabled = true;
  state.textContent = "Sending the working request, then the selected failure...";
  showRequest("working", null);
  showRequest("failing", null);

  try {
    const good = await send(working);
    const bad = await send(failures[failure]);
    showRequest("working", good);
    showRequest("failing", bad);
    state.textContent = `Compared HTTP ${good.status} with ${bad.status}. Inspect both requests in Network or your proxy.`;
  } finally {
    button.disabled = false;
  }
}
