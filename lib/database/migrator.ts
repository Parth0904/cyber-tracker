import fs from "fs";
import path from "path";

export function runMigrations(db: any) {
  try {
    const schemaDir = path.join(process.cwd(), "lib/database/schema");
    if (!fs.existsSync(schemaDir)) {
      console.warn("Schema directory not found at:", schemaDir);
      return;
    }

    const files = fs.readdirSync(schemaDir).sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(schemaDir, file), "utf8");
      try {
        db.exec(sql);
      } catch (err: any) {
        if (
          err.message.includes("duplicate column name") ||
          err.message.includes("already exists")
        ) {
          // Safe to ignore duplicate column/table errors
        } else {
          console.error(`Error executing migration ${file}:`, err);
        }
      }
    }
  } catch (err) {
    console.error("Failed to run migrations:", err);
  }
}
