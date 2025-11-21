import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from 'cors'

const app = express();
app.use(cors({ origin: "*" }));

const server = createServer(app);

// Initialize Socket.IO server with CORS enabled
const io = new Server(server, {
  cors: { origin: "*" }
});

app.get("/", ( req, res ) => {
  res.send("PeerShare Backend Server is Running")
} )

try {

  // Handle client connections
  io.on("connection", (socket) => {
    // Client joins a specific room
    socket.on("join-room", (roomID) => {
      socket.join(roomID);
      console.log(`Client ${socket.id} joined room ${roomID}`);
    });

    // Broadcast messages to all clients in the room
    socket.on("send-message", (data) => {
      io.to(data.roomID).emit("receive-message", data);
    });

    // Handle file transfers - forward to all clients in the room
    socket.on("send-file", (meta, buffer) => {
      io.to(meta.roomID).emit("receive-file", meta, buffer);
    });

    // Handle client disconnection
    socket.on("disconnect", () => {
      console.log(`Client ${socket.id} disconnected`);
    });
  });

} catch (error: any) {
  console.error("There was an error in making connection", error);
}


server.listen(8080, () => {
  console.log("Server is running at http://localhost:8080");
});
