# P2P Compute System

A peer-to-peer compute system using WebRTC for distributed job execution.

## Project Structure

```
p2p-compute/
├── common/           # Shared types/interfaces
├── signaling/        # Signaling server
├── client/           # Friend's side (sends jobs)
└── compute-node/     # Your PC side (receives jobs, runs them)
```

## Setup

1. Install dependencies:
```bash
npm install
```

That's it! No native dependencies required. The system uses WebSockets through Socket.io instead of WebRTC, which works on all platforms without build tools.

## Phases

### Phase 1: ✅ Setup + Common Types
- Project structure
- TypeScript configuration
- Shared message types

### Phase 2: ✅ Signaling Server
- Socket.io signaling server
- WebRTC offer/answer relay

### Phase 3: ✅ Compute Node
- WebRTC receiver side
- Data channel handling

### Phase 4: ✅ Client
- WebRTC sender side
- Job submission

## How to Test

### Step 1: Start the Signaling Server

Open Terminal 1:
```bash
npm run signaling
```

You should see:
```
Signaling server listening on :3000
```

### Step 2: Start the Compute Node

Open Terminal 2:
```bash
npm run node
```

You should see:
```
Compute node started
Compute node connected to signaling
```

### Step 3: Start the Client

Open Terminal 3:
```bash
npm run client
```

You should see:
```
Client connected to signaling
```

### Expected Flow:

1. **Client connects** to signaling server
2. **Client creates** WebRTC offer
3. **Signaling server** relays offer to compute node
4. **Compute node** creates answer
5. **Signaling server** relays answer to client
6. **WebRTC connection** established
7. **Data channel** opens
8. **Client sends** job request after 3 seconds
9. **Compute node** receives job and sends result back
10. **Client receives** job result

### Expected Output:

**Terminal 1 (Signaling):**
```
client connected: <socket-id-1>
client connected: <socket-id-2>
```

**Terminal 2 (Compute Node):**
```
Compute node started
Compute node connected to signaling
Data channel connected on compute node
Got job: job-1
Code: return a + b;
Params: { a: 3, b: 4 }
```

**Terminal 3 (Client):**
```
Client connected to signaling
Data channel connected on client
Sent job: { type: 'JOB_REQUEST', jobId: 'job-1', ... }
Got message from node: { type: 'JOB_RESULT', jobId: 'job-1', result: { echo: { a: 3, b: 4 } } }
```

### Troubleshooting:

- **Port 3000 already in use**: Change port with `PORT=3001 npm run signaling`
- **Connection fails**: Make sure signaling server is running first
- **No data channel**: Wait a few seconds for WebRTC negotiation to complete
- **TypeScript errors**: Run `npm install` to ensure all dependencies are installed

### Stopping:

Press `Ctrl+C` in each terminal to stop the servers gracefully.

