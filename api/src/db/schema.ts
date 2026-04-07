import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const books = sqliteTable("books", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  author: text("author").notNull().default(""),
  explanation: text("explanation").default(""),
  language: text("language").default("English"),
  category: text("category").default(""),
  lentTo: text("lent_to").default(""),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
