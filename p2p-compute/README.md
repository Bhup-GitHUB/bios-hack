# 🌐 P2P Compute & File Sharing Platform

A peer-to-peer file sharing and distributed computing platform using WebRTC, Socket.IO, and Express.

## Features

- 📁 **P2P File Sharing** - Transfer files directly between peers without server storage
- ⚡ **Distributed Computing** - Run computational tasks across connected peers
- 🔒 **WebRTC Direct Connections** - Secure peer-to-peer data transfer
- 🌍 **Network Discovery** - Connect devices on the same local network
- 📱 **Mobile Support** - Works on phones, tablets, and computers

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

Open `http://localhost:3000` in your browser to get started!

## Usage

### Basic Setup

1. Start the server on one computer
2. Note the Network URL (e.g., `http://192.168.1.100:3000`)
3. Open that URL on other devices on the same network
4. Connect and start sharing files or running compute tasks!

### File Sharing

1. Click "📁 File Sharing" tab
2. Select a peer from the dropdown
3. Drag & drop files or click to select
4. Click "Send"

### Distributed Computing

1. Click "⚡ Compute Tasks" tab
2. Enter your data array (e.g., `[1, 2, 3, 4, 5]`)
3. Enter a function (e.g., `function(x) { return x * x; }`)
4. Click "Submit Task"

## Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start the production server
- `npm run dev` - Build and start in one command
- `npm run watch` - Watch TypeScript files for changes
- `npm run clean` - Remove build artifacts
- `npm run rebuild` - Clean and rebuild

## Architecture

```
┌─────────────────────┐
│   Browser Client    │
│   (SimplePeer +     │
│    Socket.IO)       │
└──────────┬──────────┘
           │
           │ WebSocket + WebRTC
           │
┌──────────▼──────────┐
│  Signaling Server   │
│  (Express +         │
│   Socket.IO)        │
└─────────────────────┘
           │
           │ P2P Connections
           │
┌──────────▼──────────┐
│   Peer Devices      │
│   (File Transfer +  │
│    Computation)     │
└─────────────────────┘
```

## Documentation

- [Quick Start Guide](./QUICK_START.md) - Detailed setup instructions
- [Testing Guide](./TESTING.md) - Comprehensive testing procedures

## Requirements

- Node.js >= 18.0.0
- Modern browser with WebRTC support (Chrome, Firefox, Safari, Edge)

## Network Configuration

### Firewall

Allow incoming connections on port 3000:

```bash
# Windows
netsh advfirewall firewall add rule name="P2P Compute" dir=in action=allow protocol=TCP localport=3000

# Linux (ufw)
sudo ufw allow 3000

# macOS
# System Preferences → Security & Privacy → Firewall → Firewall Options
```

### Custom Port

```bash
PORT=8080 npm start
```

## Troubleshooting

### Peers not connecting
- Ensure both devices are on the same network
- Check firewall settings
- Verify WebRTC is enabled in browser
- Check browser console (F12) for errors

### File transfer fails
- Try smaller files first
- Check available memory
- Ensure stable network connection

### Port already in use
```bash
# Find process using port 3000
# Windows
netstat -ano | findstr :3000

# macOS/Linux
lsof -i :3000

# Kill process or use different port
PORT=3001 npm start
```

## Technology Stack

- **Backend**: Node.js, Express.js, Socket.IO
- **P2P**: SimplePeer (WebRTC wrapper)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Build**: TypeScript

## Security Notes

- Files are transferred directly between peers (P2P)
- No encryption by default - consider adding for sensitive data
- Signaling server only coordinates connections
- Implement authentication for production use

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT

## Support

For issues, questions, or contributions, please open an issue on the repository.

---

**Happy P2P Computing! 🚀**
