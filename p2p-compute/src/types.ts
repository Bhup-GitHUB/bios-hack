// Type definitions for P2P Compute Platform

export interface PeerInfo {
  id: string;
  name: string;
  capabilities?: Record<string, any>;
}

export interface Task {
  id: string;
  taskId?: string;
  data: any;
  function?: string;
  from?: string;
}

export interface TaskResult {
  taskId: string;
  result: any;
  to?: string;
  processedBy?: string;
}

export interface PeerMessage {
  type: 'task' | 'result' | 'file-offer' | 'file-chunk' | 'file-complete' | 'file-request';
  taskId?: string;
  data?: any;
  result?: any;
  fileInfo?: FileMetadata;
  chunk?: ArrayBuffer;
  chunkIndex?: number;
  fileName?: string;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  totalChunks: number;
}

export interface FileTransfer {
  metadata: FileMetadata;
  chunks: ArrayBuffer[];
  receivedChunks: number;
  progress: number;
  fromPeer: string;
}

export interface SignalData {
  to: string;
  from?: string;
  signal?: any;
  offer?: any;
  answer?: any;
  candidate?: any;
}

export interface RoomData {
  roomId: string;
  peers: Set<string>;
}

export interface RegisterData {
  name: string;
  capabilities?: Record<string, any>;
}

