/**
 * Cyber Tracker Agent Synchronization Service
 * 
 * Offline-first background synchronization:
 * - Reads cumulative active seconds per calendar date from local SQLite.
 * - Authenticates with Next.js /api/agent/sync via Bearer token.
 * - Idempotently uploads verified daily work totals.
 * - NEVER blocks or slows down the tracking loop.
 * - Safely handles server downtime, offline state, network failures, timeouts.
 * - Marks local sessions synced ONLY after verified server confirmation.
 */

import { config } from "../../config";
import { logger } from "../logger";
import type { IAgentRepository, UnsyncedDailyTotal } from "../storage/repository";

export interface SyncOptions {
  apiBaseUrl?: string;
  syncToken?: string;
  syncIntervalMs?: number;
  fetchFn?: typeof fetch;
}

export class AgentSyncService {
  private repository: IAgentRepository;
  private apiBaseUrl: string;
  private syncToken: string;
  private syncIntervalMs: number;
  private timer: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private customFetch: typeof fetch;

  constructor(repository: IAgentRepository, options?: SyncOptions) {
    this.repository = repository;
    this.apiBaseUrl = options?.apiBaseUrl || config.apiBaseUrl;
    this.syncToken = options?.syncToken || config.syncToken;
    this.syncIntervalMs = options?.syncIntervalMs || config.syncIntervalMs;
    this.customFetch = options?.fetchFn || fetch;
  }

  /**
   * Performs an immediate synchronization cycle.
   * Never throws unhandled errors to caller.
   */
  public async syncNow(): Promise<{ syncedCount: number; success: boolean }> {
    if (this.isSyncing) {
      return { syncedCount: 0, success: false };
    }

    if (!this.syncToken) {
      logger.debug("Sync skipped: No agent sync token configured");
      this.repository.setState("last_sync_status", "SKIPPED: Missing token");
      return { syncedCount: 0, success: false };
    }

    this.isSyncing = true;
    try {
      const unsynced: UnsyncedDailyTotal[] = this.repository.getUnsyncedDailyTotals();
      if (!unsynced || unsynced.length === 0) {
        this.repository.setState("last_sync_status", "IDLE: All work up to date");
        return { syncedCount: 0, success: true };
      }

      const syncAttemptTime = new Date().toISOString();
      const records = unsynced.map((u) => ({
        date: u.calendar_date,
        active_seconds: u.total_seconds,
      }));

      const syncUrl = `${this.apiBaseUrl.replace(/\/$/, "")}/api/agent/sync`;

      logger.info("Agent sync started", {
        unsyncedCount: unsynced.length,
        url: syncUrl,
        records: records.map((r) => ({ date: r.date, active_seconds: r.active_seconds })),
      });

      // 5-second network timeout via AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      let response: Response;
      try {
        response = await this.customFetch(syncUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.syncToken}`,
          },
          body: JSON.stringify({ records }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      logger.info("Agent sync HTTP response received", {
        status: response.status,
        statusText: response.statusText,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        logger.warn("Sync endpoint returned non-200 status", {
          status: response.status,
          error: errorText,
        });
        this.repository.setState(
          "last_sync_status",
          `FAILED HTTP ${response.status}: ${errorText.slice(0, 80)}`
        );
        this.repository.setState("last_sync_error_at", syncAttemptTime);
        return { syncedCount: 0, success: false };
      }

      const result = await response.json().catch(() => ({}));

      // Server confirmed successful receipt! Mark sessions locally up to max_updated_at
      for (const item of unsynced) {
        this.repository.markSessionsSynced(
          item.calendar_date,
          item.max_updated_at,
          syncAttemptTime
        );
      }

      this.repository.setState("last_successful_sync", syncAttemptTime);
      this.repository.setState(
        "last_sync_status",
        `SUCCESS: Synced ${records.length} date(s)`
      );

      logger.info("Agent sync successfully completed", {
        recordsCount: records.length,
        dates: records.map((r) => r.date),
        serverResult: result,
      });

      return { syncedCount: records.length, success: true };
    } catch (err: any) {
      const isAbort = err.name === "AbortError";
      const errorMsg = isAbort ? "Request timed out after 5000ms" : String(err.message || err);

      logger.warn("Agent sync deferred (offline or server unreachable)", {
        error: errorMsg,
      });

      this.repository.setState("last_sync_status", `DEFERRED: ${errorMsg.slice(0, 80)}`);
      this.repository.setState("last_sync_error_at", new Date().toISOString());
      return { syncedCount: 0, success: false };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Start recurring background sync timer.
   */
  public start(): void {
    if (this.timer) return;

    logger.info("Starting background work time synchronization loop", {
      apiBaseUrl: this.apiBaseUrl,
      syncIntervalMs: this.syncIntervalMs,
    });

    // Run first sync immediately
    this.syncNow().catch(() => {});

    // Periodic sync
    this.timer = setInterval(() => {
      this.syncNow().catch(() => {});
    }, this.syncIntervalMs);

    // Unref timer so it doesn't prevent Node process exit on shutdown
    if (this.timer.unref) {
      this.timer.unref();
    }
  }

  /**
   * Stop background sync timer.
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
