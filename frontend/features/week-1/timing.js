async function compare(label, slowPath, inspectResult) {
  const started = performance.now();
  async function measure(path) {
    try {
      const response = await fetch(path);
      return { status: response.status, body: await response.json(), elapsedMs: Math.round(performance.now() - started) };
    } catch (error) {
      return { failureType: "request or parsing", error: String(error) };
    }
  }

  // Start both fetches before awaiting either one so their completion times can be compared.
  const slowRequest = measure(slowPath);
  const pingRequest = measure("/api/ping");
  const [slow, ping] = await Promise.all([slowRequest, pingRequest]);
  inspectResult(label, { slow, ping });
}

export function showBlocked(inspectResult) {
  return compare("Block + ping", "/api/block", inspectResult);
}

export function showDelay(inspectResult) {
  return compare("Delay + ping", "/api/delay", inspectResult);
}
