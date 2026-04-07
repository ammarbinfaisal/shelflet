import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { db } from "./db/index.js";
import { books } from "./db/schema.js";
import { eq } from "drizzle-orm";

const app = new Hono();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

app.use("/*", cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true,
}));

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// List all books
app.get("/api/books", (c) => {
  const allBooks = db.select().from(books).all();
  return c.json({ books: allBooks, count: allBooks.length });
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
    case "delete": {
      if (!data.id) return c.json({ error: "id required" }, 400);
      db.delete(books).where(eq(books.id, data.id)).run();
      return c.json({ success: true });
    }
    case "lend": {
      if (!data.id || !data.lentTo)
        return c.json({ error: "id and lentTo required" }, 400);
      db.update(books).set({ lentTo: data.lentTo }).where(eq(books.id, data.id)).run();
      return c.json({ success: true });
    }
    case "return": {
      if (!data.id) return c.json({ error: "id required" }, 400);
      db.update(books).set({ lentTo: "" }).where(eq(books.id, data.id)).run();
      return c.json({ success: true });
    }
    default:
      return c.json({ error: "Unknown action" }, 400);
  }
});

const port = parseInt(process.env.PORT || "3001");
console.log(`Shelflet API running on port ${port}`);
serve({ fetch: app.fetch, port });
