import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  explanation: text("explanation").default(""),
  language: text("language").default("English"),
  category: text("category").default(""),
  lentTo: text("lent_to").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
