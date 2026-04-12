import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { db } from "./db/index.js";
import { books, lendingLogs, authors } from "./db/schema.js";
import { eq, desc } from "drizzle-orm";

const app = new Hono();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

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

app.use("/*", cors({
  origin: process.env.CORS_ORIGIN || "https://books.ammarfaisal.me",
  credentials: true,
}));

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// List books (public — excludes hidden), enriched with author info
app.get("/api/books", (c) => {
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
app.get("/api/books/by-slug/:slug", (c) => {
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
app.get("/api/categories", (c) => {
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
app.get("/api/categories/:slug", (c) => {
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
app.get("/api/languages", (c) => {
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
app.get("/api/languages/:slug", (c) => {
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

// List all authors
app.get("/api/authors", (c) => {
  const allAuthors = db.select().from(authors).all();
  return c.json({ authors: allAuthors });
});

// Get single author by short name (URL slug)
app.get("/api/authors/:slug", (c) => {
  const slug = decodeURIComponent(c.req.param("slug"));
  const author = db.select().from(authors).where(eq(authors.shortName, slug)).get();
  if (!author) return c.json({ error: "Author not found" }, 404);
  const authorBooks = db.select().from(books)
    .where(eq(books.author, author.shortName))
    .all()
    .filter((b) => !b.hidden);
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
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
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

  switch (action) {
    case "add": {
      db.insert(books).values({
        title: data.title,
        author: data.author,
        explanation: data.explanation || "",
        language: data.language || "English",
        category: data.category || "",
      }).run();
      return c.json({ success: true });
    }
    case "edit": {
      if (!data.id) return c.json({ error: "id required" }, 400);
      db.update(books).set({
        title: data.title,
        author: data.author,
        explanation: data.explanation ?? "",
        language: data.language ?? "English",
        category: data.category ?? "",
      }).where(eq(books.id, data.id)).run();
      return c.json({ success: true });
    }
    case "delete": {
      if (!data.id) return c.json({ error: "id required" }, 400);
      db.delete(books).where(eq(books.id, data.id)).run();
      return c.json({ success: true });
    }
    case "lend": {
      if (!data.id || !data.lentTo)
        return c.json({ error: "id and lentTo required" }, 400);
      const book = db.select().from(books).where(eq(books.id, data.id)).get();
      if (!book) return c.json({ error: "Book not found" }, 404);
      db.update(books).set({ lentTo: data.lentTo }).where(eq(books.id, data.id)).run();
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
      db.update(books).set({ lentTo: "" }).where(eq(books.id, data.id)).run();
      db.insert(lendingLogs).values({
        bookId: data.id,
        bookTitle: book.title,
        borrower: book.lentTo || "unknown",
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
        db.insert(books).values({
          title: book.title,
          author: book.author || "",
          explanation: book.explanation || "",
          language: book.language || "English",
          category: book.category || "",
        }).run();
        added++;
      }
      return c.json({ success: true, added });
    }
    default:
      return c.json({ error: "Unknown action" }, 400);
  }
});

// ISBN lookup via Open Library
app.get("/api/isbn/:isbn", async (c) => {
  const isbn = c.req.param("isbn").replace(/[^0-9X]/gi, "");
  if (!isbn || (isbn.length !== 10 && isbn.length !== 13)) {
    return c.json({ error: "Invalid ISBN" }, 400);
  }
  try {
    const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
    if (!res.ok) {
      return c.json({ error: "Book not found", isbn }, 404);
    }
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

    return c.json({
      isbn,
      title: data.title || "",
      author: authorName,
      publishers: data.publishers || [],
      publishDate: data.publish_date || "",
      subjects: data.subjects || [],
      numberOfPages: data.number_of_pages || null,
    });
  } catch (err) {
    return c.json({ error: "Lookup failed" }, 500);
  }
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

const port = parseInt(process.env.PORT || "3001");
console.log(`Shelflet API running on port ${port}`);
serve({ fetch: app.fetch, port });
