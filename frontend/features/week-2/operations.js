let currentOperation;

function showIdentity() {
  document.getElementById("operation-id").textContent = currentOperation?.operationId ?? "None";
  document.getElementById("idempotency-key").textContent = currentOperation?.key ?? "None";
  document.getElementById("previous-operation-id").textContent = currentOperation?.previousOperationId ?? "None";
}

async function submitOperation(inspectResult, timeout) {
  const operation = currentOperation;
  const { operationId, key, productId } = operation;
  const showCurrentResult = (label, result) => {
    if (currentOperation === operation) inspectResult(label, result);
  };
  const controller = new AbortController();
  // The first request stops waiting before the server finishes and responds.
  const timer = timeout ? setTimeout(() => controller.abort(), 500) : null;
  let response;

  try {
    response = await fetch("/api/operations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify({ operationId, productId }),
      signal: controller.signal,
    });
    const body = await response.json();
    showCurrentResult("Operation request", {
      httpStatus: response.status,
      correlationId: response.headers.get("X-Correlation-ID"),
      replayed: response.headers.get("Idempotency-Replayed") === "true",
      body,
    });
  } catch (error) {
    let failureType = "network failure; server outcome unknown";
    if (error.name === "AbortError") {
      failureType = "client timeout; server outcome unknown";
    } else if (response) {
      failureType = "response parsing";
    }
    showCurrentResult("Operation request", {
      failureType,
      operationId,
      error: String(error),
    });
  } finally {
    // A settled request must not leave an abort timer running.
    if (timer) clearTimeout(timer);
  }
}

export function startOperation(inspectResult) {
  currentOperation = {
    operationId: crypto.randomUUID(),
    key: crypto.randomUUID(),
    productId: "notebook",
  };
  showIdentity();
  inspectResult("Operation request", { state: "waiting; client timeout is 500 ms" });
  return submitOperation(inspectResult, true);
}

export async function checkOperation(inspectResult) {
  if (!currentOperation) {
    inspectResult("Operation status", { message: "Start an operation first." });
    return;
  }

  const operation = currentOperation;
  const operationId = operation.operationId;
  let response;
  try {
    response = await fetch(`/api/operations/${operationId}`);
    if (currentOperation !== operation) return;
    inspectResult("Operation status", {
      httpStatus: response.status,
      correlationId: response.headers.get("X-Correlation-ID"),
      body: await response.json(),
    });
  } catch (error) {
    if (currentOperation !== operation) return;
    inspectResult("Operation status", {
      failureType: response ? "response parsing" : "network failure",
      operationId,
      error: String(error),
    });
  }
}

export function retrySameKey(inspectResult) {
  if (!currentOperation) {
    inspectResult("Retry", { message: "Start an operation first." });
    return;
  }
  // A retry must reuse both the key and request parameters.
  return submitOperation(inspectResult, false);
}

export function retryNewKey(inspectResult) {
  if (!currentOperation) {
    inspectResult("Unsafe retry", { message: "Start an operation first." });
    return;
  }

  const previousOperationId = currentOperation.operationId;
  currentOperation = {
    operationId: crypto.randomUUID(),
    key: crypto.randomUUID(),
    productId: currentOperation.productId,
    previousOperationId,
  };
  showIdentity();
  inspectResult("Unsafe retry", {
    previousOperationId,
    newOperationId: currentOperation.operationId,
    warning: "This may create a second operation.",
  });
  return submitOperation(inspectResult, false);
}
