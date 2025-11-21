import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';
import { PeerInfo, Task, TaskResult, SignalData, RegisterData } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
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
      if (details.family === 'IPv4' && !details.internal) {
        return details.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIPAddress();

app.use(express.static(join(__dirname, '../public')));

app.get('/', (req: Request, res: Response) => {
  res.sendFile(join(__dirname, '../public/index.html'));
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    peers: peers.size,
    rooms: rooms.size,
    uptime: process.uptime(),
  });
});

io.on('connection', (socket: Socket) => {
  console.log(`✅ Peer connected: ${socket.id}`);

  // Register peer
  socket.on('register', (data: RegisterData) => {
    peers.set(socket.id, {
      id: socket.id,
      name: data.name || 'Anonymous',
      capabilities: data.capabilities || {},
    });

    console.log(`📝 Peer registered: ${data.name} (${socket.id})`);
    io.emit('peers-update', Array.from(peers.values()));
  });

  // Join a compute room
  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId)!.add(socket.id);

    // Notify others in room
    socket.to(roomId).emit('peer-joined', socket.id);
    console.log(`🚪 Peer ${socket.id} joined room ${roomId}`);
  });

  // WebRTC signaling
  socket.on('signal', (data: SignalData) => {
    const { to, signal } = data;
    io.to(to).emit('signal', {
      from: socket.id,
      signal: signal,
    });
  });

  // Offer from initiator
  socket.on('offer', (data: SignalData) => {
    const { to, offer } = data;
    io.to(to).emit('offer', {
      from: socket.id,
      offer: offer,
    });
  });

  // Answer from receiver
  socket.on('answer', (data: SignalData) => {
    const { to, answer } = data;
    io.to(to).emit('answer', {
      from: socket.id,
      answer: answer,
    });
  });

  // ICE candidate exchange
  socket.on('ice-candidate', (data: SignalData) => {
    const { to, candidate } = data;
    io.to(to).emit('ice-candidate', {
      from: socket.id,
      candidate: candidate,
    });
  });

  // Compute task distribution
  socket.on('submit-task', (task: Task) => {
    const availablePeers = Array.from(peers.values()).filter(
      (peer) => peer.id !== socket.id
    );

    console.log(
      `📊 Task submitted, distributing to ${availablePeers.length} peers`
    );

    availablePeers.forEach((peer) => {
      io.to(peer.id).emit('task-assigned', {
        taskId: task.id,
        data: task,
        from: socket.id,
      });
    });
  });

  // Task result
  socket.on('task-result', (result: TaskResult) => {
    io.to(result.to!).emit('task-completed', result);
  });

  // File transfer events (relayed through signaling server)
  socket.on('file-offer', (data: { to: string; fileInfo: any }) => {
    io.to(data.to).emit('file-offer', {
      from: socket.id,
      fileInfo: data.fileInfo,
    });
  });

  socket.on('file-accept', (data: { to: string }) => {
    io.to(data.to).emit('file-accept', {
      from: socket.id,
    });
  });

  socket.on('file-reject', (data: { to: string }) => {
    io.to(data.to).emit('file-reject', {
      from: socket.id,
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`❌ Peer disconnected: ${socket.id}`);
    peers.delete(socket.id);

    // Remove from all rooms
    rooms.forEach((roomPeers, roomId) => {
      if (roomPeers.has(socket.id)) {
        roomPeers.delete(socket.id);
        socket.to(roomId).emit('peer-left', socket.id);
      }
    });

    io.emit('peers-update', Array.from(peers.values()));
  });
});

server.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log('   P2P Compute & File Sharing Platform');
  console.log('   ========================================');
  console.log(`\n📡 Signaling server running on:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${localIP}:${PORT}`);
  console.log('\n💡 Share the Network URL with other devices on your network!');
  console.log('========================================\n');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

