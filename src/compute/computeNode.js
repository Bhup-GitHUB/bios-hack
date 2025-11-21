import { io } from 'socket.io-client';
import { RTCPeerConnection } from 'wrtc';

const SIGNALING_URL = process.env.SIGNALING_URL || 'http://localhost:3000';

class ComputeNode {
  constructor(config = {}) {
    this.jobQueue = new JobQueue({
      maxConcurrency: config.maxConcurrency || 2,
      defaultTimeoutMs: config.defaultTimeoutMs || 5000,
      defaultMemoryLimitMb: config.defaultMemoryLimitMb || 128,
      maxHistorySize: config.maxHistorySize || 100
    });

    this.socket = io(SIGNALING_URL);
    this.peers = new Map();

    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.socket.on('connect', () => {
      console.log('[ComputeNode] Connected to signaling server:', this.socket.id);
      this.socket.emit('signal', {
        from: this.socket.id,
        payload: { type: 'hello', role: 'compute' }
      });
    });

    this.socket.on('signal', async (data) => {
      await this.handleSignal(data);
    });

    this.socket.on('disconnect', () => {
      console.log('[ComputeNode] Disconnected from signaling server');
    });
  }

  async handleSignal(data) {
    const from = data.from;
    const payload = data.payload;

    if (!from || from === this.socket.id) return;

    if (payload.type === 'offer') {
      console.log(`[ComputeNode] Received offer from ${from}`);
      await this.handleOffer(from, payload);
    } else if (payload.type === 'ice') {
      const pc = this.peers.get(from);
      if (pc && payload.candidate) {
        try {
          await pc.addIceCandidate(payload.candidate);
        } catch (err) {
          console.warn('[ComputeNode] Failed to add ICE candidate:', err.message);
        }
      }
    }
  }

  async handleOffer(peerId, payload) {
    const pc = new RTCPeerConnection();
    this.peers.set(peerId, pc);

    // Handle incoming data channel
    pc.ondatachannel = (event) => {
      const channel = event.channel;
      console.log(`[ComputeNode] DataChannel opened: ${channel.label}`);

      channel.onmessage = async (ev) => {
        await this.handleJobRequest(channel, ev.data);
      };

      channel.onerror = (err) => {
        console.error('[ComputeNode] DataChannel error:', err);
      };

      channel.onclose = () => {
        console.log('[ComputeNode] DataChannel closed');
      };
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('signal', {
          from: this.socket.id,
          to: peerId,
          payload: { type: 'ice', candidate: event.candidate }
        });
      }
    };

    // Set remote description and create answer
    await pc.setRemoteDescription({ type: 'offer', sdp: payload.sdp });
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.socket.emit('signal', {
      from: this.socket.id,
      to: peerId,
      payload: { type: 'answer', sdp: pc.localDescription.sdp }
    });

    console.log('[ComputeNode] Answered offer');
  }

  async handleJobRequest(channel, message) {
    try {
      const request = JSON.parse(message);

      // Handle different message types
      if (request.type === 'job') {
        console.log(`[ComputeNode] Received job request: ${request.jobId}`);
        
        // Add job to queue
        const result = await this.jobQueue.addJob({
          jobId: request.jobId,
          code: request.code,
          params: request.params,
          priority: request.priority,
          timeoutMs: request.timeoutMs,
          memoryLimitMb: request.memoryLimitMb
        });

        // Send result back
        channel.send(JSON.stringify({
          type: 'result',
          ...result
        }));

        console.log(`[ComputeNode] Job ${request.jobId} result sent`);

      } else if (request.type === 'status') {
        // Status query
        const status = this.jobQueue.getJobStatus(request.jobId);
        channel.send(JSON.stringify({
          type: 'status',
          ...status
        }));

      } else if (request.type === 'stats') {
        // Stats query
        const stats = this.jobQueue.getStats();
        channel.send(JSON.stringify({
          type: 'stats',
          ...stats
        }));
      }

    } catch (err) {
      console.error('[ComputeNode] Error handling job request:', err);
      channel.send(JSON.stringify({
        type: 'error',
        error: err.message
      }));
    }
  }

  printStats() {
    const stats = this.jobQueue.getStats();
    console.log('\n=== Compute Node Stats ===');
    console.log(`Total Queued: ${stats.totalQueued}`);
    console.log(`Total Completed: ${stats.totalCompleted}`);
    console.log(`Total Failed: ${stats.totalFailed}`);
    console.log(`Total Timeout: ${stats.totalTimeout}`);
    console.log(`Currently Running: ${stats.runningCount}`);
    console.log(`Queue Length: ${stats.queueLength}`);
    console.log(`History Size: ${stats.historySize}`);
    console.log('==========================\n');
  }
}

// Start the compute node
const computeNode = new ComputeNode({
  maxConcurrency: 2,
  defaultTimeoutMs: 5000,
  defaultMemoryLimitMb: 128
});

// Print stats every 30 seconds
setInterval(() => {
  computeNode.printStats();
}, 30000);

console.log('[ComputeNode] Running and waiting for connections...');

// Export for testing
export { ComputeNode, JobQueue, SandboxRunner, SecurityValidator };