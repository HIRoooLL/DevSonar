import { ErrorReport, InFlightEntry } from './types.js';

export class ErrorBuffer {
  private buffer: ErrorReport[] = [];
  private debounceTimer: NodeJS.Timeout | null = null;
  private flushCallback: (errors: ErrorReport[]) => Promise<void>;
  private debounceMs: number;
  private maxSize: number;
  private inFlight: Map<string, InFlightEntry> = new Map();

  constructor(
    flushCallback: (errors: ErrorReport[]) => Promise<void>,
    debounceMs: number,
    maxSize: number
  ) {
    this.flushCallback = flushCallback;
    this.debounceMs = debounceMs;
    this.maxSize = maxSize;
  }

  add(error: ErrorReport): void {
    const existing = this.inFlight.get(error.message);
    if (existing) {
      existing.skippedCount++;
      console.log(`[ErrorBuffer] Skipping duplicate (in-flight): "${error.message}" (skipped: ${existing.skippedCount})`);
      return;
    }

    this.buffer.push(error);

    if (this.buffer.length >= this.maxSize) {
      this.flush();
      return;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.flush();
    }, this.debounceMs);
  }

  flush(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.buffer.length === 0) {
      return;
    }

    const errors = [...this.buffer];
    this.buffer = [];

    const now = Date.now();
    for (const e of errors) {
      this.inFlight.set(e.message, {
        message: e.message,
        source: e.source,
        sentAt: now,
        skippedCount: 0,
        status: 'processing',
      });
    }
    console.log(`[ErrorBuffer] In-flight registered: ${errors.length} error(s) | total in-flight: ${this.inFlight.size}`);

    this.flushCallback(errors).finally(() => {
      for (const e of errors) {
        const entry = this.inFlight.get(e.message);
        if (entry) {
          console.log(`[ErrorBuffer] Completed: "${e.message}" (skipped ${entry.skippedCount} duplicates during processing)`);
          this.inFlight.delete(e.message);
        }
      }
      console.log(`[ErrorBuffer] Ready for next request | remaining in-flight: ${this.inFlight.size}`);
    });
  }

  size(): number {
    return this.buffer.length;
  }

  inFlightCount(): number {
    return this.inFlight.size;
  }
}
