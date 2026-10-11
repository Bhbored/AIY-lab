export async function tryClientTimeout(inspectResult) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 400);

  try {
    const response = await fetch("/api/delay", { signal: controller.signal });
    inspectResult("Client timeout", { state: "completed", status: response.status });
  } catch (error) {
    // A timeout ends this client's wait; it does not prove the server stopped working.
    inspectResult("Client timeout", {
      failureType: error.name === "AbortError" ? "client timeout" : "network failure",
      error: String(error),
    });
  } finally {
    clearTimeout(timer);
  }
}
