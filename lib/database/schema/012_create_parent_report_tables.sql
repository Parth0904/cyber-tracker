CREATE TABLE IF NOT EXISTS parent_report_config (
  id INTEGER PRIMARY KEY CHECK(id=1),
  enabled INTEGER DEFAULT 0,
  parent_name TEXT DEFAULT '',
  delivery_method TEXT DEFAULT 'Email',
  delivery_time TEXT DEFAULT '20:00',
  time_zone TEXT DEFAULT 'UTC',
  email_address TEXT DEFAULT '',
  telegram_chat_id TEXT DEFAULT ''
);

INSERT INTO parent_report_config (id, enabled, parent_name, delivery_method, delivery_time, time_zone, email_address, telegram_chat_id)
VALUES (1, 0, '', 'Email', '20:00', 'UTC', '', '')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS parent_report_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  sent_at TEXT,
  status TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  last_attempt_at TEXT,
  error_message TEXT,
  UNIQUE(year, week_number)
);
