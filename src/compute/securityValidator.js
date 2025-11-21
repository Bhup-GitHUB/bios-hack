class SecurityValidator {
  static DANGEROUS_PATTERNS = [
    /require\s*\(/gi,           // No require() calls
    /import\s+/gi,              // No ES6 imports
    /process\./gi,              // No process access
    /child_process/gi,          // No child processes
    /fs\./gi,                   // No file system
    /eval\s*\(/gi,              // No eval
    /Function\s*\(/gi,          // No Function constructor
    /setTimeout|setInterval/gi, // No timers (we control execution time)
    /\.constructor/gi,          // No constructor access
    /__proto__|prototype/gi,    // No prototype manipulation
    /global\./gi,               // No global access
    /fetch|XMLHttpRequest/gi,   // No network calls
    /WebSocket/gi,              // No WebSocket
  ];

  static validate(code) {
    // Check for dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(code)) {
        return {
          valid: false,
          reason: `Dangerous pattern detected: ${pattern.source}`
        };
      }
    }

    // Check for basic syntax (must be a function)
    const functionPattern = /^\s*(\([^)]*\)\s*=>|function\s*\()/;
    if (!functionPattern.test(code.trim())) {
      return {
        valid: false,
        reason: 'Code must be a valid function expression'
      };
    }

    return { valid: true };
  }
}
