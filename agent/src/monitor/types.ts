import type { MonitorEvent } from "../types";

export interface ISystemMonitor {
  start(): Promise<void>;
  stop(): Promise<void>;
  onEvent(callback: (event: MonitorEvent) => void): void;
  isRunning(): boolean;
}
