import { connection } from "next/server";
import { apiFetch } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

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
  lentTo: string;
};

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const res = await apiFetch(`/api/books/by-slug/${encodeURIComponent(slug)}`);

  if (!res.ok) notFound();

  const { book }: { book: BookDetail } = await res.json();
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
