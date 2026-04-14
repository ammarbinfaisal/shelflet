import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

const dbPath = process.env.DB_PATH || "/data/shelflet.db";
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

// Auto-create lending_logs table if it doesn't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS lending_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    book_title TEXT NOT NULL,
    borrower TEXT NOT NULL,
    action TEXT NOT NULL,
    note TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

// Auto-create authors table if it doesn't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    short_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    bio TEXT DEFAULT ''
  )
`);

const runDDL = (sql: string) => sqlite.prepare(sql).run();

// Idempotent column adds — ADD COLUMN throws if the column already exists;
// we swallow per-column so applied migrations don't block later ones.
const columnMigrations: string[] = [
  "ALTER TABLE books ADD COLUMN hidden INTEGER DEFAULT 0",
  "ALTER TABLE books ADD COLUMN translator TEXT DEFAULT ''",
  "ALTER TABLE books ADD COLUMN total_copies INTEGER NOT NULL DEFAULT 1",
  "ALTER TABLE books ADD COLUMN available_copies INTEGER NOT NULL DEFAULT 1",
];
for (const ddl of columnMigrations) {
  try { runDDL(ddl); } catch { /* already exists */ }
}

runDDL(`
  CREATE TABLE IF NOT EXISTS active_lendings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    borrower TEXT NOT NULL,
    borrower_contact TEXT DEFAULT '',
    note TEXT DEFAULT '',
    lent_at TEXT DEFAULT (datetime('now'))
  )
`);

export const db = drizzle(sqlite, { schema });
