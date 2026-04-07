import { connection } from "next/server";
import { apiFetch } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

type AuthorBook = {
  id: number;
  title: string;
  explanation: string;
  language: string;
  category: string;
  lentTo: string;
};

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const res = await apiFetch(`/api/authors/${encodeURIComponent(slug)}`);

  if (!res.ok) notFound();

  const { author, books } = await res.json();

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
            <p className="font-medium text-sm">{book.title}</p>
            {book.explanation && (
              <p className="text-xs text-neutral-400 mt-0.5">{book.explanation}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              {book.category && (
                <span className="text-[10px] text-neutral-400">{book.category}</span>
              )}
              <span className="text-[10px] text-neutral-400">{book.language}</span>
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
                <td className="px-4 py-3 font-medium">{book.title}</td>
                <td className="px-4 py-3 text-neutral-500 text-xs">{book.explanation}</td>
                <td className="px-4 py-3 text-neutral-500">{book.category}</td>
                <td className="px-4 py-3 text-neutral-500">{book.language}</td>
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
