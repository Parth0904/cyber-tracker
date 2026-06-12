import db from "../lib/db";

db.exec(`
CREATE TABLE IF NOT EXISTS daily_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE,
    sleep_hours REAL,
    wake_time TEXT,
    workout INTEGER,
    reading_minutes INTEGER,
    screen_time REAL,
    energy INTEGER,
    performance TEXT,
    deep_work TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    type TEXT,
    value INTEGER DEFAULT 1
);
`);

console.log("Database initialized");