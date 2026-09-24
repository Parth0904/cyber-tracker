import test from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { SqliteAgentRepository } from "../src/storage/repository";
import { AgentSyncService } from "../src/sync/sync-client";
import { TrackingEngine } from "../src/engine/state-machine";
import { getKolkataDateString } from "../src/timezone";

function createTestDatabase(): { db: Database.Database; repo: SqliteAgentRepository } {
  const db = new Database(":memory:");
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = FULL");
  db.exec(`
    CREATE TABLE work_sessions (
      id TEXT PRIMARY KEY,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      active_seconds INTEGER NOT NULL,
      status TEXT NOT NULL,
      calendar_date TEXT NOT NULL,
      last_checkpoint TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT
    );
    CREATE TABLE agent_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  const repo = new SqliteAgentRepository(db);
  return { db, repo };
}

test("Phase 2 — Agent Synchronization & Durability", async (t) => {
  await t.test("1. New daily record syncs to server successfully", async () => {
    const { db, repo } = createTestDatabase();
    try {
      const pastTime = new Date(Date.now() - 100000).toISOString();
      repo.createSession({
        id: "sess-1",
        started_at: pastTime,
        ended_at: pastTime,
        active_seconds: 3600,
        calendar_date: "2026-09-24",
        status: "COMPLETED",
        last_checkpoint: pastTime,
        created_at: pastTime,
        updated_at: pastTime,
        synced_at: null,
      });

      const unsyncedBefore = repo.getUnsyncedDailyTotals();
      assert.equal(unsyncedBefore.length, 1);
      assert.equal(unsyncedBefore[0].calendar_date, "2026-09-24");
      assert.equal(unsyncedBefore[0].total_seconds, 3600);

      let payloadSent: any = null;
      let authHeader: string | null = null;

      const mockFetch: typeof fetch = async (input, init) => {
        authHeader = (init?.headers as Record<string, string>)?.["Authorization"] || null;
        payloadSent = JSON.parse(init?.body as string);
        return new Response(JSON.stringify({ success: true, count: 1 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };

      const syncService = new AgentSyncService(repo, {
        apiBaseUrl: "http://localhost:3000",
        syncToken: "test-valid-agent-token",
        fetchFn: mockFetch,
      });

      const result = await syncService.syncNow();
      assert.equal(result.success, true);
      assert.equal(result.syncedCount, 1);
      assert.equal(authHeader, "Bearer test-valid-agent-token");
      assert.deepEqual(payloadSent, {
        records: [{ date: "2026-09-24", active_seconds: 3600 }],
      });

      // Verify records are marked synced
      const unsyncedAfter = repo.getUnsyncedDailyTotals();
      assert.equal(unsyncedAfter.length, 0);
    } finally {
      db.close();
    }
  });

  await t.test("2. Same record synced twice is idempotent and does not duplicate", async () => {
    const { db, repo } = createTestDatabase();
    try {
      const pastTime = new Date(Date.now() - 100000).toISOString();
      repo.createSession({
        id: "sess-2",
        started_at: pastTime,
        ended_at: pastTime,
        active_seconds: 3600,
        calendar_date: "2026-09-24",
        status: "COMPLETED",
        last_checkpoint: pastTime,
        created_at: pastTime,
        updated_at: pastTime,
        synced_at: null,
      });

      let callCount = 0;
      const mockFetch: typeof fetch = async () => {
        callCount++;
        return new Response(JSON.stringify({ success: true, count: 1 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };

      const syncService = new AgentSyncService(repo, {
        apiBaseUrl: "http://localhost:3000",
        syncToken: "test-token",
        fetchFn: mockFetch,
      });

      // First sync
      const res1 = await syncService.syncNow();
      assert.equal(res1.success, true);
      assert.equal(callCount, 1);

      // Second sync immediately after: no unsynced work, call count should not increment
      const res2 = await syncService.syncNow();
      assert.equal(res2.success, true);
      assert.equal(res2.syncedCount, 0);
      assert.equal(callCount, 1);
    } finally {
      db.close();
    }
  });

  await t.test("3. Failed API request leaves records unsynced", async () => {
    const { db, repo } = createTestDatabase();
    try {
      const pastTime = new Date(Date.now() - 100000).toISOString();
      repo.createSession({
        id: "sess-3",
        started_at: pastTime,
        ended_at: pastTime,
        active_seconds: 3600,
        calendar_date: "2026-09-24",
        status: "COMPLETED",
        last_checkpoint: pastTime,
        created_at: pastTime,
        updated_at: pastTime,
        synced_at: null,
      });

      // Mock 500 error
      const mockFetch: typeof fetch = async () => {
        return new Response("Internal Server Error", { status: 500 });
      };

      const syncService = new AgentSyncService(repo, {
        apiBaseUrl: "http://localhost:3000",
        syncToken: "test-token",
        fetchFn: mockFetch,
      });

      const res = await syncService.syncNow();
      assert.equal(res.success, false);

      // Sessions must remain unsynced
      const unsynced = repo.getUnsyncedDailyTotals();
      assert.equal(unsynced.length, 1);
      assert.equal(unsynced[0].total_seconds, 3600);
    } finally {
      db.close();
    }
  });

  await t.test("4. Retry eventually succeeds and marks records synced", async () => {
    const { db, repo } = createTestDatabase();
    try {
      const pastTime = new Date(Date.now() - 100000).toISOString();
      repo.createSession({
        id: "sess-4",
        started_at: pastTime,
        ended_at: pastTime,
        active_seconds: 3600,
        calendar_date: "2026-09-24",
        status: "COMPLETED",
        last_checkpoint: pastTime,
        created_at: pastTime,
        updated_at: pastTime,
        synced_at: null,
      });

      let attempts = 0;
      const mockFetch: typeof fetch = async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error("Network unreachable");
        }
        return new Response(JSON.stringify({ success: true, count: 1 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };

      const syncService = new AgentSyncService(repo, {
        apiBaseUrl: "http://localhost:3000",
        syncToken: "test-token",
        fetchFn: mockFetch,
      });

      // Attempt 1 fails
      const res1 = await syncService.syncNow();
      assert.equal(res1.success, false);
      assert.equal(repo.getUnsyncedDailyTotals().length, 1);

      // Attempt 2 succeeds
      const res2 = await syncService.syncNow();
      assert.equal(res2.success, true);
      assert.equal(res2.syncedCount, 1);
      assert.equal(repo.getUnsyncedDailyTotals().length, 0);
    } finally {
      db.close();
    }
  });

  await t.test("5. Offline agent continues tracking and records work locally", () => {
    const { db, repo } = createTestDatabase();
    try {
      let virtualTime = new Date("2026-09-24T04:30:00.000Z").getTime();

      const engine = new TrackingEngine({
        idleThresholdMs: 300_000,
        checkpointIntervalMs: 5_000,
        repository: repo,
        timeProvider: () => virtualTime,
      });

      // Advance by 1800s (30m) with regular input
      for (let s = 0; s <= 1800; s++) {
        engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
        virtualTime += 1000;
      }

      engine.handleShutdown(virtualTime);

      const todayStr = getKolkataDateString(virtualTime - 1000);
      const dailyWork = repo.getTodayCumulativeSeconds(todayStr);
      assert.equal(dailyWork, 1800);

      const unsynced = repo.getUnsyncedDailyTotals();
      assert.equal(unsynced.length, 1);
      assert.equal(unsynced[0].total_seconds, 1800);
    } finally {
      db.close();
    }
  });

  await t.test("6. API downtime does not affect tracking loop", async () => {
    const { db, repo } = createTestDatabase();
    try {
      const mockFailingFetch: typeof fetch = async () => {
        throw new Error("Connection refused ECONNREFUSED 127.0.0.1:3000");
      };

      const syncService = new AgentSyncService(repo, {
        apiBaseUrl: "http://localhost:3000",
        syncToken: "test-token",
        fetchFn: mockFailingFetch,
      });

      let virtualTime = new Date("2026-09-24T04:30:00.000Z").getTime();
      const engine = new TrackingEngine({
        idleThresholdMs: 300_000,
        checkpointIntervalMs: 5_000,
        repository: repo,
        timeProvider: () => virtualTime,
      });

      for (let s = 0; s <= 600; s++) {
        engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
        virtualTime += 1000;
        if (s % 60 === 0) {
          // Sync attempt during tracking
          await syncService.syncNow();
        }
      }
      engine.handleShutdown(virtualTime);

      const todayStr = getKolkataDateString(virtualTime - 1000);
      const dailyWork = repo.getTodayCumulativeSeconds(todayStr);
      assert.equal(dailyWork, 600);
    } finally {
      db.close();
    }
  });
});
