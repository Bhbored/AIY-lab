export async function tryClientTimeout(inspectResult) {
  const controller = new AbortController();

  const timer = setTimeout(() => controller.abort(), 400);

  try {
    const response = await fetch("/api/delay", { signal: controller.signal });
    inspectResult("Client timeout", {
      state: "completed",
      status: response.status,
    });
  } catch (error) {
    inspectResult("Client timeout", {
      failureType:
        error.name === "AbortError" ? "client timeout" : "network failure",
      error: String(error),
    });
  } finally {
    clearTimeout(timer);
  }
}
