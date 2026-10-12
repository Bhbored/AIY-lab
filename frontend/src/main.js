import {
  showApplicationFailure,
  showConnectionFailure,
  showInvalidJson,
  showNotFound,
  showSuccess,
} from "../features/week-1/http-examples.js";
import { login, readSession } from "../features/week-1/session.js";
import { showBlocked, showDelay } from "../features/week-1/timing.js";
import {
  startDelayedRequest,
  cancelDelayedRequest,
} from "../features/week-2/cancellation.js";
import { tryClientTimeout } from "../features/week-2/timeout.js";
import {
  startOperation,
  checkOperation,
  retrySameKey,
  retryNewKey,
} from "../features/week-2/operations.js";
import { runComparison } from "../features/week-2/request-comparison.js";

function inspectResult(label, result) {
  document.getElementById("last-result").textContent =
    `${label}\n${JSON.stringify(result, null, 2)}`;
}

function setUsers(users) {
  const list = document.getElementById("users");
  list.replaceChildren();
  for (const user of users) {
    const item = document.createElement("li");
    item.textContent = `${user.name} (ID ${user.id})`;
    list.append(item);
  }
}

document.getElementById("load-users").onclick = () =>
  showSuccess(inspectResult, setUsers);
document.getElementById("wrong-url").onclick = () =>
  showNotFound(inspectResult);
document.getElementById("closed-port").onclick = () =>
  showConnectionFailure(inspectResult);
document.getElementById("application-failure").onclick = () =>
  showApplicationFailure(inspectResult);
document.getElementById("invalid-json").onclick = () =>
  showInvalidJson(inspectResult);
document.getElementById("read-session").onclick = () =>
  readSession(inspectResult);
document.getElementById("block-ping").onclick = () =>
  showBlocked(inspectResult);
document.getElementById("delay-ping").onclick = () => showDelay(inspectResult);
document.getElementById("start-delay").onclick = () =>
  startDelayedRequest(inspectResult);
document.getElementById("cancel-delay").onclick = cancelDelayedRequest;
document.getElementById("client-timeout").onclick = () =>
  tryClientTimeout(inspectResult);
document.getElementById("start-operation").onclick = () =>
  startOperation(inspectResult);
document.getElementById("check-operation").onclick = () =>
  checkOperation(inspectResult);
document.getElementById("retry-same-key").onclick = () =>
  retrySameKey(inspectResult);
document.getElementById("retry-new-key").onclick = () =>
  retryNewKey(inspectResult);
document.getElementById("compare-run").onclick = () =>
  runComparison(document.getElementById("comparison-failure").value);

document.getElementById("login-form").onsubmit = (event) => {
  event.preventDefault();
  login(
    inspectResult,
    document.getElementById("username-input").value,
    document.getElementById("password-input").value,
    (message) => {
      document.getElementById("cookie-message").textContent = message;
    },
  );
};
