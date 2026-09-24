import fs from "node:fs";
import path from "node:path";
import { config } from "../config";
import { formatIstTime } from "./timezone";

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const MAX_LOG_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

class AgentLogger {
  private logPath: string;
  private logDir: string;

  constructor() {
    this.logPath = config.logPath;
    this.logDir = path.dirname(this.logPath);
    this.ensureDir();
  }

  private ensureDir(): void {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (err) {
      console.error("Failed to create log directory:", err);
    }
  }

  private checkRotation(): void {
    try {
      if (fs.existsSync(this.logPath)) {
        const stats = fs.statSync(this.logPath);
        if (stats.size > MAX_LOG_SIZE_BYTES) {
          const backupPath = `${this.logPath}.1`;
          if (fs.existsSync(backupPath)) {
            fs.unlinkSync(backupPath);
          }
          fs.renameSync(this.logPath, backupPath);
        }
      }
    } catch {
      // Non-fatal if rotation check fails
    }
  }

  public log(level: LogLevel, event: string, details?: Record<string, unknown>): void {
    const now = new Date();
    const isoUtc = now.toISOString();
    const istTime = formatIstTime(now);

    const logEntry = {
      timestamp: isoUtc,
      ist: istTime,
      level,
      event,
      ...(details ? { details } : {}),
    };

    const formattedLine = JSON.stringify(logEntry);

    // Console output for dev/debug
    if (level === "ERROR") {
      console.error(`[${istTime}] [${level}] ${event}`, details || "");
    } else if (level === "WARN") {
      console.warn(`[${istTime}] [${level}] ${event}`, details || "");
    } else {
      console.log(`[${istTime}] [${level}] ${event}`, details || "");
    }

    // Append to file
    try {
      this.ensureDir();
      this.checkRotation();
      fs.appendFileSync(this.logPath, formattedLine + "\n", "utf8");
    } catch (err) {
      console.error("Failed to write to agent log file:", err);
    }
  }

  public info(event: string, details?: Record<string, unknown>): void {
    this.log("INFO", event, details);
  }

  public warn(event: string, details?: Record<string, unknown>): void {
    this.log("WARN", event, details);
  }

  public error(event: string, details?: Record<string, unknown>): void {
    this.log("ERROR", event, details);
  }

  public debug(event: string, details?: Record<string, unknown>): void {
    if (process.env.CYBER_AGENT_DEBUG === "1") {
      this.log("DEBUG", event, details);
    }
  }
}

export const logger = new AgentLogger();
