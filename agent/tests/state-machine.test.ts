import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import Database from "better-sqlite3";
import { TrackingEngine } from "../src/engine/state-machine";
import { SqliteAgentRepository } from "../src/storage/repository";
import { getKolkataDateString } from "../src/timezone";
import { runStartupRecovery } from "../src/engine/recovery";

function createTestDatabase(): Database.Database {
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
  return db;
}

describe("Tracking State Machine & Engine", () => {
  let db: Database.Database;
  let repo: SqliteAgentRepository;
  let virtualTime: number;

  beforeEach(() => {
    db = createTestDatabase();
    repo = new SqliteAgentRepository(db);
    // Baseline: 2026-09-23 10:00:00 IST = 2026-09-23 04:30:00 UTC
    virtualTime = new Date("2026-09-23T04:30:00.000Z").getTime();
  });

  // Scenario 1: User active for 1 hour -> approximately 1 hour recorded
  test("Scenario 1: User active for 1 hour -> exactly 3,600 active seconds recorded", () => {
    const engine = new TrackingEngine({
      idleThresholdMs: 300_000, // 5 min
      checkpointIntervalMs: 5_000,
      repository: repo,
      timeProvider: () => virtualTime,
    });

    // Initial tick to start
    engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    assert.strictEqual(engine.getStatus(), "ACTIVE");

    // Advance 1 hour in 1-second intervals with continuous activity
    for (let s = 1; s <= 3600; s++) {
      virtualTime += 1000;
      engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    }

    engine.handleShutdown(virtualTime);
    assert.strictEqual(engine.getStatus(), "STOPPED");

    const todayStr = getKolkataDateString(virtualTime);
    const cumulative = repo.getTodayCumulativeSeconds(todayStr);
    assert.strictEqual(cumulative, 3600);
  });

  // Scenario 2: Active -> 5+ minutes idle -> idle time excluded
  test("Scenario 2: Active -> 5+ minutes idle -> idle period excluded", () => {
    const engine = new TrackingEngine({
      idleThresholdMs: 300_000, // 5 min
      checkpointIntervalMs: 5_000,
      repository: repo,
      timeProvider: () => virtualTime,
    });

    // User active for 40 minutes (2400 seconds)
    engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    for (let s = 1; s <= 2400; s++) {
      virtualTime += 1000;
      engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    }

    // User stops typing and walks away for 5 minutes (300 seconds)
    for (let s = 1; s <= 300; s++) {
      virtualTime += 1000;
      engine.handleEvent({ type: "TICK", idleMs: s * 1000, timestamp: virtualTime });
    }

    // Threshold reached, engine should transition to IDLE
    assert.strictEqual(engine.getStatus(), "IDLE");

    // The recorded active time must be 2400s; the 5 min idle period must NOT be counted
    const todayStr = getKolkataDateString(virtualTime);
    const cumulative = repo.getTodayCumulativeSeconds(todayStr);
    assert.strictEqual(cumulative, 2400);
  });

  // Scenario 3: Idle -> activity -> tracking resumes
  test("Scenario 3: Idle -> activity -> tracking resumes from new activity point", () => {
    const engine = new TrackingEngine({
      idleThresholdMs: 300_000,
      checkpointIntervalMs: 5_000,
      repository: repo,
      timeProvider: () => virtualTime,
    });

    // 1. Active for 10 minutes (600s)
    engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    for (let s = 1; s <= 600; s++) {
      virtualTime += 1000;
      engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    }

    // 2. Idle for 5 minutes (reaches threshold)
    for (let s = 1; s <= 300; s++) {
      virtualTime += 1000;
      engine.handleEvent({ type: "TICK", idleMs: s * 1000, timestamp: virtualTime });
    }
    assert.strictEqual(engine.getStatus(), "IDLE");

    // 3. User remains away for another 20 minutes (1200s)
    for (let s = 1; s <= 1200; s++) {
      virtualTime += 1000;
      engine.handleEvent({ type: "TICK", idleMs: (300 + s) * 1000, timestamp: virtualTime });
    }
    assert.strictEqual(engine.getStatus(), "IDLE");

    // 4. User returns and moves mouse (idleMs drops to 0)
    virtualTime += 1000;
    engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    assert.strictEqual(engine.getStatus(), "ACTIVE");

    // 5. Active for another 15 minutes (900s)
    for (let s = 1; s <= 900; s++) {
      virtualTime += 1000;
      engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    }
    engine.handleShutdown(virtualTime);

    // Total should be 600s + 900s = 1500s. Away time (25 mins) has 0s.
    const todayStr = getKolkataDateString(virtualTime);
    const cumulative = repo.getTodayCumulativeSeconds(todayStr);
    assert.strictEqual(cumulative, 1500);
  });

  // Scenario 4: Lock -> no work recorded while locked
  test("Scenario 4: Lock -> stops tracking and ignores time while locked", () => {
    const engine = new TrackingEngine({
      idleThresholdMs: 300_000,
      checkpointIntervalMs: 5_000,
      repository: repo,
      timeProvider: () => virtualTime,
    });

    // Active for 30 minutes (1800s)
    engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    for (let s = 1; s <= 1800; s++) {
      virtualTime += 1000;
      engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    }

    // Windows Lock event fires
    engine.handleEvent({ type: "LOCK", timestamp: virtualTime });
    assert.strictEqual(engine.getStatus(), "LOCKED");

    // Computer locked for 1 hour (3600s)
    for (let s = 1; s <= 3600; s++) {
      virtualTime += 1000;
      engine.handleEvent({ type: "TICK", idleMs: s * 1000, timestamp: virtualTime });
    }
    assert.strictEqual(engine.getStatus(), "LOCKED");

    // Windows Unlock event fires
    engine.handleEvent({ type: "UNLOCK", timestamp: virtualTime });
    assert.strictEqual(engine.getStatus(), "IDLE");

    // User starts typing again after unlock
    virtualTime += 1000;
    engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    assert.strictEqual(engine.getStatus(), "ACTIVE");

    engine.handleShutdown(virtualTime);

    // Only the 1800s was counted
    const todayStr = getKolkataDateString(virtualTime);
    const cumulative = repo.getTodayCumulativeSeconds(todayStr);
    assert.strictEqual(cumulative, 1800);
  });

  // Scenario 5: Sleep -> sleep duration excluded
  test("Scenario 5: Sleep -> sleep duration contributes zero work", () => {
    const engine = new TrackingEngine({
      idleThresholdMs: 300_000,
      checkpointIntervalMs: 5_000,
      repository: repo,
      timeProvider: () => virtualTime,
    });

    // Active for 20 minutes (1200s)
    engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    for (let s = 1; s <= 1200; s++) {
      virtualTime += 1000;
      engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    }

    // Laptop enters Sleep
    engine.handleEvent({ type: "SUSPEND", timestamp: virtualTime });
    assert.strictEqual(engine.getStatus(), "SLEEPING");

    // System asleep for 2 hours (7200 seconds)
    virtualTime += 7200 * 1000;

    // Laptop wakes
    engine.handleEvent({ type: "RESUME", timestamp: virtualTime });
    assert.strictEqual(engine.getStatus(), "IDLE");

    // User resumes typing
    virtualTime += 1000;
    engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    assert.strictEqual(engine.getStatus(), "ACTIVE");

    engine.handleShutdown(virtualTime);

    const todayStr = getKolkataDateString(virtualTime);
    const cumulative = repo.getTodayCumulativeSeconds(todayStr);
    assert.strictEqual(cumulative, 1200);
  });

  // Scenario 6: Shutdown/restart -> previously persisted work survives
  test("Scenario 6: Shutdown/restart -> previously persisted work survives cleanly", () => {
    const engine = new TrackingEngine({
      idleThresholdMs: 300_000,
      checkpointIntervalMs: 5_000,
      repository: repo,
      timeProvider: () => virtualTime,
    });

    // Active for 45 minutes (2700s)
    engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    for (let s = 1; s <= 2700; s++) {
      virtualTime += 1000;
      engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    }

    // OS shutdown
    engine.handleShutdown(virtualTime);
    assert.strictEqual(engine.getStatus(), "STOPPED");

    // Advance 30 minutes offline, then reboot agent
    virtualTime += 1800 * 1000;
    const restartedEngine = new TrackingEngine({
      idleThresholdMs: 300_000,
      checkpointIntervalMs: 5_000,
      repository: repo,
      timeProvider: () => virtualTime,
    });

    // Machine starts active
    restartedEngine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    assert.strictEqual(restartedEngine.getStatus(), "ACTIVE");

    // Active for another 15 minutes (900s)
    for (let s = 1; s <= 900; s++) {
      virtualTime += 1000;
      restartedEngine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    }
    restartedEngine.handleShutdown(virtualTime);

    // Total: 2700 + 900 = 3600 seconds
    const todayStr = getKolkataDateString(virtualTime);
    const cumulative = repo.getTodayCumulativeSeconds(todayStr);
    assert.strictEqual(cumulative, 3600);
  });

  // Scenario 7: Process crash -> durable checkpoint data survives
  test("Scenario 7: Process crash -> unfinished session finalized at last checkpoint", () => {
    const engine = new TrackingEngine({
      idleThresholdMs: 300_000,
      checkpointIntervalMs: 5_000, // Checkpoints every 5s
      repository: repo,
      timeProvider: () => virtualTime,
    });

    // Track for 30 seconds with checkpoints
    engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    for (let s = 1; s <= 30; s++) {
      virtualTime += 1000;
      engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    }

    // Process abruptly crashes without handleShutdown()!
    // Active session is still in DB with status = 'ACTIVE' and last_checkpoint recorded.
    const unfinalized = repo.getActiveSessions();
    assert.strictEqual(unfinalized.length, 1);
    assert.strictEqual(unfinalized[0].active_seconds, 30);

    // On agent reboot, crash recovery runs:
    const recoveryResult = runStartupRecovery(repo);
    assert.strictEqual(recoveryResult.recoveredCount, 1);

    // Session is now finalized as INTERRUPTED, preserving the 30 seconds
    const recoveredSession = repo.getSessionById(unfinalized[0].id);
    assert.strictEqual(recoveredSession?.status, "INTERRUPTED");
    assert.strictEqual(recoveredSession?.active_seconds, 30);
  });

  // Scenario 8: Network unavailable -> local work remains intact
  test("Scenario 8: Network unavailable -> local SQLite work remains intact", () => {
    // Engine operates completely locally against SQLite
    const engine = new TrackingEngine({
      idleThresholdMs: 300_000,
      checkpointIntervalMs: 5_000,
      repository: repo,
      timeProvider: () => virtualTime,
    });

    engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    for (let s = 1; s <= 500; s++) {
      virtualTime += 1000;
      engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    }
    engine.handleShutdown(virtualTime);

    const todayStr = getKolkataDateString(virtualTime);
    assert.strictEqual(repo.getTodayCumulativeSeconds(todayStr), 500);
  });

  // Scenario 9: Midnight IST crossing -> time split across two dates
  test("Scenario 9: Midnight IST crossing -> time split across two calendar dates", () => {
    // Start at 23:58:00 IST on 2026-09-23 = 18:28:00 UTC
    virtualTime = new Date("2026-09-23T18:28:00.000Z").getTime();
    assert.strictEqual(getKolkataDateString(virtualTime), "2026-09-23");

    const engine = new TrackingEngine({
      idleThresholdMs: 300_000,
      checkpointIntervalMs: 5_000,
      repository: repo,
      timeProvider: () => virtualTime,
    });

    // Start tracking at 23:58:00 IST
    engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });

    // Track for 14 minutes (840 seconds) -> ends at 00:12:00 IST on 2026-09-24
    for (let s = 1; s <= 840; s++) {
      virtualTime += 1000;
      engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    }
    engine.handleShutdown(virtualTime);

    assert.strictEqual(getKolkataDateString(virtualTime), "2026-09-24");

    // Day 1 (2026-09-23) should have exactly 2 minutes (120 seconds): 23:58 to 00:00
    const day1Seconds = repo.getTodayCumulativeSeconds("2026-09-23");
    assert.strictEqual(day1Seconds, 120);

    // Day 2 (2026-09-24) should have exactly 12 minutes (720 seconds): 00:00 to 00:12
    const day2Seconds = repo.getTodayCumulativeSeconds("2026-09-24");
    assert.strictEqual(day2Seconds, 720);
  });

  // Scenario 10: Long idle period -> no accidental work accumulation
  test("Scenario 10: Long idle period -> no accidental work accumulation", () => {
    const engine = new TrackingEngine({
      idleThresholdMs: 300_000,
      checkpointIntervalMs: 5_000,
      repository: repo,
      timeProvider: () => virtualTime,
    });

    // Start active for 100s
    engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    for (let s = 1; s <= 100; s++) {
      virtualTime += 1000;
      engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    }

    // User is idle for 5 hours (18,000 seconds)
    for (let s = 1; s <= 18000; s++) {
      virtualTime += 1000;
      engine.handleEvent({ type: "TICK", idleMs: s * 1000, timestamp: virtualTime });
    }
    assert.strictEqual(engine.getStatus(), "IDLE");

    const todayStr = getKolkataDateString(virtualTime);
    assert.strictEqual(repo.getTodayCumulativeSeconds(todayStr), 100);
  });

  // Scenario 11: Rapid activity/idle transitions within threshold
  test("Scenario 11: Rapid activity/idle transitions within threshold accumulate work", () => {
    const engine = new TrackingEngine({
      idleThresholdMs: 300_000, // 5 min
      checkpointIntervalMs: 5_000,
      repository: repo,
      timeProvider: () => virtualTime,
    });

    engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });

    // Alternates: 10s typing, 30s reading (idle 30s < 300s), 10 times
    // Total elapsed = 400 seconds, threshold never reached
    for (let cycle = 0; cycle < 10; cycle++) {
      // 10s active
      for (let s = 1; s <= 10; s++) {
        virtualTime += 1000;
        engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
      }
      // 30s pause
      for (let s = 1; s <= 30; s++) {
        virtualTime += 1000;
        engine.handleEvent({ type: "TICK", idleMs: s * 1000, timestamp: virtualTime });
      }
    }
    // Touch key to finalize all elapsed time within threshold
    virtualTime += 1000;
    engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });

    engine.handleShutdown(virtualTime);

    const todayStr = getKolkataDateString(virtualTime);
    const cumulative = repo.getTodayCumulativeSeconds(todayStr);
    assert.strictEqual(cumulative, 401);
  });

  // Scenario 12: Agent starts while machine is already idle
  test("Scenario 12: Agent starts while machine is already idle -> initializes in IDLE state", () => {
    const engine = new TrackingEngine({
      idleThresholdMs: 300_000, // 5 min
      checkpointIntervalMs: 5_000,
      repository: repo,
      timeProvider: () => virtualTime,
    });

    // First tick reports 10 minutes idle (600,000 ms)
    engine.handleEvent({ type: "TICK", idleMs: 600_000, timestamp: virtualTime });
    assert.strictEqual(engine.getStatus(), "IDLE");

    // No session was opened
    assert.strictEqual(repo.getActiveSessions().length, 0);
  });

  // Scenario 13: Agent starts while machine is already active
  test("Scenario 13: Agent starts while machine is already active -> initializes in ACTIVE state", () => {
    const engine = new TrackingEngine({
      idleThresholdMs: 300_000,
      checkpointIntervalMs: 5_000,
      repository: repo,
      timeProvider: () => virtualTime,
    });

    // First tick reports 500 ms idle (< 5 min)
    engine.handleEvent({ type: "TICK", idleMs: 500, timestamp: virtualTime });
    assert.strictEqual(engine.getStatus(), "ACTIVE");
    assert.strictEqual(repo.getActiveSessions().length, 1);
  });

  // Scenario 14: System clock changes do not produce enormous fake work intervals
  test("Scenario 14: System clock jumps forward or backward do not produce fake work", () => {
    const engine = new TrackingEngine({
      idleThresholdMs: 300_000,
      checkpointIntervalMs: 5_000,
      repository: repo,
      timeProvider: () => virtualTime,
    });

    // Track 60 seconds normally
    engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    for (let s = 1; s <= 60; s++) {
      virtualTime += 1000;
      engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });
    }

    // Clock jumps 10 days into the future!
    virtualTime += 10 * 24 * 3600 * 1000;

    // Next tick: idleMs = 0
    engine.handleEvent({ type: "TICK", idleMs: 0, timestamp: virtualTime });

    // The gap was detected; it did NOT award 10 days of work!
    // Active session before the jump was finalized cleanly at 60s
    engine.handleShutdown(virtualTime);

    const oldDateStr = "2026-09-23";
    const oldDayWork = repo.getTodayCumulativeSeconds(oldDateStr);
    assert.strictEqual(oldDayWork, 60);
  });
});
