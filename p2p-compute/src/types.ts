// Type definitions for P2P Compute Platform

/**
 * Information about a connected peer
 */
export interface PeerInfo {
  id: string;
  name: string;
  capabilities?: Record<string, any>;
  connectedAt?: Date;
}

/**
 * Compute task to be distributed
 */
export interface Task {
  id: string;
  taskId?: string;
  data: any;
  function?: string;
  from?: string;
  priority?: 'low' | 'medium' | 'high';
  createdAt?: Date;
}

/**
 * Result from a completed task
 */
export interface TaskResult {
  taskId: string;
  result: any;
  to?: string;
  processedBy?: string;
  executionTime?: number;
  completedAt?: Date;
}

/**
 * Message types exchanged between peers
 */
export interface PeerMessage {
  type: 'task' | 'result' | 'file-offer' | 'file-chunk' | 'file-complete' | 'file-request' | 'ping' | 'pong';
  taskId?: string;
  data?: any;
  result?: any;
  fileInfo?: FileMetadata;
  chunk?: ArrayBuffer;
  chunkIndex?: number;
  totalChunks?: number;
  fileName?: string;
  timestamp?: number;
}

/**
 * Metadata for file transfers
 */
export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  totalChunks: number;
  checksum?: string;
}

/**
 * State of an ongoing file transfer
 */
export interface FileTransfer {
  metadata: FileMetadata;
  chunks: ArrayBuffer[];
  receivedChunks: number;
  progress: number;
  fromPeer: string;
  startedAt: Date;
  lastChunkAt?: Date;
}

/**
 * WebRTC signaling data
 */
export interface SignalData {
  to: string;
  from?: string;
  signal?: any;
  offer?: any;
  answer?: any;
  candidate?: any;
}

/**
 * Room information for peer grouping
 */
export interface RoomData {
  roomId: string;
  peers: Set<string>;
  createdAt: Date;
}

/**
 * Registration data for new peers
 */
export interface RegisterData {
  name: string;
  capabilities?: Record<string, any>;
  version?: string;
}

/**
 * Server health status
 */
export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  peers: number;
  rooms: number;
  uptime: number;
  memory?: NodeJS.MemoryUsage;
}

/**
 * File transfer progress event
 */
export interface FileProgress {
  fileName: string;
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
  speed?: number; // bytes per second
}

