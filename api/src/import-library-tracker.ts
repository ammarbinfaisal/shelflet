import { createRequire } from "module";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { db } from "./db/index.js";
import { books } from "./db/schema.js";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const __dirname = dirname(fileURLToPath(import.meta.url));
const xlsxPath = process.env.IMPORT_XLSX
  ? resolve(process.env.IMPORT_XLSX)
  : resolve(__dirname, "../library_tracker.xlsx");

// Normalize misspellings and transliteration dupes found in the source data.
// Collapses variants so the same scholar resolves to one canonical spelling.
function fixTypos(name: string): string {
  if (!name) return name;
  return name
    .replace(/\bIb(?:ne|in)\b/gi, "ibn")
    .replace(/\bbin\b/gi, "ibn")
    .replace(/\bSh(?:yakh|ykh)\b/gi, "Shaykh")
    .replace(/\bbadiuddin\b/g, "Badiuddin")
    .replace(/\bUthaimeen\b/g, "Uthaymeen");
}

interface Row {
  Title?: string;
  Author?: string;
  Translator?: string;
  "Explanation of"?: string;
  Language?: string;
  "Total Copies"?: number | string;
  "Available Copies"?: number | string;
  Category?: string;
}

function toInt(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function main() {
  const wb = XLSX.readFile(xlsxPath);
  const sheet = wb.Sheets["Book Inventory"];
  if (!sheet) throw new Error("Book Inventory sheet not found in " + xlsxPath);

  const rows: Row[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  let inserted = 0;
  let skipped = 0;

  for (const r of rows) {
    const title = String(r.Title || "").trim();
    if (!title) { skipped++; continue; }

    const total = toInt(r["Total Copies"], 1);
    const available = Math.min(total, toInt(r["Available Copies"], total));

    db.insert(books).values({
      title,
      author: fixTypos(String(r.Author || "").trim()),
      translator: fixTypos(String(r.Translator || "").trim()),
      explanation: fixTypos(String(r["Explanation of"] || "").trim()),
      language: String(r.Language || "English").trim() || "English",
      category: String(r.Category || "").trim(),
      totalCopies: total,
      availableCopies: available,
    }).run();
    inserted++;
  }

  console.log(`Imported ${inserted} books from ${xlsxPath} (skipped ${skipped})`);
}

main();
