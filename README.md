# bios-hack
WebSocket server using Express.js and ws library

## Quick Start with Docker

### Prerequisites
- Docker installed on your system
- Docker Compose installed (usually comes with Docker Desktop)

### Steps to Run:

1. **Open terminal/command prompt** in this project folder

2. **Start the server:**
   ```bash
   docker compose up
   ```

   Or to run in background:
   ```bash
   docker compose up -d
   ```

3. **The WebSocket server will be available at:**
   - `ws://localhost:3000`

4. **To stop the server:**
   ```bash
   docker compose down
   ```

### What happens:
- Docker will automatically build the image
- Install all dependencies
- Start the WebSocket server on port 3000
- The server will restart automatically if it crashes

### Testing:
You can test the WebSocket connection using any WebSocket client or tools like:
- Browser console
- `wscat` (npm install -g wscat, then: `wscat -c ws://localhost:3000`)
- Postman
- Any WebSocket testing tool
