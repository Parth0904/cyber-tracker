import crypto from "node:crypto";
import type { AgentStatus, WorkSession, MonitorEvent } from "../types";
import type { IAgentRepository } from "../storage/repository";
import {
  getKolkataDateString,
  getNextKolkataMidnightUtc,
  isDifferentKolkataDay,
} from "../timezone";
import { logger } from "../logger";

export interface EngineOptions {
  idleThresholdMs: number;
  checkpointIntervalMs: number;
  repository: IAgentRepository;
  timeProvider?: () => number;
}

export class TrackingEngine {
  private status: AgentStatus = "STARTING";
  private currentSession: WorkSession | null = null;
  private currentSessionStartMs = 0;
  private lastInputTimestampMs = 0;
  private lastTickTimestampMs = 0;
  private lastCheckpointMs = 0;
  private currentIdleMs = 0;

  private readonly idleThresholdMs: number;
  private readonly checkpointIntervalMs: number;
  private readonly repository: IAgentRepository;
  private readonly now: () => number;

  constructor(options: EngineOptions) {
    this.idleThresholdMs = options.idleThresholdMs;
    this.checkpointIntervalMs = options.checkpointIntervalMs;
    this.repository = options.repository;
    this.now = options.timeProvider || (() => Date.now());
  }

  public getStatus(): AgentStatus {
    return this.status;
  }

  public getCurrentSession(): WorkSession | null {
    return this.currentSession;
  }

  public getCurrentIdleMs(): number {
    return this.currentIdleMs;
  }

  public getLastInputTimestampMs(): number {
    return this.lastInputTimestampMs;
  }

  private setStatus(newStatus: AgentStatus): void {
    if (this.status !== newStatus) {
      logger.info(`Status transition: ${this.status} -> ${newStatus}`);
      this.status = newStatus;
      this.persistState();
    }
  }

  private persistState(): void {
    try {
      const nowMs = this.now();
      const stateObj = {
        status: this.status,
        idleThresholdMs: this.idleThresholdMs,
        currentIdleMs: this.currentIdleMs,
        lastActivityTime: this.lastInputTimestampMs > 0 ? new Date(this.lastInputTimestampMs).toISOString() : null,
        activeSessionId: this.currentSession?.id || null,
        updatedAt: new Date(nowMs).toISOString(),
      };
      this.repository.setState("runtime_state", JSON.stringify(stateObj));
    } catch (err) {
      logger.error("Failed to persist engine state", { error: String(err) });
    }
  }

  /**
   * Starts a brand new active session at the given timestamp.
   */
  private startActiveSession(effectiveStartMs: number): void {
    const calendarDate = getKolkataDateString(effectiveStartMs);
    const startIso = new Date(effectiveStartMs).toISOString();

    const session: WorkSession = {
      id: crypto.randomUUID(),
      started_at: startIso,
      ended_at: startIso,
      active_seconds: 0,
      status: "ACTIVE",
      calendar_date: calendarDate,
      last_checkpoint: startIso,
      created_at: new Date(this.now()).toISOString(),
      updated_at: new Date(this.now()).toISOString(),
      synced_at: null,
    };

    this.currentSession = session;
    this.currentSessionStartMs = effectiveStartMs;
    this.lastInputTimestampMs = effectiveStartMs;
    this.lastCheckpointMs = this.now();

    this.repository.createSession(session);
    logger.info("Started new active work session", {
      sessionId: session.id,
      startedAt: session.started_at,
      calendarDate: session.calendar_date,
    });
  }

  /**
   * Finalizes the currently active session cleanly.
   */
  private finalizeActiveSession(finalTimestampMs: number, status: "COMPLETED" | "INTERRUPTED" = "COMPLETED"): void {
    if (!this.currentSession) return;

    // Active end cannot be before the session start
    const safeEndMs = Math.max(this.currentSessionStartMs, finalTimestampMs);
    const activeSec = Math.max(0, Math.round((safeEndMs - this.currentSessionStartMs) / 1000));
    const endIso = new Date(safeEndMs).toISOString();

    this.repository.finalizeSession(this.currentSession.id, endIso, activeSec, status);

    logger.info("Finalized active work session", {
      sessionId: this.currentSession.id,
      endedAt: endIso,
      activeSeconds: activeSec,
      status,
    });

    this.currentSession = null;
    this.currentSessionStartMs = 0;
  }

  /**
   * Primary event dispatcher for system events (ticks, locks, sleeps, shutdowns).
   */
  public handleEvent(event: MonitorEvent): void {
    switch (event.type) {
      case "TICK":
        this.handleTick(event.idleMs, event.timestamp);
        break;
      case "LOCK":
        this.handleLock(event.timestamp);
        break;
      case "UNLOCK":
        this.handleUnlock(event.timestamp);
        break;
      case "SUSPEND":
        this.handleSuspend(event.timestamp);
        break;
      case "RESUME":
        this.handleResume(event.timestamp);
        break;
      case "SHUTDOWN":
        this.handleShutdown(event.timestamp);
        break;
      case "READY":
        logger.info("Monitor reported READY");
        break;
    }
  }

