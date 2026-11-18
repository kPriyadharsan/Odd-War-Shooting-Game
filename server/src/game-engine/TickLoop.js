import { logger } from '../utils/logger.js';

/**
 * High-Precision Fixed-Step Game Loop Foundation
 * Designed for server-authoritative physics and state updates.
 */
export class TickLoop {
  constructor(tickRateHz = 30, updateCallback = null) {
    this.tickRate = tickRateHz;
    this.tickIntervalMs = 1000 / tickRateHz;
    this.updateCallback = updateCallback;
    this.timerId = null;
    this.isRunning = false;
    this.lastTickTime = 0;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTickTime = performance.now();

    this.timerId = setInterval(() => {
      const now = performance.now();
      const deltaTime = (now - this.lastTickTime) / 1000;
      this.lastTickTime = now;

      if (this.updateCallback) {
        this.updateCallback(deltaTime);
      }
    }, this.tickIntervalMs);

    logger.debug(`[TickLoop] Started at ${this.tickRate} Hz (${this.tickIntervalMs.toFixed(1)}ms interval).`);
  }

  stop() {
    if (!this.isRunning) return;
    clearInterval(this.timerId);
    this.timerId = null;
    this.isRunning = false;
    logger.debug('[TickLoop] Stopped.');
  }
}
