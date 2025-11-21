import SimplePeer from 'simple-peer';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import {
  PeerInfo,
  Task,
  TaskResult,
  PeerMessage,
  FileMetadata,
  FileTransfer,
  SignalData,
  RegisterData,
} from './types.js';

// File transfer chunk size (256KB)
const CHUNK_SIZE = 256 * 1024;

export class P2PClient {
  private socket: Socket;
  private peers: Map<string, SimplePeer.Instance>;
  private pendingTasks: Map<string, { data: any; fn: any }>;
  private fileTransfers: Map<string, FileTransfer>;
  
  // Callbacks
  public onTaskAssigned: ((task: Task) => void) | null = null;
  public onTaskCompleted: ((result: TaskResult) => void) | null = null;
  public onPeerConnected: ((peerId: string) => void) | null = null;
  public onFileReceived: ((file: File, fromPeer: string) => void) | null = null;
  public onFileProgress: ((fileName: string, progress: number) => void) | null = null;
  public onFileOffer: ((fromPeer: string, fileInfo: FileMetadata) => Promise<boolean>) | null = null;

  constructor(serverUrl: string = 'http://localhost:3000') {
    this.socket = io(serverUrl);
    this.peers = new Map();
    this.pendingTasks = new Map();
    this.fileTransfers = new Map();

    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    this.socket.on('connect', () => {
      console.log('✅ Connected to signaling server');
      this.register();
    });

    this.socket.on('peers-update', (peersList: PeerInfo[]) => {
      console.log('👥 Peers update:', peersList);
    });

    this.socket.on('peer-joined', (peerId: string) => {
      console.log(`🤝 Peer joined: ${peerId}`);
      this.connectToPeer(peerId, true);
    });

    this.socket.on('signal', ({ from, signal }: { from: string; signal: any }) => {
      if (this.peers.has(from)) {
        this.peers.get(from)!.signal(signal);
      }
    });

    this.socket.on('offer', ({ from, offer }: { from: string; offer: any }) => {
      this.connectToPeer(from, false, offer);
    });

    this.socket.on('answer', ({ from, answer }: { from: string; answer: any }) => {
      if (this.peers.has(from)) {
        this.peers.get(from)!.signal(answer);
      }
    });

    this.socket.on('ice-candidate', ({ from, candidate }: { from: string; candidate: any }) => {
      if (this.peers.has(from)) {
        this.peers.get(from)!.signal({ candidate });
      }
    });

    this.socket.on('task-assigned', (task: Task) => {
      console.log('📋 Task assigned:', task.taskId);
      if (this.onTaskAssigned) {
        this.onTaskAssigned(task);
      }
    });

    this.socket.on('task-completed', (result: TaskResult) => {
      console.log('✅ Task completed:', result.taskId);
      if (this.onTaskCompleted) {
        this.onTaskCompleted(result);
      }
      this.pendingTasks.delete(result.taskId);
    });

    this.socket.on('peer-left', (peerId: string) => {
      console.log(`👋 Peer left: ${peerId}`);
      if (this.peers.has(peerId)) {
        this.peers.get(peerId)!.destroy();
        this.peers.delete(peerId);
      }
    });

    this.socket.on('file-offer', async ({ from, fileInfo }: { from: string; fileInfo: FileMetadata }) => {
      console.log(`📁 File offer from ${from}:`, fileInfo);
      if (this.onFileOffer) {
        const accepted = await this.onFileOffer(from, fileInfo);
        if (accepted) {
          this.socket.emit('file-accept', { to: from });
          this.fileTransfers.set(fileInfo.name, {
            metadata: fileInfo,
            chunks: new Array(fileInfo.totalChunks),
            receivedChunks: 0,
            progress: 0,
            fromPeer: from,
          });
        } else {
          this.socket.emit('file-reject', { to: from });
        }
      }
    });
  }

  public register(name: string = 'Anonymous', capabilities: Record<string, any> = {}): void {
    this.socket.emit('register', { name, capabilities });
  }

  public joinRoom(roomId: string): void {
    this.socket.emit('join-room', roomId);
  }

