import { ComputeNodeConnection } from "./connection.js";
import { JobRequest, JobResult } from "../common/messages.js";

const conn = new ComputeNodeConnection((msg: JobRequest) => {
  console.log("Got job:", msg.jobId);
  console.log("Code:", msg.code);
  console.log("Params:", msg.params);

  const result: JobResult = {
    type: "JOB_RESULT",
    jobId: msg.jobId,
    result: { echo: msg.params ?? null },
  };

  conn.send(result);
});

console.log("Compute node started");

process.on("SIGINT", () => {
  console.log("\nShutting down compute node...");
  conn.close();
  process.exit(0);
});

