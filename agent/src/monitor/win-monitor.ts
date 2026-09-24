import { spawn, type ChildProcess } from "node:child_process";
import type { ISystemMonitor } from "./types";
import type { MonitorEvent } from "../types";
import { logger } from "../logger";

const PS_MONITOR_SCRIPT = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;

public class WinIdle {
    [StructLayout(LayoutKind.Sequential)]
    public struct LASTINPUTINFO {
        public uint cbSize;
        public uint dwTime;
    }

    [DllImport("user32.dll")]
    public static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);

    public static uint GetIdleMs() {
        LASTINPUTINFO lii = new LASTINPUTINFO();
        lii.cbSize = (uint)Marshal.SizeOf(lii);
        if (GetLastInputInfo(ref lii)) {
            return (uint)Environment.TickCount - lii.dwTime;
        }
        return 0;
    }
}
"@

[Microsoft.Win32.SystemEvents]::add_SessionSwitch({
    param($s, $e)
    [Console]::WriteLine("EVENT:SESSION_SWITCH:" + $e.Reason)
})

[Microsoft.Win32.SystemEvents]::add_PowerModeChanged({
    param($s, $e)
    [Console]::WriteLine("EVENT:POWER_MODE:" + $e.Mode)
})

[Microsoft.Win32.SystemEvents]::add_SessionEnding({
    param($s, $e)
    [Console]::WriteLine("EVENT:SESSION_ENDING:" + $e.Reason)
})

[Console]::WriteLine("READY")

while ($true) {
    [System.Windows.Forms.Application]::DoEvents()
    $idle = [WinIdle]::GetIdleMs()
    [Console]::WriteLine("TICK:" + $idle)
    Start-Sleep -Milliseconds 1000
}
`;

export class WindowsSystemMonitor implements ISystemMonitor {
  private child: ChildProcess | null = null;
  private listeners: ((event: MonitorEvent) => void)[] = [];
  private active = false;
  private buffer = "";

  public isRunning(): boolean {
    return this.active && this.child !== null && !this.child.killed;
  }

  public onEvent(callback: (event: MonitorEvent) => void): void {
    this.listeners.push(callback);
  }

  private emit(event: MonitorEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        logger.error("Error in monitor event listener", { error: String(err) });
      }
    }
  }

  public async start(): Promise<void> {
    if (this.active) return;
    this.active = true;

    return new Promise((resolve, reject) => {
      let resolved = false;

      try {
        this.child = spawn("powershell.exe", [
          "-NoProfile",
          "-NonInteractive",
          "-ExecutionPolicy",
          "Bypass",
          "-Command",
          PS_MONITOR_SCRIPT,
        ], {
          windowsHide: true,
          stdio: ["pipe", "pipe", "pipe"],
        });

        this.child.stdout?.on("data", (chunk: Buffer) => {
          this.buffer += chunk.toString("utf8");
          const lines = this.buffer.split(/\r?\n/);
          this.buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed === "READY") {
              if (!resolved) {
                resolved = true;
                resolve();
              }
              this.emit({ type: "READY", timestamp: Date.now() });
              continue;
            }

            if (trimmed.startsWith("TICK:")) {
              const idleMs = Number.parseInt(trimmed.substring(5), 10);
              if (!Number.isNaN(idleMs)) {
                this.emit({
                  type: "TICK",
                  idleMs: Math.max(0, idleMs),
                  timestamp: Date.now(),
                });
              }
              continue;
            }

            if (trimmed.startsWith("EVENT:SESSION_SWITCH:")) {
              const reason = trimmed.substring(21).trim();
              if (reason === "SessionLock") {
                this.emit({ type: "LOCK", timestamp: Date.now() });
              } else if (reason === "SessionUnlock") {
                this.emit({ type: "UNLOCK", timestamp: Date.now() });
              }
              continue;
            }

            if (trimmed.startsWith("EVENT:POWER_MODE:")) {
              const mode = trimmed.substring(17).trim();
              if (mode === "Suspend") {
                this.emit({ type: "SUSPEND", timestamp: Date.now() });
              } else if (mode === "Resume") {
                this.emit({ type: "RESUME", timestamp: Date.now() });
              }
              continue;
            }

            if (trimmed.startsWith("EVENT:SESSION_ENDING:")) {
              this.emit({ type: "SHUTDOWN", timestamp: Date.now() });
            }
          }
        });

        this.child.stderr?.on("data", (chunk: Buffer) => {
          logger.warn("Windows monitor stderr", { output: chunk.toString("utf8").trim() });
        });

        this.child.on("exit", (code, signal) => {
          logger.warn("Windows monitor process exited", { code, signal });
          if (!resolved) {
            resolved = true;
            reject(new Error(`Windows monitor process exited prematurely with code ${code}`));
          }
          if (this.active) {
            // Restart if unexpectedly died
            logger.info("Attempting monitor restart in 2 seconds...");
            setTimeout(() => {
              if (this.active) {
                this.active = false;
                this.start().catch((err) => {
                  logger.error("Failed to restart Windows monitor", { error: String(err) });
                });
              }
            }, 2000);
          }
        });

        // Safety timeout for ready signal
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(); // Allow agent to proceed even if READY banner was missed
          }
        }, 5000);
      } catch (err) {
        this.active = false;
        reject(err);
      }
    });
  }

  public async stop(): Promise<void> {
    this.active = false;
    if (this.child) {
      try {
        this.child.kill();
      } catch {
        // Child already terminated
      }
      this.child = null;
    }
  }
}
