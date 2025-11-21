import express, { Request, Response } from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import os from "os";
import {
  PeerInfo,
  Task,
  TaskResult,
  SignalData,
  RegisterData,
} from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 50 * 1024 * 1024, // 50MB for file transfers
});

const PORT = process.env.PORT || 3000;

// Store connected peers
const peers = new Map<string, PeerInfo>();
const rooms = new Map<string, Set<string>>();

// Get local IP address
function getLocalIPAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;

    for (const details of iface) {
      if (details.family === "IPv4" && !details.internal) {
        return details.address;
      }
    }
  }
  return "localhost";
}

const localIP = getLocalIPAddress();

app.use(express.static(join(__dirname, "../public")));

app.get("/", (req: Request, res: Response) => {
  res.sendFile(join(__dirname, "../public/index.html"));
});

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    peers: peers.size,
    rooms: rooms.size,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/peers", (req: Request, res: Response) => {
  res.json({
    peers: Array.from(peers.values()),
    count: peers.size,
  });
});

app.get("/api/rooms", (req: Request, res: Response) => {
  const roomsData = Array.from(rooms.entries()).map(([roomId, peerSet]) => ({
    roomId,
    peerCount: peerSet.size,
    peers: Array.from(peerSet),
  }));
  res.json({
    rooms: roomsData,
    count: rooms.size,
  });
});

io.on("connection", (socket: Socket) => {
  console.log(
    `✅ Peer connected: ${socket.id} from ${socket.handshake.address}`
  );

  // Register peer
  socket.on("register", (data: RegisterData) => {
    try {
      peers.set(socket.id, {
        id: socket.id,
        name: data.name || "Anonymous",
        capabilities: data.capabilities || {},
        connectedAt: new Date(),
      });

      console.log(`📝 Peer registered: ${data.name} (${socket.id})`);
      io.emit("peers-update", Array.from(peers.values()));
    } catch (error) {
      console.error(`❌ Error registering peer ${socket.id}:`, error);
      socket.emit("error", { message: "Failed to register peer" });
    }
  });

  // Join a compute room
  socket.on("join-room", (roomId: string) => {
    try {
      if (!roomId || typeof roomId !== "string") {
        console.error(`❌ Invalid room ID from ${socket.id}`);
        socket.emit("error", { message: "Invalid room ID" });
        return;
      }

      socket.join(roomId);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId)!.add(socket.id);

      // Notify others in room
      socket.to(roomId).emit("peer-joined", socket.id);
      console.log(
        `🚪 Peer ${socket.id} joined room ${roomId} (${
          rooms.get(roomId)!.size
        } peers)`
      );

      // Send current room peers to the joining peer
      const roomPeers = Array.from(rooms.get(roomId)!).filter(
        (id) => id !== socket.id
      );
      socket.emit("room-peers", roomPeers);
    } catch (error) {
      console.error(`❌ Error joining room ${roomId}:`, error);
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  // WebRTC signaling
  socket.on("signal", (data: SignalData) => {
    const { to, signal } = data;
    io.to(to).emit("signal", {
      from: socket.id,
      signal: signal,
    });
  });

  // Offer from initiator
  socket.on("offer", (data: SignalData) => {
    const { to, offer } = data;
    io.to(to).emit("offer", {
      from: socket.id,
      offer: offer,
    });
  });

  // Answer from receiver
  socket.on("answer", (data: SignalData) => {
    const { to, answer } = data;
    io.to(to).emit("answer", {
      from: socket.id,
      answer: answer,
    });
  });

  // ICE candidate exchange
  socket.on("ice-candidate", (data: SignalData) => {
    const { to, candidate } = data;
    io.to(to).emit("ice-candidate", {
      from: socket.id,
      candidate: candidate,
    });
  });

  // Compute task distribution
  socket.on("submit-task", (task: Task) => {
    try {
      const availablePeers = Array.from(peers.values()).filter(
        (peer) => peer.id !== socket.id
      );

      if (availablePeers.length === 0) {
        console.log(`⚠️ No peers available to process task ${task.id}`);
        socket.emit("task-error", {
          taskId: task.id,
          message: "No peers available",
        });
        return;
      }

      console.log(
        `📊 Task ${task.id} submitted by ${socket.id}, distributing to ${availablePeers.length} peers`
      );

      availablePeers.forEach((peer) => {
        io.to(peer.id).emit("task-assigned", {
          taskId: task.id,
          data: task,
          from: socket.id,
          assignedAt: new Date().toISOString(),
        });
      });
    } catch (error) {
      console.error(`❌ Error submitting task:`, error);
      socket.emit("error", { message: "Failed to submit task" });
    }
  });

  // Task result
  socket.on("task-result", (result: TaskResult) => {
    try {
      if (!result.to) {
        console.error(`❌ Task result missing 'to' field`);
        return;
      }
      console.log(
        `✅ Task ${result.taskId} completed, sending to ${result.to}`
      );
      io.to(result.to).emit("task-completed", {
        ...result,
        completedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`❌ Error sending task result:`, error);
    }
  });

  // File transfer events (relayed through signaling server)
  socket.on("file-offer", (data: { to: string; fileInfo: any }) => {
    try {
      if (!data.to || !data.fileInfo) {
        console.error(`❌ Invalid file offer from ${socket.id}`);
        socket.emit("error", { message: "Invalid file offer data" });
        return;
      }
      console.log(
        `📁 File offer from ${socket.id} to ${data.to}: ${
          data.fileInfo.name
        } (${(data.fileInfo.size / 1024 / 1024).toFixed(2)}MB)`
      );
      io.to(data.to).emit("file-offer", {
        from: socket.id,
        fileInfo: data.fileInfo,
      });
    } catch (error) {
      console.error(`❌ Error handling file offer:`, error);
    }
  });

  socket.on("file-accept", (data: { to: string }) => {
    try {
      console.log(`✅ File accepted by ${socket.id}, notifying ${data.to}`);
      io.to(data.to).emit("file-accept", {
        from: socket.id,
      });
    } catch (error) {
      console.error(`❌ Error handling file accept:`, error);
    }
  });

  socket.on("file-reject", (data: { to: string }) => {
    try {
      console.log(`❌ File rejected by ${socket.id}, notifying ${data.to}`);
      io.to(data.to).emit("file-reject", {
        from: socket.id,
      });
    } catch (error) {
      console.error(`❌ Error handling file reject:`, error);
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`❌ Peer disconnected: ${socket.id}`);
    peers.delete(socket.id);

    // Remove from all rooms
    rooms.forEach((roomPeers, roomId) => {
      if (roomPeers.has(socket.id)) {
        roomPeers.delete(socket.id);
        socket.to(roomId).emit("peer-left", socket.id);
      }
    });

    io.emit("peers-update", Array.from(peers.values()));
  });
});

server.listen(PORT, () => {
  console.log("\n🚀 ========================================");
  console.log("   P2P Compute & File Sharing Platform");
  console.log("   ========================================");
  console.log(`\n📡 Signaling server running on:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${localIP}:${PORT}`);
  console.log("\n💡 Share the Network URL with other devices on your network!");
  console.log("========================================\n");
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
