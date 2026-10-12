const rows = document.getElementById("log-rows");
const empty = document.getElementById("empty-logs");
const state = document.getElementById("log-state");
const refreshButton = document.getElementById("refresh-logs");
const clearButton = document.getElementById("clear-logs");
let entries = [];

function renderLogs() {
  rows.replaceChildren();
  empty.hidden = entries.length > 0;
  clearButton.disabled = entries.length === 0;

  for (const entry of entries) {
    const request = entry.type === "request";
    let event = entry.state;
    if (request)
      event = entry.event === "received" ? "received" : entry.outcome;
    const values = [
      new Date(entry.timestamp).toLocaleTimeString(),
      request ? "Request" : "Operation",
      event,
      request ? `${entry.method} ${entry.path}` : entry.operationId,
      request ? (entry.status ?? "—") : "—",
      request && entry.durationMs !== undefined
        ? `${entry.durationMs} ms`
        : "—",
      entry.correlationId,
      entry.keyId ?? "—",
    ];
    if (entry.replayed) values[2] += " (replayed)";

    const row = document.createElement("tr");
    for (const value of values) {
      const cell = document.createElement("td");
      // Log values stay text, even if a request path contains HTML characters.
      cell.textContent = value;
      row.append(cell);
    }
    rows.append(row);
  }
}

async function loadLogs() {
  refreshButton.disabled = true;
  clearButton.disabled = true;
  state.textContent = "Loading logs...";
  try {
    const response = await fetch("/api/logs", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    ({ entries } = await response.json());
    renderLogs();
    state.textContent = `${entries.length} of up to 30 recent events. Click Refresh logs to update.`;
  } catch (error) {
    state.textContent = `Could not load logs: ${String(error)}`;
  } finally {
    refreshButton.disabled = false;
    clearButton.disabled = entries.length === 0;
  }
}

async function clearLogs() {
  refreshButton.disabled = true;
  clearButton.disabled = true;
  state.textContent = "Clearing recent logs...";
  try {
    const response = await fetch("/api/logs", { method: "DELETE" });
    if (response.status !== 204) throw new Error(`HTTP ${response.status}`);
    entries = [];
    renderLogs();
    state.textContent = "Recent logs cleared. Terminal output is unchanged.";
  } catch (error) {
    state.textContent = `Could not clear logs: ${String(error)}`;
  } finally {
    refreshButton.disabled = false;
    clearButton.disabled = entries.length === 0;
  }
}

refreshButton.addEventListener("click", loadLogs);
clearButton.addEventListener("click", clearLogs);
loadLogs();
