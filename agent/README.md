# Cyber Tracker: Windows Work-Time Tracking Agent (Phase 1)

Automatic, zero-touch Windows work-time tracking engine for `cyber-tracker`. It turns active laptop usage (keyboard and mouse interaction) into the authoritative measure of productive work time.

---

## 1. System Overview & Core Principles

* **Zero Manual Interaction**: The tracker starts automatically with Windows. There are no Start or Stop buttons, no manual session logging, and the web tracker does not need to be open.
* **Objective Activity Measure**: Physical keyboard or mouse activity constitutes active work.
* **Privacy by Design**: Captures **ZERO** keystrokes, key values, window titles, URLs, file contents, screenshots, or clipboard data. Only Win32 system-level idle duration (`user32.dll!GetLastInputInfo`) is monitored.
* **Idle Exclusion Rule**: If inactivity reaches **5 minutes** (`IDLE_THRESHOLD_MINUTES = 5`), work tracking pauses. The 5-minute inactive period is **excluded** from productive work (`active_work_end = last_user_input_timestamp`).
* **Timezone Standard**: All calendar date boundaries and reports are anchored to **Asia/Kolkata** (IST, fixed UTC+05:30 offset). Midnight transitions automatically split sessions across dates.
* **Local Durability**: 100% offline-first. Uses SQLite with Write-Ahead Logging (`WAL`) and `synchronous = FULL` to guarantee that no recorded time is lost during process crashes, unexpected reboots, or power failures.

---

## 2. Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   Windows Subsystem                    │
│                                                        │
│  [user32.dll!GetLastInputInfo]   [SystemEvents.SessionSwitch]
│         (Idle Detection)               (Lock / Unlock) │
│                                                        │
│             [SystemEvents.PowerModeChanged]            │
│                     (Sleep / Wake)                     │
└───────────────────────────┬────────────────────────────┘
                            │ In-Memory PowerShell Pump
                            ▼
┌────────────────────────────────────────────────────────┐
│             WindowsSystemMonitor (IPC Stream)          │
│                agent/src/monitor/win-monitor.ts        │
└───────────────────────────┬────────────────────────────┘
                            │ Monitor Events
                            ▼
┌────────────────────────────────────────────────────────┐
│              TrackingEngine (State Machine)            │
│               agent/src/engine/state-machine.ts        │
│                                                        │
│  STARTING ──► ACTIVE ◄──────────┐                      │
│                  │              │                      │
│         5m idle  ▼              │ activity             │
│                 IDLE ───────────┘                      │
│                                                        │
│         LOCKED  │  SLEEPING  │  STOPPED                │
└───────────────────────────┬────────────────────────────┘
                            │ Checkpoints every 5s
                            ▼
