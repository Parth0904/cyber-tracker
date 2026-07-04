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