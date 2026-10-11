import { createApp } from "./app.js";

const { app } = createApp({ logger: (entry) => console.log(JSON.stringify(entry)) });

app.listen(3001, () => {
  console.log("HTTP lab listening at http://localhost:3001");
});
