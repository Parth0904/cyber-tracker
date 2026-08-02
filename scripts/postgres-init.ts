import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not defined in environment variables. Set it in .env file.");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false, // Required for Neon / Supabase serverless connections
  },
});

const schema = `
CREATE TABLE IF NOT EXISTS daily_entries (
  date VARCHAR(10) PRIMARY KEY,
  sleep_hours DOUBLE PRECISION,
  bed_time VARCHAR(10),
  wake_time VARCHAR(10),
  reading INTEGER DEFAULT 0,
  focus_feeling VARCHAR(50) CHECK (focus_feeling IN ('Distracted', 'Focused', 'Deep', 'Flow State')),
  workout INTEGER DEFAULT 0 CHECK (workout IN (0, 1)),
  steps INTEGER DEFAULT 0,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  date VARCHAR(10),
  type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS targets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  platform VARCHAR(255) NOT NULL,
  url TEXT,
  status VARCHAR(50) NOT NULL,
  priority VARCHAR(50) NOT NULL,
  started_at VARCHAR(50) NOT NULL,
  last_activity VARCHAR(50),
  notes TEXT,
  category VARCHAR(100),
  scope_url TEXT,
  program_url TEXT,
  created_by VARCHAR(255),
  archived INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS target_sessions (
  id SERIAL PRIMARY KEY,
  target_id INTEGER NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  started_at VARCHAR(50) NOT NULL,
  ended_at VARCHAR(50),
  duration INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS target_findings (
  id SERIAL PRIMARY KEY,
  target_id INTEGER NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  severity VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  submitted_at VARCHAR(50) NOT NULL,
  reward DOUBLE PRECISION DEFAULT 0,
  cve VARCHAR(50),
  report_url TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK(id=1),
  daily_learning_goal INTEGER DEFAULT 3,
  daily_recon_goal INTEGER DEFAULT 2,
  daily_target_goal INTEGER DEFAULT 1,
  daily_finding_goal INTEGER DEFAULT 1,
  daily_report_goal INTEGER DEFAULT 1,
  daily_reading_goal INTEGER DEFAULT 45,
  daily_sleep_goal INTEGER DEFAULT 8,
  daily_steps_goal INTEGER DEFAULT 8000
);

INSERT INTO settings (id, daily_learning_goal, daily_recon_goal, daily_target_goal, daily_finding_goal, daily_report_goal, daily_reading_goal, daily_sleep_goal, daily_steps_goal)
VALUES (1, 3, 2, 1, 1, 1, 45, 8, 8000)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS learning_topics (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  archived INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS learning_sessions (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER NOT NULL REFERENCES learning_topics(id) ON DELETE CASCADE,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  duration INTEGER DEFAULT 0,
  last_active_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS health_connect_config (
  id INTEGER PRIMARY KEY CHECK(id=1),
  status VARCHAR(50) DEFAULT 'Not Connected',
  simulated_workout INTEGER DEFAULT 0
);

INSERT INTO health_connect_config (id, status, simulated_workout)
VALUES (1, 'Not Connected', 0)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS weekly_reviews (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  start_date VARCHAR(10) NOT NULL,
  end_date VARCHAR(10) NOT NULL,
  report_json TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(year, week_number)
);

CREATE TABLE IF NOT EXISTS parent_report_config (
  id INTEGER PRIMARY KEY CHECK(id=1),
  enabled INTEGER DEFAULT 0,
  parent_name VARCHAR(255) DEFAULT '',
  delivery_method VARCHAR(50) DEFAULT 'Email',
  delivery_time VARCHAR(10) DEFAULT '20:00',
  time_zone VARCHAR(50) DEFAULT 'UTC',
  email_address VARCHAR(255) DEFAULT '',
  telegram_chat_id VARCHAR(255) DEFAULT ''
);

INSERT INTO parent_report_config (id, enabled, parent_name, delivery_method, delivery_time, time_zone, email_address, telegram_chat_id)
VALUES (1, 0, '', 'Email', '20:00', 'UTC', '', '')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS parent_report_log (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  sent_at VARCHAR(50),
  status VARCHAR(50) NOT NULL,
  attempts INTEGER DEFAULT 0,
  last_attempt_at VARCHAR(50),
  error_message TEXT,
  UNIQUE(year, week_number)
);
`;

async function main() {
  console.log("Initializing PostgreSQL Database schema...");
  try {
    await pool.query(schema);
    console.log("PostgreSQL Database schema initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize PostgreSQL Database schema:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
