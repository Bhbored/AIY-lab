let delayedRequest;

export async function startDelayedRequest(inspectResult) {
  if (delayedRequest) return;

  delayedRequest = new AbortController();
  document.getElementById("cancel-delay").disabled = false;
  inspectResult("Manual cancellation", { state: "waiting for /api/delay" });

  try {
    const response = await fetch("/api/delay", { signal: delayedRequest.signal });
    inspectResult("Manual cancellation", {
      state: "completed",
      status: response.status,
      body: await response.json(),
    });
  } catch (error) {
    inspectResult("Manual cancellation", {
      failureType: error.name === "AbortError" ? "intentionally cancelled" : "network failure",
      error: String(error),
    });
  } finally {
    delayedRequest = null;
    document.getElementById("cancel-delay").disabled = true;
  }
}

export function cancelDelayedRequest() {
  delayedRequest?.abort();
}
