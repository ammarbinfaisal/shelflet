import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db/index.js";
import { books, lendingLogs, authors, activeLendings } from "./db/schema.js";
import { eq, desc, and } from "drizzle-orm";
import { config } from "./config.js";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Load local Islamic books database for ISBN/title lookup
const __dirname = dirname(fileURLToPath(import.meta.url));
const localBooksPath = join(__dirname, "..", "islamic_books_deduped.jsonl");

interface LocalBook {
  title: string;
  vendor: string;
  sku: string;
  price: string;
  handle: string;
  tags: string[];
  source: string;
}

let localBooks: LocalBook[] = [];
let localBooksByISBN: Map<string, LocalBook> = new Map();

function loadLocalBooks() {
  if (!existsSync(localBooksPath)) {
    console.log("No local books database found at", localBooksPath);
    return;
  }
  try {
    const content = readFileSync(localBooksPath, "utf-8");
    localBooks = content.trim().split("\n").map(line => JSON.parse(line));
    // Index by ISBN
    for (const book of localBooks) {
      if (book.sku && /^97[89]\d{10}$/.test(book.sku)) {
        localBooksByISBN.set(book.sku, book);
      }
    }
    console.log(`Loaded ${localBooks.length} local books (${localBooksByISBN.size} with ISBN)`);
  } catch (err) {
    console.error("Failed to load local books:", err);
  }
}

loadLocalBooks();

