import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

const db = new Database("tracker.db");

const schemaDir = path.join(
  process.cwd(),
  "lib/database/schema"
);

const files = fs
  .readdirSync(schemaDir)
  .sort();

for (const file of files) {

  const sql = fs.readFileSync(
    path.join(schemaDir, file),
    "utf8"
  );

  try {
    db.exec(sql);
  } catch (err: any) {
    if (err.message.includes("duplicate column name") || err.message.includes("already exists")) {
      console.log(`Migration ${file} skipped: column or table already exists.`);
    } else {
      throw err;
    }
  }

}

db.close();