import type { ISystemMonitor } from "./types";
import type { MonitorEvent } from "../types";

export class MockSystemMonitor implements ISystemMonitor {
  private listeners: ((event: MonitorEvent) => void)[] = [];
  private running = false;

  public async start(): Promise<void> {
    this.running = true;
  }

  public async stop(): Promise<void> {
    this.running = false;
  }

  public onEvent(callback: (event: MonitorEvent) => void): void {
    this.listeners.push(callback);
  }

  public isRunning(): boolean {
    return this.running;
  }

  public emitTick(idleMs: number, timestamp = Date.now()): void {
    this.emit({ type: "TICK", idleMs, timestamp });
  }

  public emitLock(timestamp = Date.now()): void {
    this.emit({ type: "LOCK", timestamp });
  }

  public emitUnlock(timestamp = Date.now()): void {
    this.emit({ type: "UNLOCK", timestamp });
  }

  public emitSuspend(timestamp = Date.now()): void {
    this.emit({ type: "SUSPEND", timestamp });
  }

  public emitResume(timestamp = Date.now()): void {
    this.emit({ type: "RESUME", timestamp });
  }

  public emitShutdown(timestamp = Date.now()): void {
    this.emit({ type: "SHUTDOWN", timestamp });
  }

  private emit(event: MonitorEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
