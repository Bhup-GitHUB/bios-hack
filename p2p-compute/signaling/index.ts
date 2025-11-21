import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("client connected:", socket.id);

  socket.on("job_request", (data) => {
    socket.broadcast.emit("job_request", data);
  });

  socket.on("job_result", (data) => {
    socket.broadcast.emit("job_result", data);
  });

  socket.on("signal", (data) => {
    socket.broadcast.emit("signal", data);
  });

  socket.on("disconnect", () => {
    console.log("client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signaling server listening on :${PORT}`);
});

