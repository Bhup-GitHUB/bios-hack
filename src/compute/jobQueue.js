class JobQueue {
  constructor(config = {}) {
    this.maxConcurrency = config.maxConcurrency || 2;
    this.queue = [];
    this.runningJobs = new Map();
    this.completedJobs = new Map();
    this.maxHistorySize = config.maxHistorySize || 100;
    
    this.sandboxRunner = new SandboxRunner({
      timeoutMs: config.defaultTimeoutMs || 5000,
      memoryLimitMb: config.defaultMemoryLimitMb || 128
    });

    this.stats = {
      totalQueued: 0,
      totalCompleted: 0,
      totalFailed: 0,
      totalTimeout: 0
    };
  }

  /**
   * Add job to queue with priority support
   */
  addJob(jobRequest) {
    const job = {
      jobId: jobRequest.jobId,
      code: jobRequest.code,
      params: jobRequest.params,
      priority: jobRequest.priority || 0,
      timeoutMs: jobRequest.timeoutMs,
      memoryLimitMb: jobRequest.memoryLimitMb,
      queuedAt: Date.now(),
      status: 'queued'
    };

    this.queue.push(job);
    this.stats.totalQueued++;

    // Sort by priority (higher priority first)
    this.queue.sort((a, b) => b.priority - a.priority);

    console.log(`[JobQueue] Job ${job.jobId} queued (priority: ${job.priority})`);
    
    // Try to process queue
    this.processQueue();

    return this.createJobPromise(job.jobId);
  }

  /**
   * Create a promise that resolves when job completes
   */
  createJobPromise(jobId) {
    return new Promise((resolve) => {
      // Store resolver for this job
      if (!this.completedJobs.has(jobId)) {
        this.completedJobs.set(jobId, { resolver: resolve });
      }
    });
  }

  /**
   * Process jobs from queue
   */
  async processQueue() {
    // Check if we can run more jobs
    if (this.runningJobs.size >= this.maxConcurrency) {
      return;
    }

    // Get next job from queue
    const job = this.queue.shift();
    if (!job) {
      return;
    }

    // Mark as running
    job.status = 'running';
    job.startedAt = Date.now();
    this.runningJobs.set(job.jobId, job);

    console.log(`[JobQueue] Executing job ${job.jobId} (${this.runningJobs.size}/${this.maxConcurrency} running)`);

    try {
      // Execute job in sandbox
      const result = await this.sandboxRunner.run(
        job.code,
        job.params,
        {
          timeoutMs: job.timeoutMs,
          memoryLimitMb: job.memoryLimitMb
        }
      );

      // Mark as completed
      job.status = result.success ? 'completed' : 'failed';
      job.completedAt = Date.now();
      job.result = result;

      // Update stats
      if (result.success) {
        this.stats.totalCompleted++;
      } else if (result.error && result.error.includes('Timeout')) {
        this.stats.totalTimeout++;
      } else {
        this.stats.totalFailed++;
      }

      // Resolve the promise
      const jobInfo = this.completedJobs.get(job.jobId);
      if (jobInfo && jobInfo.resolver) {
        jobInfo.resolver({
          jobId: job.jobId,
          success: result.success,
          result: result.result,
          error: result.error,
          executionTimeMs: result.executionTimeMs,
          memoryUsedMb: result.memoryUsedMb,
          timestamp: result.timestamp
        });
      }

      // Store in history (with size limit)
      this.completedJobs.set(job.jobId, { ...job, result });
      this.pruneHistory();

      console.log(`[JobQueue] Job ${job.jobId} ${job.status} in ${result.executionTimeMs}ms`);

    } catch (err) {
      job.status = 'failed';
      job.completedAt = Date.now();
      job.error = err.message;

      this.stats.totalFailed++;

      const jobInfo = this.completedJobs.get(job.jobId);
      if (jobInfo && jobInfo.resolver) {
        jobInfo.resolver({
          jobId: job.jobId,
          success: false,
          error: err.message,
          timestamp: Date.now()
        });
      }

      console.error(`[JobQueue] Job ${job.jobId} failed:`, err.message);
    } finally {
      // Remove from running jobs
      this.runningJobs.delete(job.jobId);

      // Process next job in queue
      setImmediate(() => this.processQueue());
    }
  }

  /**
   * Get status of a specific job
   */
  getJobStatus(jobId) {
    // Check if running
    if (this.runningJobs.has(jobId)) {
      const job = this.runningJobs.get(jobId);
      return {
        jobId: job.jobId,
        status: 'running',
        queuedAt: job.queuedAt,
        startedAt: job.startedAt
      };
    }

    // Check if completed
    if (this.completedJobs.has(jobId)) {
      const job = this.completedJobs.get(jobId);
      return {
        jobId: job.jobId,
        status: job.status,
        queuedAt: job.queuedAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error
      };
    }

    // Check if queued
    const queuedJob = this.queue.find(j => j.jobId === jobId);
    if (queuedJob) {
      return {
        jobId: queuedJob.jobId,
        status: 'queued',
        queuedAt: queuedJob.queuedAt,
        position: this.queue.indexOf(queuedJob)
      };
    }

    return null;
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      ...this.stats,
      queueLength: this.queue.length,
      runningCount: this.runningJobs.size,
      historySize: this.completedJobs.size
    };
  }

  /**
   * Prune old jobs from history
   */
  pruneHistory() {
    if (this.completedJobs.size > this.maxHistorySize) {
      const entries = Array.from(this.completedJobs.entries());
      const toRemove = entries
        .sort((a, b) => (a[1].completedAt || 0) - (b[1].completedAt || 0))
        .slice(0, entries.length - this.maxHistorySize);
      
      toRemove.forEach(([jobId]) => this.completedJobs.delete(jobId));
    }
  }

  /**
   * Clear all completed jobs from history
   */
  clearHistory() {
    this.completedJobs.clear();
    console.log('[JobQueue] History cleared');
  }
}
