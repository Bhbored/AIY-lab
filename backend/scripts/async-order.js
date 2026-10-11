import fs from "node:fs";

console.log("sync: start");

process.nextTick(() => console.log("nextTick: Node special queue"));
Promise.resolve().then(() => console.log("Promise: microtask"));
setTimeout(() => console.log("timer: timers phase"), 0);
setImmediate(() => console.log("immediate: check phase"));

console.log("sync: end");

fs.readFile(new URL(import.meta.url), (error) => {
  if (error) throw error;
  console.log("I/O: file read finished");

  setTimeout(() => console.log("I/O timer"), 0);
  setImmediate(() => console.log("I/O immediate"));
});
