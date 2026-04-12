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

type AuthorBook = {
  id: number;
  title: string;
  slug: string;
  explanation: string;
  language: string;
  category: string;
  lentTo: string;
};

type Author = {
  shortName: string;
  fullName: string;
  bio?: string;
};

function AuthorContent() {
  const params = useParams();
  const slug = params.slug as string;
  const authFetch = useAuthFetch();
  const [author, setAuthor] = useState<Author | null>(null);
  const [books, setBooks] = useState<AuthorBook[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    authFetch(`/api/authors/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Author not found");
        return res.json();
      })
      .then((data) => {
        setAuthor(data.author);
        setBooks(data.books || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [slug, authFetch]);

  if (isLoading) {
    return <div className="text-center py-8 text-neutral-400">Loading...</div>;
  }

  if (error || !author) {
    return <div className="text-center py-8 text-red-500">{error || "Author not found"}</div>;
  }

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
        <h1 className="text-xl sm:text-2xl font-bold">{author.fullName}</h1>
        {author.shortName !== author.fullName && (
          <p className="text-sm text-neutral-500 mt-0.5">{author.shortName}</p>
        )}
        {author.bio && (
          <p className="text-sm text-neutral-600 mt-2">{author.bio}</p>
        )}
        <p className="text-xs text-neutral-400 mt-2">
          {books.length} {books.length === 1 ? "book" : "books"} in collection
        </p>
      </div>

      {/* Mobile: cards */}
      <div className="sm:hidden space-y-2">
        {books.map((book: AuthorBook) => (
          <div
            key={book.id}
            className="border border-neutral-200 rounded-lg p-3"
          >
            <Link href={`/book/${encodeURIComponent(book.slug)}`} className="font-medium text-sm hover:underline">
              {book.title}
            </Link>
            {book.explanation && (
              <p className="text-xs text-neutral-400 mt-0.5">{book.explanation}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {(book.category || "").split(",").map((cat) => cat.trim()).filter(Boolean).map((cat) => (
                <Link
                  key={cat}
                  href={`/category/${encodeURIComponent(slugify(cat))}`}
                  className="text-[10px] text-neutral-400 hover:text-neutral-600 hover:underline"
                >
                  {cat}
                </Link>
              ))}
              <Link
                href={`/language/${encodeURIComponent(slugify(book.language))}`}
                className="text-[10px] text-neutral-400 hover:text-neutral-600 hover:underline"
              >
                {book.language}
              </Link>
              {book.lentTo ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700">
                  Unavailable
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700">
                  Available
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 text-left text-neutral-500">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Info</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Language</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {books.map((book: AuthorBook) => (
              <tr key={book.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/book/${encodeURIComponent(book.slug)}`} className="hover:underline">
                    {book.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-neutral-500 text-xs">{book.explanation}</td>
                <td className="px-4 py-3 text-neutral-500">
                  {(book.category || "").split(",").map((cat) => cat.trim()).filter(Boolean).map((cat, i) => (
                    <span key={cat}>
                      {i > 0 && ", "}
                      <Link
                        href={`/category/${encodeURIComponent(slugify(cat))}`}
                        className="hover:text-neutral-700 hover:underline"
                      >
                        {cat}
                      </Link>
                    </span>
                  ))}
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  <Link
                    href={`/language/${encodeURIComponent(slugify(book.language))}`}
                    className="hover:text-neutral-700 hover:underline"
                  >
                    {book.language}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {book.lentTo ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">
                      Unavailable
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
                      Available
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AuthorPage() {
  return (
    <AuthGate>
      <AuthorContent />
    </AuthGate>
  );
}
