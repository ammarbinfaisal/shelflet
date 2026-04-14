import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const books = sqliteTable("books", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  author: text("author").notNull().default(""),
  translator: text("translator").default(""),
  explanation: text("explanation").default(""),
  language: text("language").default("English"),
  category: text("category").default(""),
  isbn: text("isbn").default(""),
  published: text("published").default(""),
  lentTo: text("lent_to").default(""),
  totalCopies: integer("total_copies").notNull().default(1),
  availableCopies: integer("available_copies").notNull().default(1),
  hidden: integer("hidden").default(0),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const activeLendings = sqliteTable("active_lendings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bookId: integer("book_id").notNull(),
  borrower: text("borrower").notNull(),
  borrowerContact: text("borrower_contact").default(""),
  note: text("note").default(""),
  lentAt: text("lent_at").$defaultFn(() => new Date().toISOString()),
});

export const lendingLogs = sqliteTable("lending_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bookId: integer("book_id").notNull(),
  bookTitle: text("book_title").notNull(),
  borrower: text("borrower").notNull(),
  action: text("action").notNull(), // "lend" | "return"
  note: text("note").default(""),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const authors = sqliteTable("authors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shortName: text("short_name").notNull(),
  fullName: text("full_name").notNull(),
  bio: text("bio").default(""),
});

export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
export type LendingLog = typeof lendingLogs.$inferSelect;
export type Author = typeof authors.$inferSelect;
export type ActiveLending = typeof activeLendings.$inferSelect;
