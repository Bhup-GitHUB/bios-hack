import { io, Socket } from "socket.io-client";
import { AnyMessage, JobRequest, JobResult } from "../common/messages.js";

const SIGNALING_URL = process.env.SIGNALING_URL || "http://localhost:3000";

export class ComputeNodeConnection {
  private socket: Socket;

  constructor(private onJobMessage: (msg: JobRequest) => void) {
    this.socket = io(SIGNALING_URL);
    this.setupSocket();
  }

  private setupSocket() {
    this.socket.on("connect", () => {
      console.log("Compute node connected to signaling");
    });

    this.socket.on("job_request", (data: any) => {
      try {
        const msg: JobRequest = JSON.parse(JSON.stringify(data));
        if (msg.type === "JOB_REQUEST") {
          this.onJobMessage(msg);
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from signaling server");
    });
  }

  public send(msg: JobResult) {
    if (!this.socket.connected) {
      console.log("Socket not connected");
      return;
    }

    try {
      this.socket.emit("job_result", msg);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  public close() {
    this.socket.disconnect();
  }
}

