import { ClientConnection } from "./connection.js";
import { JobRequest } from "../common/messages.js";

const conn = new ClientConnection((msg) => {
  console.log("Got message from node:", msg);
});

setTimeout(() => {
  const job: JobRequest = {
    type: "JOB_REQUEST",
    jobId: "job-1",
    code: "return a + b;",
    params: { a: 3, b: 4 },
  };

  conn.send(job);
  console.log("Sent job:", job);
}, 3000);

process.on("SIGINT", () => {
  console.log("\nShutting down client...");
  conn.close();
  process.exit(0);
});

