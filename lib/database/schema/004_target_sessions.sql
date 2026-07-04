CREATE TABLE IF NOT EXISTS target_sessions (

id INTEGER PRIMARY KEY AUTOINCREMENT,

target_id INTEGER NOT NULL,

type TEXT NOT NULL,

description TEXT,

started_at TEXT NOT NULL,

ended_at TEXT,

duration INTEGER DEFAULT 0,

FOREIGN KEY(target_id)
REFERENCES targets(id)

);