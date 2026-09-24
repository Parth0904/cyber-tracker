import path from "node:path";
import fs from "node:fs";
import dotenv from "dotenv";

// Resolves relative to workspace agent directory
const agentRoot = path.resolve(__dirname);
const projectRoot = path.resolve(agentRoot, "..");

// Load root .env file if available
const rootEnvPath = path.join(projectRoot, ".env");
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}

export interface AgentConfig {
  idleThresholdMinutes: number;
  idleThresholdMs: number;
  pollIntervalMs: number;
  checkpointIntervalMs: number;
  timezone: string;
  dbPath: string;
  logPath: string;
  apiBaseUrl: string;
  syncToken: string;
  syncIntervalMs: number;
}

const idleMinutes = Number.parseInt(process.env.CYBER_AGENT_IDLE_MINUTES || "5", 10);
const validatedIdleMinutes = Number.isFinite(idleMinutes) && idleMinutes > 0 ? idleMinutes : 5;

const syncIntervalSeconds = Number.parseInt(process.env.CYBER_AGENT_SYNC_INTERVAL_SECONDS || "15", 10);
const validatedSyncIntervalMs = (Number.isFinite(syncIntervalSeconds) && syncIntervalSeconds > 0 ? syncIntervalSeconds : 15) * 1000;

export const config: AgentConfig = {
  idleThresholdMinutes: validatedIdleMinutes,
  idleThresholdMs: validatedIdleMinutes * 60 * 1000,
  pollIntervalMs: 1000,
  checkpointIntervalMs: 5000,
  timezone: "Asia/Kolkata",
  dbPath: process.env.CYBER_AGENT_DB_PATH || path.join(agentRoot, "data", "agent.db"),
  logPath: process.env.CYBER_AGENT_LOG_PATH || path.join(agentRoot, "logs", "agent.log"),
  apiBaseUrl: process.env.CYBER_TRACKER_API_URL || process.env.API_BASE_URL || "http://localhost:3000",
  syncToken: process.env.AGENT_SYNC_TOKEN || process.env.CYBER_AGENT_TOKEN || process.env.AUTH_SECRET || "",
  syncIntervalMs: validatedSyncIntervalMs,
};
