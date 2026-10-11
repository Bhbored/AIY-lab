export async function runLoginPair(inspectResult) {
  const results = [];
  for (const [label, password] of [
    ["working", "lab-pass"],
    ["failing", "bad-pass"],
  ]) {
    const started = performance.now();
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "lab-user", password }),
      });
      results.push({
        case: label,
        status: response.status,
        response: await response.json(),
        elapsedMs: Math.round(performance.now() - started),
      });
    } catch (error) {
      results.push({
        case: label,
        failureType: "network or parsing",
        error: String(error),
      });
    }
  }
  inspectResult("Login comparison", results);
}
