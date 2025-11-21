export type JobRequest = {
  type: "JOB_REQUEST";
  jobId: string;
  code: string;
  params?: Record<string, any>;
};

export type JobResult = {
  type: "JOB_RESULT";
  jobId: string;
  result?: any;
  error?: string;
};

export type SignalMessage = {
  from: "client" | "node";
  to: "client" | "node";
  payload: any;
};

export type AnyMessage = JobRequest | JobResult;
