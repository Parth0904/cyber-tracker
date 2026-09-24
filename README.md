# Cyber Tracker v1.0 — Production Operations Guide

Cyber Tracker is a personal operational intelligence system designed for security engineers, bug bounty hunters, and researchers. It enables tracking target research sessions, learning topics, submitted findings, daily habits, and core habit consistency using completely objective telemetry and correlation diagnostics.

---

## 1. Project Overview

Cyber Tracker acts as a personal performance analyst. Rather than a motivational tracking tool, it uses mathematical correlations (e.g. reading habits vs session duration) to outline optimal working patterns and output actionable target rotation recommendations.

---

## 2. System Architecture

```mermaid
graph TD
    UI[Next.js 16 Dashboard UI] -->|HTTP Request| API[Next.js API Route Handlers]
    API -->|Session Wrapper Auth| Auth[NextAuth.js Proxy]
    API -->|Query Abstraction| DB[better-sqlite3 / pg Pool]
    DB -->|Relational Data| Repositories[Repository Abstractions]
    Repositories -->|Telemetry Averages| StatsService[Statistics Service Layer]
    StatsService -->|Joint Probability Analysis| TelemetryEngine[Correlation Telemetry Engine]
    TelemetryEngine -->|Structured Executive Review| ReviewGenerator[Weekly Review Generator]
    ReviewGenerator -->|Send Automated Digest| ParentScheduler[Parent Report Scheduler]
    ParentScheduler -->|Dispatch Providers| Providers[Email / Telegram Provider]
```

---

## 3. Tech Stack & Dependencies

- **Core**: Next.js 16 (App Router + Turbopack)
- **Styling**: TailwindCSS 4 (Utility Runway styling)
- **Database**: Dual-driver abstraction (SQLite for local development, PostgreSQL for cloud staging/production)
- **Authentication**: Auth.js (NextAuth) proxy handler
- **Date calculations**: `date-fns` (ISO weeks and calendars mapping)
- **Icons**: `lucide-react` (Monochrome dashboard telemetry icons)

---

## 4. Folder Structure

```
├── app/                       # Next.js App Router root
│   ├── api/                   # Server API route endpoints
│   │   ├── auth/              # Auth.js NextAuth proxy handlers
│   │   ├── reviews/           # Weekly reviews & cron controllers
│   │   └── settings/          # Config backup, export, and parent reports
│   ├── reviews/               # Executive review timeline & report cards
│   ├── settings/              # Settings panel & parent configurations
│   └── (dashboard paths)      # Console, Targets, Learning, Sessions, History
├── components/                # Reusable React UI component nodes
│   ├── dashboard/             # Console telemetry & habits forms
│   └── ui/                    # Base panel, badge, and empty state boxes
├── lib/                       # Business logic and database layers
│   ├── database/              # DB connection, migrations, query routers
│   ├── repositories/          # SQL queries abstractions
│   └── services/              # Core stats, correlations, parent scheduler
├── public/                    # Manifest, PWA service workers, static assets
├── scripts/                   # Database schemas and Postgres setup scripts
├── tsconfig.json              # TypeScript compilation setup
└── eslint.config.mjs          # Production ESLint overrides config
```

---

## 5. Setup & Development

### Prerequisite Environment Variables
Create a `.env` file in the workspace root:
```env
NEXTAUTH_SECRET=a_secure_random_string_of_at_least_32_characters
NEXTAUTH_URL=http://localhost:3000
# Database defaults: If DATABASE_URL is left empty, SQLite is automatically selected.
# DATABASE_URL=postgresql://user:password@localhost:5432/cyber_tracker

# Parent Report SMTP Configuration (Required for automated Email Digests)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_smtp_username@gmail.com
SMTP_PASS=your_smtp_app_password
PARENT_EMAIL=recipient_parent_email@example.com
```

### Installation
```bash
npm install
```

### Development Server Run
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the console.

---

## 6. Production Deployment

### Building & Compilation
Compile assets and verify TypeScript type safety:
```bash
npm run build
```

### Vercel Deployment Settings
1. Bind environment variables (`NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL` for PostgreSQL).
2. Configure **Cron Jobs** (`vercel.json` scheduler) to trigger weekly review compilation and parent report dispatches every Sunday:
   - Target cron endpoint for reviews compilation: `/api/reviews` (POST)
   - Target cron endpoint for parent weekly digests: `/api/reviews/parent-report-cron` (POST)

---

## 7. Database Driver & Migrations

Cyber Tracker employs a dynamic database router:
- **SQLite Configuration**: Runs synchronously using `better-sqlite3` on a local file database (`cyber-tracker.db`). Migrations are automatically loaded by scanning files in `lib/database/schema/*.sql`.
- **Postgres Configuration**: Triggered when `DATABASE_URL` is set in production. Runs queries asynchronously via `pg` connection pool. Initialize remote Postgres schemas using:
  ```bash
  npx ts-node scripts/postgres-init.ts
  ```

---

## 8. Authentication & Authorization

Authentication is managed via NextAuth proxy handlers:
- **Development mode**: Middleware checks are mapped in [proxy.ts](file:///c:/Users/parth/Desktop/Parth/Web%20development/cyber-tracker/proxy.ts) using the Next.js 16 route proxy specifications.
- **Access control**: Session validation prevents unauthenticated requests from fetching api metrics or viewing settings panels.

---

## 9. Future Roadmap

- **WhatsApp Business Provider**: Add a WhatsApp notification provider implementing the `NotificationProvider` interface.
- **OAuth Login Integrations**: Add Google, GitHub, or Okta SSO logins in `lib/auth.ts`.
- **Telemetry Charts extension**: Introduce custom timeframes (e.g. 90-day rolling averages) in Analytics grids.
