import { Suspense } from "react";
import { apiFetch } from "@/lib/db";
import { BookList } from "./book-list";

export const revalidate = 60;

export default async function HomePage() {
  const res = await apiFetch("/api/books");
  const { books } = await res.json();

  return (
    <Suspense fallback={<div className="text-center py-8 text-neutral-400">Loading...</div>}>
      <BookList books={books} />
    </Suspense>
  );
}
