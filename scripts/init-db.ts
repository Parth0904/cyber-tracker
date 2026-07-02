import db from "../lib/db";

db.exec(`
CREATE TABLE IF NOT EXISTS daily_entries (
    date TEXT PRIMARY KEY,

    sleep_hours REAL,

    bed_time TEXT,

    reading INTEGER DEFAULT 0,

    focus_feeling TEXT CHECK (
        focus_feeling IN (
            'Distracted',
            'Focused',
            'Deep',
            'Flow State'
        )
    ),

    workout INTEGER DEFAULT 0 CHECK(workout IN (0,1)),

    steps INTEGER DEFAULT 0,

    notes TEXT
);

CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    date TEXT NOT NULL,

    type TEXT NOT NULL CHECK(
        type IN (
            'learning',
            'bug_report',
            'recon',
            'target',
            'finding'
        )
    ),

    count INTEGER NOT NULL DEFAULT 1,

    UNIQUE(date, type)
);
`);

console.log("Database initialized");