┌────────────────────────────────────────────────────────┐
│         SQLite Storage (WAL + synchronous=FULL)        │
│                 agent/data/agent.db                    │
└────────────────────────────────────────────────────────┘
```

### Technology Choices
- **Node.js & TypeScript**: Core engine, state machine, date math, durability, and CLI diagnostics.
- **In-Memory PowerShell Win32 Event Pump**: Subscribes directly to `Microsoft.Win32.SystemEvents` and `user32.dll` in-memory. Bypasses Windows Application Control policies (WDAC) that block ad-hoc compiled `.exe` files, requires no native C++ compiler tools, and consumes < 0.2% CPU.
- **SQLite (`better-sqlite3`)**: Runs in WAL mode with `PRAGMA synchronous = FULL` for maximum crash resilience.

---

## 3. Command Reference

All commands can be run from the repository root:

| Command | Description |
| :--- | :--- |
| `npm run agent:status` | Display diagnostic status snapshot (daily cumulative work, idle status, database health) |
| `npm run agent:dev` | Run the agent in the foreground with live console logs (ideal for debugging) |
| `npm run agent:install` | Register Windows Scheduled Task for automatic background start at user login |
| `npm run agent:uninstall` | Unregister Scheduled Task and terminate active background agent processes |
| `npm run agent:start` | Start the agent via the Scheduled Task or background process |
| `npm run agent:stop` | Gracefully stop the agent and finalize open sessions |
| `npm run agent:check` | Check status of the Scheduled Task and background processes |
| `npm run agent:test` | Run the automated test suite (all 14 scenarios + durability tests) |

---

## 4. Diagnostics Output

Run:
```powershell
npm run agent:status
```

Sample output:
```text
Cyber Tracker Agent
-------------------
Status: ACTIVE
Daily cumulative work: 03:42:18
Idle threshold: 5 minutes
Current idle time: 12 seconds
Last activity: 10:31:44 IST
Database: OK (C:\Users\...\agent\data\agent.db)
Sync: NOT CONFIGURED (Phase 1 Local Mode)
```

Possible statuses:
- `ACTIVE`: Currently accumulating productive work time.
- `IDLE`: Keyboard/mouse idle for $\ge$ 5 minutes; tracking paused.
- `LOCKED`: Windows session is locked; tracking stopped.
- `SLEEPING`: System is suspended/sleeping; tracking stopped.
- `STARTING`: Initializing and probing initial input state.
- `STOPPED`: Agent cleanly shut down.
- `ERROR`: Unhandled exception or fault.

---

## 5. Lifecycle Behavior

### 1. Active Work
- Whenever Windows reports recent keyboard or mouse input (`idleMs < 300,000`), the engine remains in `ACTIVE`.
- Work is calculated from exact system timestamps, not loop iteration counters, avoiding timing drift.
- Session state is durably checkpointed every 5 seconds.

### 2. Idle Threshold (5 Minutes)
- When inactivity reaches exactly 5 minutes (300 seconds), tracking pauses.
- The 5-minute inactive window is **not** counted as work.
- The session is finalized at `active_work_end = last_user_input_timestamp`.
- When the user resumes interaction, a new session starts from the new activity point.

### 3. Windows Lock / Unlock
- **Lock**: Current session is finalized at lock time; state switches to `LOCKED`.
- **Unlock**: Transitions to `IDLE`. Does **not** count locked time. Waits for genuine keyboard/mouse activity before entering `ACTIVE`.

### 4. Sleep / Wake (Suspend / Resume)
- **Sleep**: Current session is finalized at sleep time; state switches to `SLEEPING`. Monotonic gap detection also guards against unnotified hardware suspension.
- **Wake**: Transitions to `IDLE`. Zero sleep time is accumulated. Waits for user activity.

### 5. Midnight IST Date Rollover
- Business date is anchored to `Asia/Kolkata` (UTC+05:30).
- If a session spans midnight IST (e.g. 23:58 to 00:12 IST), it is cleanly split:
  - Day 1: 120 seconds (23:58:00 to 23:59:59.999).
  - Day 2: 720 seconds (00:00:00 to 00:12:00.000).

### 6. Crash Recovery
- If the computer loses power or the process is killed abruptly, the agent discovers the unfinalized `ACTIVE` session on next startup.
- The session is finalized with status `INTERRUPTED` at its `last_checkpoint` timestamp.
- No work is fabricated during the offline interval.

---

## 6. Real-Machine Verification Procedure

Follow these steps on your Windows laptop to verify all functionality:

### Step 1: Automated Unit & Scenario Verification
```powershell
npm run agent:test
```
*Expected Result*: All 17 tests pass (14 core scenarios + 3 durability tests).

### Step 2: Interactive Foreground Test
```powershell
npm run agent:dev
```
1. Type or move your mouse. Notice the log shows `Status transition: STARTING -> ACTIVE`.
2. In a second terminal window, run:
   ```powershell
   npm run agent:status
   ```
   Verify that `Status: ACTIVE` and `Daily cumulative work` displays your accumulated time.
3. Stop typing/moving for 5 minutes (or set `CYBER_AGENT_IDLE_MINUTES=1` in your environment for a quick 1-minute test).
4. Verify the log shows `Idle threshold reached. Pausing work tracking.` and transitions to `IDLE`.
5. Move the mouse again. Verify tracking resumes automatically.
6. Press `Ctrl+C` to terminate the agent.

### Step 3: Install Automatic Windows Startup
```powershell
npm run agent:install
```
*Expected Result*: Confirms `CyberTrackerAgent` Scheduled Task is registered.

### Step 4: Verify Task Health
```powershell
npm run agent:check
```
*Expected Result*: Shows `Scheduled Task: REGISTERED`.

### Step 5: Start & Verify Background Operation
```powershell
npm run agent:start
npm run agent:status
```
*Expected Result*: Shows `Status: ACTIVE` without any command prompt window open.

### Step 6: Uninstall Scheduled Task
When desired, cleanly remove the task and background process:
```powershell
npm run agent:uninstall
```
