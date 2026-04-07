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

// Add hidden column if it doesn't exist
try {
  sqlite.exec(`ALTER TABLE books ADD COLUMN hidden INTEGER DEFAULT 0`);
} catch {
  // Column already exists
}

export const db = drizzle(sqlite, { schema });
