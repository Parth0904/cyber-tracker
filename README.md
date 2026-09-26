# Cyber Tracker — Production Operations Guide

Cyber Tracker is a precision work-time tracking and monthly planning system designed for rigorous focus, schedule clarity, and verified computer activity.

---

## 1. System Overview

Cyber Tracker combines three core components:

1. **Monthly Calendar Planner**:
   - Monthly schedule grid with default working days (Monday–Friday: 8h standard) and holidays (Saturday–Sunday: 0h).
   - Dynamic deficit redistribution across remaining workdays in the active month.
   - 10+ hr cap warning when required daily pace reaches or exceeds 10 hours.
   - Zero cross-month debt carryover (each calendar month is strictly independent).
   - Customizable day overrides (Workday / Holiday) and metadata topics.

2. **Windows Work Time Agent**:
   - Lightweight, standalone background daemon running on Windows.
   - Monitors user input, display state, lock/unlock events, and system sleep/shutdown.
   - Records verified productive computer time into local SQLite (`agent/data/agent.db`).
   - Automatically synchronizes to the production backend (`/api/agent/sync`) using a dedicated machine-to-machine `AGENT_SYNC_TOKEN`.
   - Fully resilient: offline operation preserves all tracked sessions locally and retries safely with backoff.

3. **Global Work Time Analytics**:
   - Long-term verified work history compiled from the Windows Agent and Calendar.
   - Filterable across All Time, This Year, and Previous Year.
   - Historical monthly performance trends, streaks, and plan completion percentages.

4. **Parent Portal**:
   - Tokenized, secure, strictly read-only view accessible by parents via unique share link.
   - Immediate access without accounts, passwords, or login prompts.
   - Displays monthly schedule, planned requirements, and live verified hours.
   - Links can be created, labeled, and instantly revoked from Admin Settings.

---

## 2. Architecture

```text
[ Windows Work Time Agent ]
        │  (Monitors local OS user input & display state)
        ▼
   agent.db (Local SQLite)
        │
        │  POST /api/agent/sync
        │  (Authorization: Bearer <AGENT_SYNC_TOKEN>)
        ▼
[ Next.js API Routes ] ───► [ PostgreSQL / Neon ]
        ▲                         │
        │                         ├─► work_time_daily (Authoritative work history)
        ├─► /api/calendar         ├─► calendar_overrides (Custom day status & topics)
        ├─► /api/analytics        ├─► parent_portal_tokens (SHA-256 hashed share links)
        └─► /api/parent/[token]   └─► settings
        ▲
        │
[ Web Frontend ]
   ├─► / (Monthly Calendar Planner)
   ├─► /analytics (Global Work Time Analytics)
   ├─► /settings (Tokens, Export, Backups)
   └─► /parent/[token] (Read-Only Parent Portal)
```

---

## 3. Tech Stack

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Language**: TypeScript 5
- **Styling**: TailwindCSS 4 + Vanilla CSS Design System
- **Database**: PostgreSQL (Neon in production) via `pg` driver; local SQLite fallback via `better-sqlite3`
- **Agent**: Node.js Windows Background Service (`agent/src/index.ts`)
- **Icons**: `lucide-react`
- **Date calculations**: `date-fns` (strictly Asia/Kolkata timezone)

---

## 4. Environment Variables

Create a `.env` file in the workspace root:

```env
# Required for Web Application
AUTH_SECRET=your_32_character_random_hex_secret
AUTH_PASSWORD=your_admin_login_password
DATABASE_URL=postgresql://user:password@ep-host.neon.tech/neondb?sslmode=require

# Required for Machine-to-Machine Agent Sync
AGENT_SYNC_TOKEN=your_64_character_hex_agent_sync_token

# Windows Agent Configuration (for local agent running on Windows)
CYBER_TRACKER_API_URL=https://your-production-app.vercel.app
# CYBER_AGENT_IDLE_MINUTES=5
# CYBER_AGENT_SYNC_INTERVAL_SECONDS=15

# Optional Cron Secret for production backup endpoint
# CRON_SECRET=your_production_cron_secret
```

---

## 5. Development & Running Locally

### Install Dependencies
```bash
npm install
```

### Run Web Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### Run Windows Agent (Development Mode)
```bash
npm run agent:dev
```

### Install Windows Agent as a Scheduled Task (Production)
Run PowerShell as Administrator:
```powershell
npm run agent:install
```
Check agent status:
```powershell
npm run agent:check
```

---

## 6. Testing & Verification

```bash
# Run Monthly Calendar Planner & Parent Portal verification tests
npm run test:calendar

# Run Windows Agent state machine & synchronization durability tests
npm run agent:test

# Verify production Next.js compilation
npm run build
```

---

## 7. Security Invariants

- **Parent Portal is strictly read-only**: Rejects all write methods (`POST`, `PUT`, `DELETE`, `PATCH`) with HTTP 405. Raw tokens are never stored in the database; only SHA-256 hashes are persisted.
- **Agent Sync Authentication**: Machine-to-machine endpoint `/api/agent/sync` requires the dedicated `AGENT_SYNC_TOKEN`. Standard web session auth is enforced on all internal dashboard routes.
- **Work-Time Immutability**: Active work time is measured exclusively by the Windows Agent and upserted monotonically—it cannot be artificially decreased or manually forged.
