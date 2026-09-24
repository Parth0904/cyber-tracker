import { config } from "../config";
import { initDatabase } from "./storage/db";
import { SqliteAgentRepository } from "./storage/repository";
import { runStartupRecovery } from "./engine/recovery";
import { TrackingEngine } from "./engine/state-machine";
import { WindowsSystemMonitor } from "./monitor/win-monitor";
import { AgentSyncService } from "./sync/sync-client";
import { logger } from "./logger";

async function main() {
  logger.info("=========================================");
  logger.info("Starting Cyber Tracker Windows Agent");
  logger.info("=========================================");
  logger.info("Configuration", {
    idleThresholdMinutes: config.idleThresholdMinutes,
    pollIntervalMs: config.pollIntervalMs,
    checkpointIntervalMs: config.checkpointIntervalMs,
    timezone: config.timezone,
    dbPath: config.dbPath,
    logPath: config.logPath,
  });

  // 1. Initialize SQLite Database (WAL + synchronous=FULL)
  const db = initDatabase(config.dbPath);
  const repository = new SqliteAgentRepository(db);

  // 2. Perform crash recovery for any unfinalized sessions
  const recoveryResult = runStartupRecovery(repository);
  if (recoveryResult.recoveredCount > 0) {
    logger.info("Crash recovery successfully restored uncommitted sessions", recoveryResult as unknown as Record<string, unknown>);
  }

  // 3. Initialize Tracking Engine
  const engine = new TrackingEngine({
    idleThresholdMs: config.idleThresholdMs,
    checkpointIntervalMs: config.checkpointIntervalMs,
    repository,
  });

  // 4. Initialize Windows Activity & Lifecycle Monitor
  const monitor = new WindowsSystemMonitor();
  monitor.onEvent((event) => {
    engine.handleEvent(event);
  });

  // 5. Initialize Background Sync Service (Offline-First)
  const syncService = new AgentSyncService(repository);
  syncService.start();

  // 6. Graceful shutdown handler
  let isShuttingDown = false;
  const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`Received shutdown signal: ${signal}. Finalizing active sessions...`);
    try {
      engine.handleShutdown();
      await syncService.syncNow().catch(() => {});
      syncService.stop();
      await monitor.stop();
      repository.close();
      logger.info("Agent stopped cleanly.");
    } catch (err) {
      logger.error("Error during graceful shutdown", { error: String(err) });
    }
    process.exit(0);
  };

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGHUP", () => gracefulShutdown("SIGHUP"));

  // Handle uncaught exceptions
  process.on("uncaughtException", (err) => {
    logger.error("Uncaught exception in agent", { error: String(err), stack: err.stack });
    gracefulShutdown("uncaughtException");
  });

  // 6. Start Windows monitor
  try {
    await monitor.start();
    logger.info("Windows background monitor successfully started.");
  } catch (err) {
    logger.error("Failed to start Windows monitor", { error: String(err) });
    process.exit(1);
  }
}

main().catch((err) => {
  logger.error("Fatal error starting agent", { error: String(err) });
  process.exit(1);
});
