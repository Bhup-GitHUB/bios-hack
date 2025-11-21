# 🌐 P2P File Sharing & Compute Platform

A peer-to-peer platform for file sharing and distributed computing using WebRTC and Socket.IO. Connect multiple devices on the same network and share files or distribute computational tasks directly between peers.

## ✨ Features

- **🔗 P2P Connections**: Direct peer-to-peer connections using WebRTC
- **📁 File Sharing**: Send and receive files directly between peers
- **⚡ Distributed Computing**: Distribute computational tasks across connected peers
- **🌍 Network Access**: Connect from any device on your local network
- **🎨 Beautiful UI**: Modern, responsive interface with real-time updates
- **🔒 Secure**: Direct P2P connections with STUN servers

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

1. **Clone or navigate to the project directory:**

```bash
cd p2p-compute
```

2. **Install dependencies:**

```bash
npm install
```

3. **Build the TypeScript project:**

```bash
npm run build
```

4. **Start the server:**

```bash
npm start
```

The server will start and display:
```
🚀 ========================================
   P2P Compute & File Sharing Platform
   ========================================

📡 Signaling server running on:
   Local:   http://localhost:3000
   Network: http://192.168.1.XXX:3000

💡 Share the Network URL with other devices on your network!
========================================
```

## 📱 Connecting from Different Devices

### Same Computer (Localhost)
Open your browser and go to: `http://localhost:3000`

### Different Computer on Same Network
1. Note the Network URL from the server startup message (e.g., `http://192.168.1.100:3000`)
2. On another device on the same network, open a browser
3. Navigate to the Network URL
4. Both devices will connect to the signaling server and can establish P2P connections

### Mobile Devices
- Ensure your mobile device is on the same WiFi network
- Enter the Network URL in your mobile browser
- Accept any security warnings (if self-hosting)

## 💻 Usage

### File Sharing

1. **Connect to Network:**
   - Enter your name
   - Click "Connect to Network"

2. **Select a Peer:**
   - Wait for other peers to connect
   - Select a peer from the dropdown

3. **Send Files:**
   - Drag and drop files into the drop zone
   - Or click to select files
   - Click "Send" to transfer files directly to the peer

### Distributed Computing

1. **Navigate to Compute Tab:**
   - Click on "⚡ Compute Tasks" tab

2. **Submit a Task:**
   - Enter data as JSON array (e.g., `[1, 2, 3, 4, 5]`)
   - Enter a JavaScript function (e.g., `function(x) { return x * x; }`)
   - Click "Submit Task"

3. **View Results:**
   - Results appear in the "Task Results" section
   - Shows which peer processed the task

## 🏗️ Project Structure

```
p2p-compute/
├── src/
│   ├── server.ts          # Express + Socket.IO signaling server
│   ├── P2PClient.ts       # P2P client library with file transfer
│   └── types.ts           # TypeScript type definitions
├── public/
│   └── index.html         # Web interface
├── dist/                  # Compiled JavaScript (generated)
├── package.json           # Project configuration
├── tsconfig.json          # TypeScript configuration
└── README.md             # This file
```

## 🔧 Development

### Watch Mode
Run TypeScript compiler in watch mode:
```bash
npm run watch
```

In another terminal:
```bash
npm start
```

### Rebuild
Clean and rebuild the project:
```bash
npm run rebuild
```

## 📚 API Reference

### P2PClient

```typescript
import { P2PClient } from './P2PClient';

const client = new P2PClient('http://localhost:3000');

// Register with name
client.register('MyPeer');

// Join a room
client.joinRoom('default-room');

// Send file to peer
await client.sendFile(peerId, file);

// Submit compute task
const taskId = client.submitTask([1, 2, 3], (x) => x * 2);

// Handle events
client.onPeerConnected = (peerId) => {
  console.log('Peer connected:', peerId);
};

client.onFileReceived = (file, fromPeer) => {
  console.log('File received:', file.name);
};

client.onTaskCompleted = (result) => {
  console.log('Task result:', result);
};
```

## 🌐 Network Configuration

### Firewall Settings
Ensure port 3000 (or your custom port) is open on your firewall for both TCP and UDP traffic.

### Port Forwarding (Optional)
For connections outside your local network:
1. Forward port 3000 on your router to your server's local IP
2. Use your public IP address to connect from outside networks
3. Consider security implications before exposing to the internet

### STUN/TURN Servers
The application uses public STUN servers by default:
- `stun:stun.l.google.com:19302`
- `stun:global.stun.twilio.com:3478`

For better NAT traversal, consider setting up your own TURN server.

## 🛠️ Environment Variables

```bash
PORT=3000                    # Server port (default: 3000)
```

## 📝 Technical Details

### WebRTC Data Channels
- Files are transferred in 256KB chunks
- Progress tracking for uploads and downloads
- Automatic chunking and reassembly

### Socket.IO Signaling
- Handles WebRTC signaling (SDP offers/answers, ICE candidates)
- Room-based peer discovery
- Automatic reconnection

### Security Considerations
- Direct P2P connections bypass the server after initial signaling
- Files are transferred directly between peers
- Consider implementing encryption for sensitive data
- No built-in authentication (implement as needed)

## 🐛 Troubleshooting

### Peers Not Connecting
- Ensure both devices are on the same network
- Check firewall settings
- Try disabling VPN/proxy
- Check browser console for errors

### File Transfer Fails
- Large files may take time to transfer
- Check browser memory limits
- Ensure stable network connection
- Try smaller files first

### Port Already in Use
```bash
# Change the port
PORT=3001 npm start
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🎯 Future Enhancements

- [ ] End-to-end encryption for file transfers
- [ ] User authentication and authorization
- [ ] File transfer resumption
- [ ] Video/audio streaming
- [ ] Chat functionality
- [ ] Persistent peer directory
- [ ] Docker deployment
- [ ] Mobile apps (React Native)

## 💡 Use Cases

- **File Sharing**: Share large files without cloud storage
- **Distributed Computing**: Parallelize computational tasks
- **Local Collaboration**: Work together on the same network
- **IoT Communication**: Connect IoT devices directly
- **Edge Computing**: Process data at the edge

---

Made with ❤️ using WebRTC, Socket.IO, and TypeScript

