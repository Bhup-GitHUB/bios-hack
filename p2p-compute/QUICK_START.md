# 🚀 Quick Start Guide

## Step-by-Step Setup

### 1️⃣ Install Dependencies

```bash
npm install
```

This will install:
- TypeScript and type definitions
- Express.js (web server)
- Socket.IO (signaling server)
- Simple-Peer (WebRTC wrapper)
- Other dependencies

### 2️⃣ Build the Project

```bash
npm run build
```

This compiles TypeScript files from `src/` to JavaScript in `dist/` directory.

### 3️⃣ Start the Server

```bash
npm start
```

You'll see:
```
🚀 ========================================
   P2P Compute & File Sharing Platform
   ========================================

📡 Signaling server running on:
   Local:   http://localhost:3000
   Network: http://192.168.1.100:3000

💡 Share the Network URL with other devices on your network!
========================================
```

### 4️⃣ Connect from Browser

#### On the Same Computer:
- Open browser: `http://localhost:3000`

#### On Another Device (Same Network):
- Copy the Network URL from step 3
- Open it on another computer/phone/tablet
- Example: `http://192.168.1.100:3000`

### 5️⃣ Start Sharing!

1. **Enter your name** on both devices
2. **Click "Connect to Network"**
3. Wait for peers to appear in "Connected Peers"
4. **Share files** or **run compute tasks**!

---

## 📁 Sharing Files Between Two PCs

### PC 1 (Server Computer):
```bash
cd p2p-compute
npm install
npm run build
npm start
```

Note the Network URL: `http://192.168.1.100:3000`

### PC 2 (Client Computer):
1. Open browser
2. Go to: `http://192.168.1.100:3000` (use the IP from PC1)
3. Enter your name (e.g., "PC-2")
4. Click "Connect to Network"

### PC 1 (Browser):
1. Open browser on PC1
2. Go to: `http://localhost:3000`
3. Enter your name (e.g., "PC-1")
4. Click "Connect to Network"

### Share Files:
1. On PC1: Click "📁 File Sharing" tab
2. Select "PC-2" from the dropdown
3. Drag & drop files or click to select
4. Click "Send"
5. PC2 will receive the files directly via P2P!

---

## 🔧 Troubleshooting

### "Port 3000 already in use"
```bash
# Use a different port
PORT=3001 npm start
```

### "Cannot connect from other PC"
1. **Check firewall**: Allow port 3000
   - Windows: Windows Defender Firewall → Allow an app
   - Mac: System Preferences → Security & Privacy → Firewall
   - Linux: `sudo ufw allow 3000`

2. **Check same network**: Both devices must be on same WiFi/LAN

3. **Check IP address**: Use `ipconfig` (Windows) or `ifconfig` (Mac/Linux) to verify

### "Peers not connecting"
1. Refresh both browsers
2. Check browser console (F12) for errors
3. Ensure WebRTC is enabled in browser
4. Try different browser (Chrome/Firefox recommended)

---

## 💡 Tips

### Expose to Network (npx-style)
Want others to access easily? Share your Network URL!

```bash
# Your computer's IP
Windows: ipconfig
Mac/Linux: ifconfig

# Share this with others
http://YOUR_IP:3000
```

### Run on Different Port
```bash
PORT=8080 npm start
```

### Auto-restart on Changes (Development)
Terminal 1:
```bash
npm run watch
```

Terminal 2:
```bash
nodemon dist/server.js
```

---

## 🌐 Access from Phone

1. Ensure phone is on same WiFi
2. Open browser on phone
3. Type: `http://192.168.1.100:3000` (your computer's IP)
4. Connect and share!

---

## 📊 Example Use Cases

### File Sharing
- Share photos from phone to PC
- Transfer documents between computers
- Send files without USB/email

### Distributed Computing
- Split large calculations across multiple devices
- Parallel data processing
- Distributed rendering/encoding

---

## ❓ Common Questions

**Q: Is this like ngrok or localtunnel?**  
A: Similar! But instead of cloud tunneling, it uses local network P2P connections.

**Q: Can I use this over the internet?**  
A: Yes, but you need to set up port forwarding on your router and use your public IP.

**Q: Is it secure?**  
A: Files are transferred directly P2P (not through server), but there's no encryption by default. Consider adding HTTPS/encryption for sensitive data.

**Q: What's the file size limit?**  
A: Depends on browser memory. Tested up to 500MB. For larger files, implement streaming chunks.

---

## 🎉 You're Ready!

Start sharing files and computing tasks across your network! 🚀

