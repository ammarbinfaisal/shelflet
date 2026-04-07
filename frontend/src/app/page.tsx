import { connection } from "next/server";
import { apiFetch } from "@/lib/db";
import { BookList } from "./book-list";

export default async function HomePage() {
  await connection();
  const res = await apiFetch("/api/books");
  const { books } = await res.json();

  return <BookList books={books} />;
}
