import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { books } from "./db/schema.js";
import { createRequire } from "module";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || "/data/shelflet.db";
const xlsxPath = resolve(__dirname, "../books.xlsx");

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
const db = drizzle(sqlite);

const runDDL = (sql: string) => sqlite.prepare(sql).run();

runDDL(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT '',
    translator TEXT DEFAULT '',
    explanation TEXT DEFAULT '',
    language TEXT DEFAULT 'English',
    category TEXT DEFAULT '',
    isbn TEXT DEFAULT '',
    published TEXT DEFAULT '',
    lent_to TEXT DEFAULT '',
    total_copies INTEGER NOT NULL DEFAULT 1,
    available_copies INTEGER NOT NULL DEFAULT 1,
    hidden INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

runDDL(`
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

const workbook = XLSX.readFile(xlsxPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows: any[] = XLSX.utils.sheet_to_json(sheet);

console.log(`Seeding ${rows.length} books from books.xlsx...`);

for (const row of rows) {
  db.insert(books).values({
    title: row["Tiile"] || "",
    author: row["Author"] || "",
    explanation: row["Explanation of"] || "",
    language: row["Language"] || "English",
    category: row["Category"] || "",
    lentTo: row["Lent to"] || "",
  }).run();
}

console.log(`Seeded ${rows.length} books.`);
sqlite.close();
