import { apiFetch } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

export const revalidate = 60;

export async function generateStaticParams() {
  const res = await apiFetch("/api/languages");
  const { languages } = await res.json();
  return languages.map((l: { slug: string }) => ({ slug: l.slug }));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[''ʿ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type LanguageBook = {
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

export default async function LanguagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await apiFetch(`/api/languages/${encodeURIComponent(slug)}`);

  if (!res.ok) notFound();

  const { language, books }: { language: string; books: LanguageBook[] } = await res.json();

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
        <h1 className="text-xl sm:text-2xl font-bold">{language}</h1>
        <p className="text-xs text-neutral-400 mt-2">
          {books.length} {books.length === 1 ? "book" : "books"} in {language}
        </p>
      </div>

      {/* Mobile: cards */}
      <div className="sm:hidden space-y-2">
        {books.map((book) => (
          <div key={book.id} className="border border-neutral-200 rounded-lg p-3">
            <Link href={`/book/${encodeURIComponent(book.slug)}`} className="font-medium text-sm hover:underline">
              {book.title}
            </Link>
            {book.explanation && (
              <p className="text-xs text-neutral-400 mt-0.5">{book.explanation}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              <Link
                href={`/author/${encodeURIComponent(book.authorShortName || book.author)}`}
                className="text-xs text-neutral-500 hover:text-neutral-700 hover:underline"
              >
                {book.authorShortName || book.author}
              </Link>
              {(book.category || "").split(",").map((cat) => cat.trim()).filter(Boolean).map((cat) => (
                <Link
                  key={cat}
                  href={`/category/${encodeURIComponent(slugify(cat))}`}
                  className="text-[10px] text-neutral-400 hover:text-neutral-600 hover:underline"
                >
                  {cat}
                </Link>
              ))}
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
              <th className="px-4 py-3 font-medium">Author</th>
              <th className="px-4 py-3 font-medium">Info</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {books.map((book) => (
              <tr key={book.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/book/${encodeURIComponent(book.slug)}`} className="hover:underline">
                    {book.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  <Link
                    href={`/author/${encodeURIComponent(book.authorShortName || book.author)}`}
                    className="hover:text-neutral-900 hover:underline"
                  >
                    {book.authorFullName || book.author}
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
