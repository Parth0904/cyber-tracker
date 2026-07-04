CREATE TABLE IF NOT EXISTS target_findings (

id INTEGER PRIMARY KEY AUTOINCREMENT,

target_id INTEGER NOT NULL,

title TEXT NOT NULL,

type TEXT,

severity TEXT NOT NULL,

status TEXT NOT NULL,

submitted_at TEXT NOT NULL,

reward REAL DEFAULT 0,

cve TEXT,

report_url TEXT,

notes TEXT,

FOREIGN KEY(target_id)
REFERENCES targets(id)

);