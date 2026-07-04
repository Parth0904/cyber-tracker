CREATE TABLE IF NOT EXISTS targets (

id INTEGER PRIMARY KEY AUTOINCREMENT,

name TEXT NOT NULL,

platform TEXT NOT NULL,

url TEXT,

status TEXT NOT NULL,

priority TEXT NOT NULL,

started_at TEXT NOT NULL,

last_activity TEXT,

notes TEXT,

category TEXT,

scope_url TEXT,

program_url TEXT,

created_by TEXT,

archived INTEGER DEFAULT 0

);