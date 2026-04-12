"use client";

import { useEffect, useState } from "react";
import { useAuthFetch } from "@/lib/auth";
import { AuthGate } from "@/components/auth-gate";
import { BookList } from "./book-list";

function HomeContent() {
  const authFetch = useAuthFetch();
  const [books, setBooks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authFetch("/api/books")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch books");
        return res.json();
      })
      .then((data) => setBooks(data.books || []))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [authFetch]);

  if (isLoading) {
    return <div className="text-center py-8 text-neutral-400">Loading books...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return <BookList books={books} />;
}

export default function HomePage() {
  return (
    <AuthGate>
      <HomeContent />
    </AuthGate>
  );
}
