import { io, Socket } from "socket.io-client";
import { AnyMessage } from "../common/messages.js";

const SIGNALING_URL = process.env.SIGNALING_URL || "http://localhost:3000";

export class ClientConnection {
  private socket: Socket;

  constructor(private onMessage: (msg: AnyMessage) => void) {
    this.socket = io(SIGNALING_URL);
    this.setupSocket();
  }

  private setupSocket() {
    this.socket.on("connect", () => {
      console.log("Client connected to signaling");
    });

    this.socket.on("job_result", (data: any) => {
      try {
        const msg: AnyMessage = JSON.parse(JSON.stringify(data));
        this.onMessage(msg);
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from signaling server");
    });
  }

  public send(msg: AnyMessage) {
    if (!this.socket.connected) {
      console.log("Socket not connected");
      return;
    }

    try {
      this.socket.emit("job_request", msg);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  public close() {
    this.socket.disconnect();
  }
}

