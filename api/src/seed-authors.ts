import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { authors, books } from "./db/schema.js";
import { eq } from "drizzle-orm";

const dbPath = process.env.DB_PATH || "/data/shelflet.db";
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

// Ensure table exists
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    short_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    bio TEXT DEFAULT ''
  )
`);

const db = drizzle(sqlite);

const authorData: { shortName: string; fullName: string }[] = [
  { shortName: "Ibn Abdul Wahhab", fullName: "Muhammad bin Abdul Wahhab" },
  { shortName: "Ibn al-Uthaymeen", fullName: "Muhammad bin Saalih al-Uthaymeen" },
  { shortName: "Ibn Baz", fullName: "Abdul Aziz bin Abdullah bin Baz" },
  { shortName: "Ibn al-Qayyim", fullName: "Ibn Qayyim al-Jawziyyah" },
  { shortName: "Ibn Taymiyyah", fullName: "Taqi ad-Din Ahmad ibn Taymiyyah" },
  { shortName: "Ibn Hajar", fullName: "Ibn Hajar al-Asqalani" },
  { shortName: "Ibn Qudamah", fullName: "Muwaffaq ad-Din Ibn Qudamah al-Maqdisi" },
  { shortName: "Ibn al-Jawzi", fullName: "Jamal ad-Din Abu al-Faraj ibn al-Jawzi" },
  { shortName: "Ibn Rajab", fullName: "Zayn ad-Din ibn Rajab al-Hanbali" },
  { shortName: "al-Albani", fullName: "Muhammad Nasiruddin al-Albani" },
  { shortName: "an-Nawawi", fullName: "Yahya ibn Sharaf an-Nawawi" },
  { shortName: "al-Barbahari", fullName: "Abu Muhammad al-Hasan al-Barbahari" },
  { shortName: "at-Tahawi", fullName: "Abu Ja'far Ahmad ibn Muhammad at-Tahawi" },
  { shortName: "al-Jazari", fullName: "Shams ad-Din Abu al-Khayr al-Jazari" },
  { shortName: "Ahmad ibn Hanbal", fullName: "Ahmad ibn Muhammad ibn Hanbal" },
  { shortName: "Ibn Uqlah", fullName: "Ibn Uqlah" },
  { shortName: "Ibn Badran", fullName: "Abdul Qadir ibn Ahmad ibn Badran" },
  { shortName: "Ibn Maalik", fullName: "Jamal ad-Din ibn Maalik" },
  { shortName: "Ibn al-Aajroom", fullName: "Abu Abdillah Muhammad ibn al-Aajroom" },
  { shortName: "Abu Iyaad", fullName: "Abu Iyaad Amjad Rafiq" },
  { shortName: "Safi-ur-Rahman Mubarakpuri", fullName: "Safi-ur-Rahman al-Mubarakpuri" },
  { shortName: "Siddeeq Hasan Khan", fullName: "Muhammad Siddeeq Hasan Khan" },
  { shortName: "Umar Quinn", fullName: "Umar Quinn" },
  { shortName: "Daniel Kahneman", fullName: "Daniel Kahneman" },
  { shortName: "Ilan Pappe", fullName: "Ilan Pappe" },
  { shortName: "Benedict Anderson", fullName: "Benedict Anderson" },
  { shortName: "Bipin Chandra", fullName: "Bipin Chandra" },
  { shortName: "Gretchen McCulloch", fullName: "Gretchen McCulloch" },
  { shortName: "Ranajit Guha", fullName: "Ranajit Guha" },
];

// Clear and re-seed
db.delete(authors).run();

for (const a of authorData) {
  db.insert(authors).values(a).run();
}

console.log(`Seeded ${authorData.length} authors.`);

// Fix inconsistent author names in books
const renames: Record<string, string> = {
  "MIAW": "Ibn Abdul Wahhab",
  "ibn al-Uthaymeen": "Ibn al-Uthaymeen",
  "ibn Rajab": "Ibn Rajab",
  "ibn Badran": "Ibn Badran",
  "ibn Maalik": "Ibn Maalik",
  "ibn al-Aajroom": "Ibn al-Aajroom",
  "Ahmad bn Hanbal": "Ahmad ibn Hanbal",
  "Safi-ur-rahman Mubarakpuri": "Safi-ur-Rahman Mubarakpuri",
  "at-Tahawi": "at-Tahawi",
  "Ranajit Guja": "Ranajit Guha",
  "Abdriged by Mohsin Khan": "Mohsin Khan",
};

for (const [from, to] of Object.entries(renames)) {
  if (from !== to) {
    db.update(books).set({ author: to }).where(eq(books.author, from)).run();
    console.log(`  Renamed author "${from}" -> "${to}"`);
  }
}

// Update explanation fields: person names → "Sharh of X"
const explanationUpdates: Record<string, string> = {
  "ibn al-Uthaymeen": "Sharh of Ibn al-Uthaymeen",
  "al-Fawzan": "Sharh of al-Fawzan",
  "ibn abil-Izz al-hanafi": "Sharh of Ibn Abil-Izz al-Hanafi",
  "Sulayman bn Abdullah bn MIAW": "Sharh of Sulayman bin Abdullah bin Ibn Abdul Wahhab",
  "ibn Aqeel": "Sharh of Ibn Aqeel",
  "lasheen abul-faraj": "Sharh of Lasheen Abul-Faraj",
};

for (const [from, to] of Object.entries(explanationUpdates)) {
  db.update(books).set({ explanation: to }).where(eq(books.explanation, from)).run();
  console.log(`  Explanation "${from}" -> "${to}"`);
}

console.log("Done.");
sqlite.close();
