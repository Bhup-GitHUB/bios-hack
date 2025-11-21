

import { VM } from 'vm2';

/**
 * Sandbox Runner - Executes user code in isolated environment
 */
class SandboxRunner {
  constructor(config = {}) {
    this.defaultTimeoutMs = config.timeoutMs || 5000;
    this.defaultMemoryLimitMb = config.memoryLimitMb || 128;
  }

  /**
   * Run code in sandbox with security and resource limits
   */
  async run(code, params, options = {}) {
    const startTime = Date.now();
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;
    const memoryLimitMb = options.memoryLimitMb || this.defaultMemoryLimitMb;

    // Validate code security
    const validation = SecurityValidator.validate(code);
    if (!validation.valid) {
      return {
        success: false,
        error: `Security violation: ${validation.reason}`,
        executionTimeMs: 0,
        timestamp: Date.now()
      };
    }

    try {
      // Create isolated VM instance
      const vm = new VM({
        timeout: timeoutMs,
        sandbox: { 
          params,
          // Whitelist safe operations
          Math,
          Date,
          JSON,
          Array,
          Object,
          String,
          Number,
          Boolean,
        },
        eval: false,
        wasm: false,
        fixAsync: true,
      });

      // Memory tracking (approximate)
      const memBefore = process.memoryUsage().heapUsed;

      // Execute the user function
      const wrapper = `
        (function() {
          const userFn = ${code};
          return userFn(params);
        })()
      `;

      const result = vm.run(wrapper);

      const memAfter = process.memoryUsage().heapUsed;
      const memoryUsedMb = (memAfter - memBefore) / (1024 * 1024);

      // Check memory limit
      if (memoryUsedMb > memoryLimitMb) {
        return {
          success: false,
          error: `Memory limit exceeded: ${memoryUsedMb.toFixed(2)}MB / ${memoryLimitMb}MB`,
          executionTimeMs: Date.now() - startTime,
          memoryUsedMb: memoryUsedMb.toFixed(2),
          timestamp: Date.now()
        };
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        result,
        executionTimeMs: executionTime,
        memoryUsedMb: memoryUsedMb.toFixed(2),
        timestamp: Date.now()
      };

    } catch (err) {
      const executionTime = Date.now() - startTime;
      
      // Determine error type
      let errorMessage = err.message || String(err);
      
      if (errorMessage.includes('Script execution timed out')) {
        errorMessage = `Timeout: Execution exceeded ${timeoutMs}ms limit`;
      }

      return {
        success: false,
        error: errorMessage,
        executionTimeMs: executionTime,
        timestamp: Date.now()
      };
    }
  }
}
