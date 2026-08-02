import Database from "better-sqlite3";
import { runMigrations } from "./database/migrator";

const db = new Database("tracker.db");
runMigrations(db);

export default db;