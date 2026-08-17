import Database from "better-sqlite3";

async function main() {
  try {
    const db = new Database("tracker.db");
    console.log("=== SQLITE PARENT REPORT CONFIG ===");
    const config = db.prepare("SELECT * FROM parent_report_config;").all();
    console.log(config);

    console.log("\n=== SQLITE PARENT REPORT LOGS ===");
    const logs = db.prepare("SELECT * FROM parent_report_log;").all();
    console.log(logs);

    console.log("\n=== SQLITE DAILY ENTRIES COUNT ===");
    const count = db.prepare("SELECT COUNT(*) as cnt FROM daily_entries;").get();
    console.log(count);
    
    db.close();
  } catch (err) {
    console.error("SQLite error:", err);
  }
}

main();