  private handleTick(idleMs: number, tickTime: number): void {
    this.currentIdleMs = Math.max(0, idleMs);

    // Clock jump backward protection (Rule 14)
    if (this.lastTickTimestampMs > 0 && tickTime < this.lastTickTimestampMs - 5000) {
      logger.warn("System clock jumped backward. Adjusting baseline.", {
        previousTick: this.lastTickTimestampMs,
        currentTick: tickTime,
      });
      this.lastTickTimestampMs = tickTime;
    }

    // Unannounced sleep/suspend or massive forward clock jump protection (Rule 5 & Rule 14)
    if (this.lastTickTimestampMs > 0 && tickTime - this.lastTickTimestampMs > 10000) {
      const gapSec = Math.round((tickTime - this.lastTickTimestampMs) / 1000);
      logger.info(`Detected time gap (${gapSec}s) between ticks (sleep, suspension, or clock change).`);

      if (this.status === "ACTIVE") {
        // Finalize previous session at last known valid input time
        this.finalizeActiveSession(this.lastInputTimestampMs, "COMPLETED");
        this.setStatus("IDLE");
      }
    }

    this.lastTickTimestampMs = tickTime;
    const computedInputTime = tickTime - this.currentIdleMs;

    // Handle initial state on startup
    if (this.status === "STARTING") {
      if (this.currentIdleMs >= this.idleThresholdMs) {
        this.setStatus("IDLE");
      } else {
        this.setStatus("ACTIVE");
        this.startActiveSession(computedInputTime);
      }
      return;
    }

    // If currently locked or sleeping, ignore ticks until UNLOCK / RESUME
    if (this.status === "LOCKED" || this.status === "SLEEPING" || this.status === "STOPPED") {
      return;
    }

    if (this.status === "ACTIVE") {
      // Check if user has exceeded idle threshold (5 minutes of inactivity)
      if (this.currentIdleMs >= this.idleThresholdMs) {
        logger.info(`Idle threshold (${this.idleThresholdMs / 1000}s) reached. Pausing work tracking.`);

        // Stop tracking and finalize session at the last genuine user input timestamp
        // The 5-minute idle period itself is NOT counted!
        this.finalizeActiveSession(this.lastInputTimestampMs, "COMPLETED");
        this.setStatus("IDLE");
        return;
      }

      // User is active (idleMs < threshold)
      // Check for midnight IST boundary crossing (Rule 9)
      if (isDifferentKolkataDay(this.currentSessionStartMs, tickTime)) {
        const midnightUtc = getNextKolkataMidnightUtc(this.currentSessionStartMs);
        const midnightMs = midnightUtc.getTime();

        if (tickTime >= midnightMs) {
          logger.info("Active session crossed midnight IST. Splitting daily boundary.", {
            previousDate: getKolkataDateString(this.currentSessionStartMs),
            nextDate: getKolkataDateString(tickTime),
          });

          // Finalize previous day session exactly at midnight
          this.finalizeActiveSession(midnightMs, "COMPLETED");

          // Start new session for the new calendar day starting at midnight
          this.startActiveSession(midnightMs);
        }
      }

      // Advance lastInputTimestampMs
      if (computedInputTime > this.lastInputTimestampMs) {
        this.lastInputTimestampMs = computedInputTime;
      }

      // Update in-memory session active_seconds
      if (this.currentSession) {
        const activeSeconds = Math.max(0, Math.round((this.lastInputTimestampMs - this.currentSessionStartMs) / 1000));
        this.currentSession.active_seconds = activeSeconds;
        this.currentSession.ended_at = new Date(this.lastInputTimestampMs).toISOString();

        // Checkpoint to SQLite periodically for durability (Rule 7)
        if (tickTime - this.lastCheckpointMs >= this.checkpointIntervalMs) {
          this.repository.updateCheckpoint(
            this.currentSession.id,
            this.currentSession.ended_at,
            activeSeconds,
            new Date(tickTime).toISOString()
          );
          this.lastCheckpointMs = tickTime;
          this.persistState();
        }
      }
    } else if (this.status === "IDLE") {
      // User was idle, check if keyboard/mouse activity resumed
      if (this.currentIdleMs < this.idleThresholdMs) {
        logger.info("Keyboard/mouse activity resumed. Resuming tracking.");
        this.setStatus("ACTIVE");
        this.startActiveSession(computedInputTime);
      }
    }
  }

  private handleLock(_timestamp: number): void {
    logger.info("Windows Lock event received");
    if (this.status === "ACTIVE") {
      this.finalizeActiveSession(this.lastInputTimestampMs, "COMPLETED");
    }
    this.setStatus("LOCKED");
  }

  private handleUnlock(_timestamp: number): void {
    logger.info("Windows Unlock event received. Waiting for activity.");
    // Transition to IDLE; do NOT count lock time, wait for actual activity
    this.setStatus("IDLE");
  }

  private handleSuspend(_timestamp: number): void {
    logger.info("Windows Suspend/Sleep event received");
    if (this.status === "ACTIVE") {
      this.finalizeActiveSession(this.lastInputTimestampMs, "COMPLETED");
    }
    this.setStatus("SLEEPING");
  }

  private handleResume(_timestamp: number): void {
    logger.info("Windows Resume/Wake event received. Waiting for activity.");
    // Transition to IDLE; do NOT count sleep time, wait for actual activity
    this.setStatus("IDLE");
  }

  public handleShutdown(_timestamp = this.now()): void {
    logger.info("Windows Shutdown / Agent termination received");
    if (this.status === "ACTIVE") {
      this.finalizeActiveSession(this.lastInputTimestampMs, "COMPLETED");
    }
    this.setStatus("STOPPED");
  }
}
