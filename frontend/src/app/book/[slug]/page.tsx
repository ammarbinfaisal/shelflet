"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuthFetch } from "@/lib/auth";
import { AuthGate } from "@/components/auth-gate";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[''ʿ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type BookDetail = {
  id: number;
  title: string;
  slug: string;
  author: string;
  authorFullName: string;
  authorShortName: string;
  explanation: string;
  language: string;
  category: string;
  isbn: string;
  published: string;
  lentTo: string;
};

function BookContent() {
  const params = useParams();
  const slug = params.slug as string;
  const authFetch = useAuthFetch();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    authFetch(`/api/books/by-slug/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Book not found");
        return res.json();
      })
      .then((data) => setBook(data.book))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [slug, authFetch]);

  if (isLoading) {
    return <div className="text-center py-8 text-neutral-400">Loading book...</div>;
  }

  if (error || !book) {
    return <div className="text-center py-8 text-red-500">{error || "Book not found"}</div>;
  }

  const categories = (book.category || "").split(",").map((s) => s.trim()).filter(Boolean);
  const languages = (book.language || "").split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">{book.title}</h1>

        <div className="mt-2 space-y-1.5">
          <p className="text-sm text-neutral-600">
            <span className="text-neutral-400">Author: </span>
            <Link
              href={`/author/${encodeURIComponent(book.authorShortName || book.author)}`}
              className="hover:text-neutral-900 hover:underline"
            >
              {book.authorFullName || book.author || "Unknown"}
            </Link>
          </p>

          {book.explanation && (
            <p className="text-sm text-neutral-600">
              <span className="text-neutral-400">Info: </span>
              {book.explanation}
            </p>
          )}

          <p className="text-sm text-neutral-600">
            <span className="text-neutral-400">Category: </span>
            {categories.length > 0 ? (
              categories.map((cat, i) => (
                <span key={cat}>
                  {i > 0 && ", "}
                  <Link
                    href={`/category/${encodeURIComponent(slugify(cat))}`}
                    className="hover:text-neutral-900 hover:underline"
                  >
                    {cat}
                  </Link>
                </span>
              ))
            ) : (
              <span className="text-neutral-400">Uncategorized</span>
            )}
          </p>

          <p className="text-sm text-neutral-600">
            <span className="text-neutral-400">Language: </span>
            {languages.map((lang, i) => (
              <span key={lang}>
                {i > 0 && ", "}
                <Link
                  href={`/language/${encodeURIComponent(slugify(lang))}`}
                  className="hover:text-neutral-900 hover:underline"
                >
                  {lang}
                </Link>
              </span>
            ))}
          </p>

          {book.isbn && (
            <p className="text-sm text-neutral-600">
              <span className="text-neutral-400">ISBN: </span>
              {book.isbn}
            </p>
          )}

          {book.published && (
            <p className="text-sm text-neutral-600">
              <span className="text-neutral-400">Published: </span>
              {book.published}
            </p>
          )}

          <p className="text-sm">
            <span className="text-neutral-400">Status: </span>
            {book.lentTo ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">
                Lent to {book.lentTo}
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
                Available
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <AuthGate>
      <BookContent />
    </AuthGate>
  );
}