  public connectToPeer(peerId: string, initiator: boolean, offer: any = null): SimplePeer.Instance | null {
    if (this.peers.has(peerId)) {
      return this.peers.get(peerId)!;
    }

    const peer = new SimplePeer({
      initiator: initiator,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
        ],
      },
    });

    peer.on('signal', (signal: any) => {
      if (initiator) {
        this.socket.emit('signal', { to: peerId, signal });
      } else {
        this.socket.emit('answer', { to: peerId, answer: signal });
      }
    });

    peer.on('connect', () => {
      console.log(`🔗 Connected to peer: ${peerId}`);
      if (this.onPeerConnected) {
        this.onPeerConnected(peerId);
      }
    });

    peer.on('data', (data: Buffer) => {
      try {
        const message: PeerMessage = JSON.parse(data.toString());
        this.handlePeerMessage(peerId, message);
      } catch (err) {
        console.error('Error parsing peer message:', err);
      }
    });

    peer.on('error', (err: Error) => {
      console.error(`❌ Peer error with ${peerId}:`, err);
    });

    peer.on('close', () => {
      console.log(`🔌 Peer connection closed: ${peerId}`);
      this.peers.delete(peerId);
    });

    this.peers.set(peerId, peer);

    if (offer) {
      peer.signal(offer);
    }

    return peer;
  }

  private handlePeerMessage(peerId: string, message: PeerMessage): void {
    switch (message.type) {
      case 'task':
        console.log('📋 Received task from peer:', message);
        if (this.onTaskAssigned) {
          this.onTaskAssigned(message as any);
        }
        break;

      case 'result':
        console.log('✅ Received result from peer:', message);
        if (this.onTaskCompleted) {
          this.onTaskCompleted(message as any);
        }
        break;

      case 'file-chunk':
        this.handleFileChunk(peerId, message);
        break;

      case 'file-complete':
        this.handleFileComplete(message.fileName!);
        break;

      default:
        console.log('❓ Unknown message type:', message);
    }
  }

  private handleFileChunk(peerId: string, message: PeerMessage): void {
    const { fileName, chunk, chunkIndex } = message;
    if (!fileName || !chunk || chunkIndex === undefined) return;

    const transfer = this.fileTransfers.get(fileName);
    if (!transfer) return;

    transfer.chunks[chunkIndex] = chunk as ArrayBuffer;
    transfer.receivedChunks++;
    transfer.progress = (transfer.receivedChunks / transfer.metadata.totalChunks) * 100;

    if (this.onFileProgress) {
      this.onFileProgress(fileName, transfer.progress);
    }

    console.log(`📦 Received chunk ${chunkIndex + 1}/${transfer.metadata.totalChunks} of ${fileName}`);
  }

  private handleFileComplete(fileName: string): void {
    const transfer = this.fileTransfers.get(fileName);
    if (!transfer) return;

    // Reconstruct the file from chunks
    const blob = new Blob(transfer.chunks, { type: transfer.metadata.type });
    const file = new File([blob], transfer.metadata.name, { type: transfer.metadata.type });

    console.log(`✅ File received: ${fileName}`);

    if (this.onFileReceived) {
      this.onFileReceived(file, transfer.fromPeer);
    }

    this.fileTransfers.delete(fileName);
  }

  public async sendFile(peerId: string, file: File): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer || !peer.connected) {
      throw new Error(`Peer ${peerId} not connected`);
    }

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const fileInfo: FileMetadata = {
      name: file.name,
      size: file.size,
      type: file.type,
      totalChunks,
    };

    // Send file offer through signaling server
    this.socket.emit('file-offer', { to: peerId, fileInfo });

    // Wait for acceptance (handled through socket events)
    // In production, you'd want to implement a proper promise-based acceptance flow

    console.log(`📤 Sending file ${file.name} to ${peerId} in ${totalChunks} chunks`);

    // Read and send file in chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      const arrayBuffer = await chunk.arrayBuffer();

      const message: PeerMessage = {
        type: 'file-chunk',
        fileName: file.name,
        chunkIndex: i,
        chunk: arrayBuffer,
      };

      // Send via WebRTC data channel
      peer.send(JSON.stringify({
        type: 'file-chunk',
        fileName: file.name,
        chunkIndex: i,
      }));
      
      // Send actual chunk data
      peer.send(arrayBuffer);

      if (this.onFileProgress) {
        this.onFileProgress(file.name, ((i + 1) / totalChunks) * 100);
      }
    }

    // Send completion message
    const completeMessage: PeerMessage = {
      type: 'file-complete',
      fileName: file.name,
    };
    peer.send(JSON.stringify(completeMessage));

    console.log(`✅ File ${file.name} sent successfully`);
  }

  public submitTask(taskData: any, taskFn?: any): string {
    const taskId = uuidv4();
    this.pendingTasks.set(taskId, { data: taskData, fn: taskFn });

    this.socket.emit('submit-task', {
      id: taskId,
      data: taskData,
      function: taskFn?.toString(),
    });

    return taskId;
  }

  public sendTaskResult(taskId: string, result: any, to: string): void {
    this.socket.emit('task-result', {
      taskId,
      result,
      to,
    });
  }

  public sendToPeer(peerId: string, data: any): void {
    const peer = this.peers.get(peerId);
    if (peer && peer.connected) {
      peer.send(JSON.stringify(data));
    } else {
      console.error(`Peer ${peerId} not connected`);
    }
  }

  public broadcast(data: any): void {
    this.peers.forEach((peer, peerId) => {
      if (peer.connected) {
        this.sendToPeer(peerId, data);
      }
    });
  }

  public disconnect(): void {
    this.peers.forEach((peer) => peer.destroy());
    this.peers.clear();
    this.socket.disconnect();
  }

  public getPeers(): string[] {
    return Array.from(this.peers.keys());
  }

  public isPeerConnected(peerId: string): boolean {
    const peer = this.peers.get(peerId);
    return peer ? peer.connected : false;
  }
}

