import fs from "node:fs";
import { config } from "../config";
import { initDatabase } from "./storage/db";
import { SqliteAgentRepository } from "./storage/repository";
import {
  getKolkataDateString,
  formatDuration,
  formatIstTime,
} from "./timezone";

function runStatus() {
  const dbExists = fs.existsSync(config.dbPath);

  if (!dbExists) {
    console.log(`
Cyber Tracker Agent
-------------------
Status: STOPPED (No database found)
Daily cumulative work: 00:00:00
Idle threshold: ${config.idleThresholdMinutes} minutes
Database: NOT INITIALIZED (${config.dbPath})
Sync: NOT CONFIGURED (Phase 1 Local Mode)
`);
    return;
  }

  let db;
  try {
    db = initDatabase(config.dbPath);
    const repo = new SqliteAgentRepository(db);

    const runtimeStateRaw = repo.getState("runtime_state");
    let status = "STOPPED";
    let currentIdleSec = 0;
    let lastActivityStr = "--:--:-- IST";

    if (runtimeStateRaw) {
      try {
        const state = JSON.parse(runtimeStateRaw);
        status = state.status || "STOPPED";
        currentIdleSec = Math.round((state.currentIdleMs || 0) / 1000);
        if (state.lastActivityTime) {
          lastActivityStr = formatIstTime(state.lastActivityTime);
        }
      } catch {
        // Fallback
      }
    }

    const todayStr = getKolkataDateString(new Date());
    const cumulativeSeconds = repo.getTodayCumulativeSeconds(todayStr);

    const lastSyncStatus = repo.getState("last_sync_status") || (config.syncToken ? "CONFIGURED (Pending initial sync)" : "TOKEN NOT CONFIGURED");
    const lastSyncTime = repo.getState("last_successful_sync");
    const syncDisplay = lastSyncTime ? `${lastSyncStatus} (Last: ${formatIstTime(lastSyncTime)})` : lastSyncStatus;

    console.log(`
Cyber Tracker Agent
-------------------
Status: ${status}
Daily cumulative work: ${formatDuration(cumulativeSeconds)}
Idle threshold: ${config.idleThresholdMinutes} minutes
Current idle time: ${currentIdleSec} seconds
Last activity: ${lastActivityStr}
Database: OK (${config.dbPath})
Sync: ${syncDisplay}
`);
  } catch (err) {
    console.error("Failed to query agent status:", err);
  } finally {
    if (db) {
      try {
        db.close();
      } catch {
        // Ignore
      }
    }
  }
}

const command = process.argv[2] || "status";

if (command === "status") {
  runStatus();
} else {
  console.log(`Unknown command: ${command}`);
  console.log("Usage: tsx agent/src/cli.ts status");
  process.exit(1);
}
