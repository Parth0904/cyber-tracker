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

  db.exec(sql);

}

db.close();