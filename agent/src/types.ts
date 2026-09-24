export type AgentStatus =
  | "STARTING"
  | "ACTIVE"
  | "IDLE"
  | "LOCKED"
  | "SLEEPING"
  | "STOPPED"
  | "ERROR";

export type SessionStatus = "ACTIVE" | "COMPLETED" | "INTERRUPTED";

export interface WorkSession {
  id: string;
  started_at: string;        // ISO 8601 UTC string
  ended_at: string | null;   // ISO 8601 UTC string
  active_seconds: number;    // Cumulative active seconds
  status: SessionStatus;
  calendar_date: string;     // YYYY-MM-DD in Asia/Kolkata
  last_checkpoint: string;   // ISO 8601 UTC string
  created_at: string;
  updated_at: string;
  synced_at: string | null;
}

export interface MonitorEventTick {
  type: "TICK";
  idleMs: number;
  timestamp: number; // Unix ms
}

export interface MonitorEventLifecycle {
  type: "LOCK" | "UNLOCK" | "SUSPEND" | "RESUME" | "SHUTDOWN" | "READY";
  timestamp: number; // Unix ms
}

export type MonitorEvent = MonitorEventTick | MonitorEventLifecycle;

export interface DailyWorkSummary {
  calendarDate: string;
  totalActiveSeconds: number;
  totalActiveFormatted: string; // HH:MM:SS
  activeSessionSeconds: number;
}
