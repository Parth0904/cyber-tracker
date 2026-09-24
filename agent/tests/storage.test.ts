import { test, describe, afterEach } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { initDatabase } from "../src/storage/db";
import { SqliteAgentRepository } from "../src/storage/repository";
import { runStartupRecovery } from "../src/engine/recovery";
import type { WorkSession } from "../src/types";

describe("SQLite Durability & Crash Recovery", () => {
  const testDbDir = path.join(__dirname, "temp");
  const testDbPath = path.join(testDbDir, "test_durability.db");

  afterEach(() => {
    try {
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
      const wal = `${testDbPath}-wal`;
      if (fs.existsSync(wal)) fs.unlinkSync(wal);
      const shm = `${testDbPath}-shm`;
      if (fs.existsSync(shm)) fs.unlinkSync(shm);
      if (fs.existsSync(testDbDir)) {
        fs.rmSync(testDbDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore
    }
  });

  test("Verifies WAL mode and synchronous=FULL pragmas", () => {
    const db = initDatabase(testDbPath);
    const journalMode = db.pragma("journal_mode", { simple: true });
    const synchronous = db.pragma("synchronous", { simple: true });
    db.close();

    assert.strictEqual(journalMode, "wal");
    // synchronous=FULL corresponds to level 2
    assert.strictEqual(synchronous, 2);
  });

  test("Durable session checkpoints survive sudden DB disconnect and recovery", () => {
    // 1. Initial process: create session and write checkpoints
    let db = initDatabase(testDbPath);
    let repo = new SqliteAgentRepository(db);

    const session: WorkSession = {
      id: "test-crash-1",
      started_at: "2026-09-23T04:00:00.000Z",
      ended_at: "2026-09-23T04:00:00.000Z",
      active_seconds: 0,
      status: "ACTIVE",
      calendar_date: "2026-09-23",
      last_checkpoint: "2026-09-23T04:00:00.000Z",
      created_at: "2026-09-23T04:00:00.000Z",
      updated_at: "2026-09-23T04:00:00.000Z",
      synced_at: null,
    };

    repo.createSession(session);

    // Simulate 50 seconds of checkpoints
    repo.updateCheckpoint(
      "test-crash-1",
      "2026-09-23T04:00:50.000Z",
      50,
      "2026-09-23T04:00:50.000Z"
    );

    // Abruptly close DB connection (simulating unexpected process death / power off)
    db.close();

    // 2. New agent process boots up: connects to same SQLite DB
    db = initDatabase(testDbPath);
    repo = new SqliteAgentRepository(db);

    // Before recovery: session is ACTIVE with 50 active_seconds
    const unfinalized = repo.getActiveSessions();
    assert.strictEqual(unfinalized.length, 1);
    assert.strictEqual(unfinalized[0].active_seconds, 50);

    // Run crash recovery
    const recoveryResult = runStartupRecovery(repo);
    assert.strictEqual(recoveryResult.recoveredCount, 1);
    assert.strictEqual(recoveryResult.recoveredSessionIds[0], "test-crash-1");

    // After recovery: session is marked INTERRUPTED at last checkpoint without data loss
    const recovered = repo.getSessionById("test-crash-1");
    assert.strictEqual(recovered?.status, "INTERRUPTED");
    assert.strictEqual(recovered?.active_seconds, 50);
    assert.strictEqual(recovered?.ended_at, "2026-09-23T04:00:50.000Z");

    // Cumulative calculation reflects the 50 seconds
    const cumulative = repo.getTodayCumulativeSeconds("2026-09-23");
    assert.strictEqual(cumulative, 50);

    db.close();
  });

  test("Agent runtime state persists and retrieves cleanly", () => {
    const db = initDatabase(testDbPath);
    const repo = new SqliteAgentRepository(db);

    repo.setState("test_key", JSON.stringify({ status: "ACTIVE", count: 42 }));
    const retrieved = repo.getState("test_key");
    assert.notStrictEqual(retrieved, null);

    const parsed = JSON.parse(retrieved!);
    assert.strictEqual(parsed.status, "ACTIVE");
    assert.strictEqual(parsed.count, 42);

    db.close();
  });
});