const app = new Hono();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";
const PUBLIC_PASSWORD = process.env.PUBLIC_PASSWORD || "";
// Derive JWT secret from the password - changing password invalidates all tokens
const JWT_SECRET = new TextEncoder().encode(
  PUBLIC_PASSWORD ? `shelflet-jwt-${PUBLIC_PASSWORD}` : "shelflet-no-auth"
);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[''ʿ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function bookSlug(b: { title: string; author: string; category: string | null; explanation: string | null; language: string | null }): string {
  const parts = [
    slugify(b.title),
    slugify(b.author || "unknown"),
    slugify((b.category || "").split(",")[0].trim() || "uncategorized"),
    slugify((b.explanation || "").slice(0, 40) || "none"),
    slugify(b.language || "unknown"),
  ];
  return parts.join("--");
}

const allowedOrigins = (process.env.CORS_ORIGIN || "https://books.ammarfaisal.me")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use("/*", cors({
  origin: (origin) => (allowedOrigins.includes(origin) ? origin : null),
  credentials: true,
}));

// Verify public JWT token
async function verifyPublicToken(c: any): Promise<boolean> {
  if (!PUBLIC_PASSWORD) return true; // No password required

  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Check if public password is required
app.get("/api/auth/status", (c) => {
  return c.json({ requiresAuth: !!PUBLIC_PASSWORD });
});

// Public login - returns JWT
app.post("/api/public-login", async (c) => {
  if (!PUBLIC_PASSWORD) {
    return c.json({ error: "Public auth not configured" }, 400);
  }

  const { password } = await c.req.json();
  if (password !== PUBLIC_PASSWORD) {
    return c.json({ error: "Wrong password" }, 401);
  }

  const token = await new SignJWT({ type: "public" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  return c.json({ success: true, token });
});

// List books (public — excludes hidden), enriched with author info
app.get("/api/books", async (c) => {
  // Check public auth if PUBLIC_PASSWORD is set
  if (PUBLIC_PASSWORD && !await verifyPublicToken(c) && !isAuthed(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const showAll = c.req.query("all") === "1" && isAuthed(c);
  const allBooks = showAll
    ? db.select().from(books).all()
    : db.select().from(books).where(eq(books.hidden, 0)).all();
  const allAuthors = db.select().from(authors).all();
  const authorMap = new Map(allAuthors.map((a) => [a.shortName, a]));

  const enriched = allBooks.map((b) => {
    const authorInfo = authorMap.get(b.author);
    return {
      ...b,
      slug: bookSlug(b),
      authorFullName: authorInfo?.fullName || b.author,
      authorShortName: authorInfo?.shortName || b.author,
    };
  });

  return c.json({ books: enriched, count: enriched.length });
});

// Get single book by slug
app.get("/api/books/by-slug/:slug", async (c) => {
  if (PUBLIC_PASSWORD && !await verifyPublicToken(c) && !isAuthed(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const slug = c.req.param("slug");
  const allBooks = db.select().from(books).all();
  const allAuthors = db.select().from(authors).all();
  const authorMap = new Map(allAuthors.map((a) => [a.shortName, a]));

  const book = allBooks.find((b) => bookSlug(b) === slug);
  if (!book) return c.json({ error: "Book not found" }, 404);

  const authorInfo = authorMap.get(book.author);
  return c.json({
    book: {
      ...book,
      slug: bookSlug(book),
      authorFullName: authorInfo?.fullName || book.author,
      authorShortName: authorInfo?.shortName || book.author,
    },
  });
});

// List categories
app.get("/api/categories", async (c) => {
  if (PUBLIC_PASSWORD && !await verifyPublicToken(c) && !isAuthed(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const allBooks = db.select().from(books).where(eq(books.hidden, 0)).all();
  const catMap = new Map<string, number>();
  for (const b of allBooks) {
    for (const cat of (b.category || "").split(",").map((s) => s.trim()).filter(Boolean)) {
      catMap.set(cat, (catMap.get(cat) || 0) + 1);
    }
  }
  const categories = [...catMap.entries()]
    .map(([name, count]) => ({ name, slug: slugify(name), count }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return c.json({ categories });
});

// Get books by category
app.get("/api/categories/:slug", async (c) => {
  if (PUBLIC_PASSWORD && !await verifyPublicToken(c) && !isAuthed(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const slug = c.req.param("slug");
  const allBooks = db.select().from(books).where(eq(books.hidden, 0)).all();
  const allAuthors = db.select().from(authors).all();
  const authorMap = new Map(allAuthors.map((a) => [a.shortName, a]));

  // Find the category name matching this slug
  const allCats = new Set<string>();
  for (const b of allBooks) {
    for (const cat of (b.category || "").split(",").map((s) => s.trim()).filter(Boolean)) {
      allCats.add(cat);
    }
  }
  const categoryName = [...allCats].find((c) => slugify(c) === slug);
  if (!categoryName) return c.json({ error: "Category not found" }, 404);

  const catBooks = allBooks
    .filter((b) => (b.category || "").split(",").map((s) => s.trim()).includes(categoryName))
    .map((b) => {
      const authorInfo = authorMap.get(b.author);
      return {
        ...b,
        slug: bookSlug(b),
        authorFullName: authorInfo?.fullName || b.author,
        authorShortName: authorInfo?.shortName || b.author,
      };
    });

  return c.json({ category: categoryName, books: catBooks });
});

// List languages
app.get("/api/languages", async (c) => {
  if (PUBLIC_PASSWORD && !await verifyPublicToken(c) && !isAuthed(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const allBooks = db.select().from(books).where(eq(books.hidden, 0)).all();
  const langMap = new Map<string, number>();
  for (const b of allBooks) {
    for (const lang of (b.language || "").split(",").map((s) => s.trim()).filter(Boolean)) {
      langMap.set(lang, (langMap.get(lang) || 0) + 1);
    }
  }
  const languages = [...langMap.entries()]
    .map(([name, count]) => ({ name, slug: slugify(name), count }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return c.json({ languages });
});

// Get books by language
app.get("/api/languages/:slug", async (c) => {
  if (PUBLIC_PASSWORD && !await verifyPublicToken(c) && !isAuthed(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const slug = c.req.param("slug");
  const allBooks = db.select().from(books).where(eq(books.hidden, 0)).all();
  const allAuthors = db.select().from(authors).all();
  const authorMap = new Map(allAuthors.map((a) => [a.shortName, a]));

  const allLangs = new Set<string>();
  for (const b of allBooks) {
    for (const lang of (b.language || "").split(",").map((s) => s.trim()).filter(Boolean)) {
      allLangs.add(lang);
    }
  }
  const languageName = [...allLangs].find((l) => slugify(l) === slug);
  if (!languageName) return c.json({ error: "Language not found" }, 404);

  const langBooks = allBooks
    .filter((b) => (b.language || "").split(",").map((s) => s.trim()).includes(languageName))
    .map((b) => {
      const authorInfo = authorMap.get(b.author);
      return {
        ...b,
        slug: bookSlug(b),
        authorFullName: authorInfo?.fullName || b.author,
        authorShortName: authorInfo?.shortName || b.author,
      };
    });

  return c.json({ language: languageName, books: langBooks });
});

// List all authors — unions the authors side-table with distinct author
// strings that only exist on books, so sites that skip the authors seed
// still get a full list.
app.get("/api/authors", async (c) => {
  if (PUBLIC_PASSWORD && !await verifyPublicToken(c) && !isAuthed(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const allAuthors = db.select().from(authors).all();
  const bySlug = new Map(allAuthors.map((a) => [a.shortName, a]));
  const bookAuthorNames = db
    .select({ name: books.author })
    .from(books)
    .where(eq(books.hidden, 0))
    .all();
  for (const { name } of bookAuthorNames) {
    if (!name || bySlug.has(name)) continue;
    bySlug.set(name, { id: 0, shortName: name, fullName: name, bio: "" });
  }
  return c.json({ authors: [...bySlug.values()] });
});

// Get single author by short name (URL slug). Falls back to the books table
// when the authors side-table has no explicit row — sites that skip the
// authors seed still get a working author page.
app.get("/api/authors/:slug", async (c) => {
  if (PUBLIC_PASSWORD && !await verifyPublicToken(c) && !isAuthed(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const slug = decodeURIComponent(c.req.param("slug"));
  const authorRow = db.select().from(authors).where(eq(authors.shortName, slug)).get();
  const authorBooks = db.select().from(books)
    .where(eq(books.author, slug))
    .all()
    .filter((b) => !b.hidden)
    .map((b) => ({ ...b, slug: bookSlug(b) }));

  if (!authorRow && authorBooks.length === 0) {
    return c.json({ error: "Author not found" }, 404);
  }

  const author = authorRow || { id: 0, shortName: slug, fullName: slug, bio: "" };
  return c.json({ author, books: authorBooks });
});

// Login
app.post("/api/login", async (c) => {
  const { password } = await c.req.json();
  if (password !== ADMIN_PASSWORD) {
    return c.json({ error: "Wrong password" }, 401);
  }
  setCookie(c, "admin_session", password, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return c.json({ success: true });
});

// Logout
app.post("/api/logout", (c) => {
  deleteCookie(c, "admin_session");
  return c.json({ success: true });
});

// Auth check middleware
function isAuthed(c: any): boolean {
  return getCookie(c, "admin_session") === ADMIN_PASSWORD;
}

// Mutate books (add, delete, lend, return)
app.post("/api/books/mutate", async (c) => {
  if (!isAuthed(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json();
  const { action, ...data } = body;

  const copiesOn = config.features.copies;
  const translatorOn = config.features.translator;

  function bookInsertValues(b: any) {
    const total = copiesOn ? Math.max(1, parseInt(b.totalCopies ?? 1) || 1) : 1;
    return {
      title: b.title,
      author: b.author || "",
      translator: translatorOn ? (b.translator || "") : "",
      explanation: b.explanation || "",
      language: b.language || "English",
      category: b.category || "",
      totalCopies: total,
      availableCopies: total,
    };
  }

  switch (action) {
    case "add": {
      db.insert(books).values(bookInsertValues(data)).run();
      return c.json({ success: true });
    }
    case "edit": {
      if (!data.id) return c.json({ error: "id required" }, 400);
      const existing = db.select().from(books).where(eq(books.id, data.id)).get();
      if (!existing) return c.json({ error: "Book not found" }, 404);

      const updates: any = {
        title: data.title,
        author: data.author,
        explanation: data.explanation ?? "",
        language: data.language ?? "English",
        category: data.category ?? "",
      };
      if (translatorOn) updates.translator = data.translator ?? "";
      if (copiesOn && data.totalCopies != null) {
        const newTotal = Math.max(1, parseInt(data.totalCopies) || 1);
        const delta = newTotal - existing.totalCopies;
        updates.totalCopies = newTotal;
        updates.availableCopies = Math.max(0, existing.availableCopies + delta);
      }
      db.update(books).set(updates).where(eq(books.id, data.id)).run();
      return c.json({ success: true });
    }
    case "delete": {
      if (!data.id) return c.json({ error: "id required" }, 400);
      db.delete(activeLendings).where(eq(activeLendings.bookId, data.id)).run();
      db.delete(books).where(eq(books.id, data.id)).run();
      return c.json({ success: true });
    }
    case "lend": {
      if (!data.id || !data.lentTo)
        return c.json({ error: "id and lentTo required" }, 400);
      const book = db.select().from(books).where(eq(books.id, data.id)).get();
      if (!book) return c.json({ error: "Book not found" }, 404);

      if (copiesOn) {
        if (book.availableCopies <= 0) {
          return c.json({ error: "No copies available" }, 409);
        }
        db.update(books)
          .set({ availableCopies: book.availableCopies - 1 })
          .where(eq(books.id, data.id))
          .run();
        db.insert(activeLendings).values({
          bookId: data.id,
          borrower: data.lentTo,
          borrowerContact: data.borrowerContact || "",
          note: data.note || "",
        }).run();
      } else {
        db.update(books).set({ lentTo: data.lentTo }).where(eq(books.id, data.id)).run();
      }

      db.insert(lendingLogs).values({
        bookId: data.id,
        bookTitle: book.title,
        borrower: data.lentTo,
        action: "lend",
        note: data.note || "",
      }).run();
      return c.json({ success: true });
    }
    case "return": {
      if (!data.id) return c.json({ error: "id required" }, 400);
      const book = db.select().from(books).where(eq(books.id, data.id)).get();
      if (!book) return c.json({ error: "Book not found" }, 404);

      let borrowerName = book.lentTo || "unknown";

      if (copiesOn) {
        // activeLendingId picks the exact copy; otherwise fall back to oldest
        // active row for that book (matches the most common "mark returned" flow).
        let lending;
        if (data.activeLendingId) {
          lending = db.select().from(activeLendings)
            .where(and(
              eq(activeLendings.id, data.activeLendingId),
              eq(activeLendings.bookId, data.id),
            )).get();
        } else {
          lending = db.select().from(activeLendings)
            .where(eq(activeLendings.bookId, data.id))
            .get();
        }
        if (!lending) return c.json({ error: "No active lending found" }, 404);
        borrowerName = lending.borrower;
        db.delete(activeLendings).where(eq(activeLendings.id, lending.id)).run();
        db.update(books)
          .set({ availableCopies: Math.min(book.totalCopies, book.availableCopies + 1) })
          .where(eq(books.id, data.id))
          .run();
      } else {
        db.update(books).set({ lentTo: "" }).where(eq(books.id, data.id)).run();
      }

      db.insert(lendingLogs).values({
        bookId: data.id,
        bookTitle: book.title,
        borrower: borrowerName,
        action: "return",
        note: data.note || "",
      }).run();
      return c.json({ success: true });
    }
    case "hide": {
      if (!data.id) return c.json({ error: "id required" }, 400);
      db.update(books).set({ hidden: 1 }).where(eq(books.id, data.id)).run();
      return c.json({ success: true });
    }
    case "unhide": {
      if (!data.id) return c.json({ error: "id required" }, 400);
      db.update(books).set({ hidden: 0 }).where(eq(books.id, data.id)).run();
      return c.json({ success: true });
    }
    case "bulk-add": {
      if (!Array.isArray(data.books)) return c.json({ error: "books array required" }, 400);
      let added = 0;
      for (const book of data.books) {
        if (!book.title) continue;
        db.insert(books).values(bookInsertValues(book)).run();
        added++;
      }
      return c.json({ success: true, added });
    }
    default:
      return c.json({ error: "Unknown action" }, 400);
  }
});

// Map language codes to full names
const langMap: Record<string, string> = {
  en: "English",
  ar: "Arabic",
  ur: "Urdu",
  fr: "French",
  de: "German",
  es: "Spanish",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  hi: "Hindi",
  bn: "Bengali",
  tr: "Turkish",
  fa: "Persian",
  nl: "Dutch",
  pl: "Polish",
  sv: "Swedish",
  id: "Indonesian",
  ms: "Malay",
};

// Try Google Books API
async function lookupGoogleBooks(isbn: string) {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY || "";
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1&printType=books${apiKey ? `&key=${apiKey}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.items || data.items.length === 0) return null;

  const info = data.items[0].volumeInfo || {};
  return {
    isbn,
    title: info.title || "",
    author: (info.authors || []).join(", "),
    publishers: info.publisher ? [info.publisher] : [],
    publishDate: info.publishedDate || "",
    subjects: info.categories || [],
    numberOfPages: info.pageCount || null,
    description: info.description || "",
    language: langMap[info.language] || info.language || "",
    source: "google",
  };
}

// Try Open Library API
async function lookupOpenLibrary(isbn: string) {
  const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
  if (!res.ok) return null;
  const data = await res.json();

  // Fetch author names if we have author references
  let authorName = "";
  if (data.authors?.length > 0) {
    const authorKey = data.authors[0].key;
    const authorRes = await fetch(`https://openlibrary.org${authorKey}.json`);
    if (authorRes.ok) {
      const authorData = await authorRes.json();
      authorName = authorData.name || "";
    }
  }

  return {
    isbn,
    title: data.title || "",
    author: authorName,
    publishers: data.publishers || [],
    publishDate: data.publish_date || "",
    subjects: data.subjects?.map((s: string | { name: string }) =>
      typeof s === "string" ? s : s.name
    ) || [],
    numberOfPages: data.number_of_pages || null,
    description: typeof data.description === "string"
      ? data.description
      : data.description?.value || "",
    language: "",
    source: "openlibrary",
  };
}

// ISBN lookup - tries local DB first, then Google Books, then Open Library
app.get("/api/isbn/:isbn", async (c) => {
  const isbn = c.req.param("isbn").replace(/[^0-9X]/gi, "");
  if (!isbn || (isbn.length !== 10 && isbn.length !== 13)) {
    return c.json({ error: "Invalid ISBN" }, 400);
  }

  try {
    // Try local database first (fastest)
    const localBook = localBooksByISBN.get(isbn);
    if (localBook) {
      return c.json({
        isbn,
        title: localBook.title,
        author: localBook.vendor || "",
        publishers: [],
        publishDate: "",
        subjects: localBook.tags || [],
        numberOfPages: null,
        description: "",
        language: "",
        source: "local:" + localBook.source,
      });
    }

    // Try Google Books
    const googleResult = await lookupGoogleBooks(isbn);
    if (googleResult) {
      return c.json(googleResult);
    }

    // Fall back to Open Library
    const openLibResult = await lookupOpenLibrary(isbn);
    if (openLibResult) {
      return c.json(openLibResult);
    }

    return c.json({ error: "Book not found", isbn }, 404);
  } catch (err) {
    return c.json({ error: "Lookup failed" }, 500);
  }
});

// Title autocomplete from local books database
app.get("/api/books/search", (c) => {
  const q = (c.req.query("q") || "").toLowerCase().trim();
  if (q.length < 2) {
    return c.json({ results: [] });
  }

  const results = localBooks
    .filter(book => book.title.toLowerCase().includes(q))
    .slice(0, 20)
    .map(book => ({
      title: book.title,
      author: book.vendor || "",
      isbn: /^97[89]\d{10}$/.test(book.sku) ? book.sku : "",
      source: book.source,
    }));

  return c.json({ results });
});

// Site config (for the frontend to read feature flags from the API instead
// of relying on build-time NEXT_PUBLIC_ vars).
app.get("/api/config", (c) => {
  return c.json({
    siteName: config.siteName,
    siteDescription: config.siteDescription,
    features: config.features,
  });
});

// Active lendings for a book (copies-mode only — returns [] when off).
app.get("/api/books/:id/active-lendings", (c) => {
  if (!isAuthed(c)) return c.json({ error: "Unauthorized" }, 401);
  const id = parseInt(c.req.param("id"));
  if (!Number.isFinite(id)) return c.json({ error: "Invalid id" }, 400);
  const rows = db.select().from(activeLendings)
    .where(eq(activeLendings.bookId, id))
    .all();
  return c.json({ lendings: rows });
});

// Borrower autocomplete — unique (name, contact) pairs seen in active lendings
// first, then fall back to historical lending logs.
app.get("/api/borrowers", (c) => {
  if (!isAuthed(c)) return c.json({ error: "Unauthorized" }, 401);
  const active = db.select().from(activeLendings).all();
  const logs = db.select().from(lendingLogs).all();
  const seen = new Map<string, { name: string; contact: string }>();
  for (const a of active) {
    const key = `${a.borrower}|${a.borrowerContact || ""}`;
    if (!seen.has(key)) seen.set(key, { name: a.borrower, contact: a.borrowerContact || "" });
  }
  for (const l of logs) {
    const key = `${l.borrower}|`;
    if (!seen.has(key)) seen.set(key, { name: l.borrower, contact: "" });
  }
  return c.json({ borrowers: [...seen.values()] });
});

// Get lending history
app.get("/api/lending-logs", (c) => {
  if (!isAuthed(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const logs = db.select().from(lendingLogs).orderBy(desc(lendingLogs.createdAt)).all();
  return c.json({ logs });
});

// Add a note to a lending log
app.post("/api/lending-logs/:id/note", async (c) => {
  if (!isAuthed(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const id = parseInt(c.req.param("id"));
  const { note } = await c.req.json();
  const log = db.select().from(lendingLogs).where(eq(lendingLogs.id, id)).get();
  if (!log) return c.json({ error: "Log not found" }, 404);
  const timestamp = new Date().toISOString();
  const existingNote = log.note || "";
  const newNote = existingNote
    ? `${existingNote}\n[${timestamp}] ${note}`
    : `[${timestamp}] ${note}`;
  db.update(lendingLogs).set({ note: newNote }).where(eq(lendingLogs.id, id)).run();
  return c.json({ success: true });
});

// Get borrower details - all lending history and current books
app.get("/api/borrowers/:name", (c) => {
  if (!isAuthed(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const name = decodeURIComponent(c.req.param("name"));

  // Get all lending logs for this borrower
  const logs = db.select().from(lendingLogs)
    .where(eq(lendingLogs.borrower, name))
    .orderBy(desc(lendingLogs.createdAt))
    .all();

  // Get currently borrowed books
  const currentlyBorrowed = db.select().from(activeLendings)
    .where(eq(activeLendings.borrower, name))
    .all();

  // Get book details for currently borrowed
  const currentBooks = currentlyBorrowed.map((lending) => {
    const book = db.select().from(books).where(eq(books.id, lending.bookId)).get();
    return {
      ...lending,
      bookTitle: book?.title || "Unknown",
      bookAuthor: book?.author || "",
    };
  });

  return c.json({
    borrower: name,
    logs,
    currentBooks,
    stats: {
      totalBorrowed: logs.filter(l => l.action === "lend").length,
      totalReturned: logs.filter(l => l.action === "return").length,
      currentlyHas: currentBooks.length,
    }
  });
});

const port = parseInt(process.env.PORT || "3001");
console.log(`Shelflet API running on port ${port}`);
serve({ fetch: app.fetch, port });
