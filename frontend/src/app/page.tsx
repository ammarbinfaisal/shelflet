import { connection } from "next/server";
import { apiFetch } from "@/lib/db";

type Book = {
  id: number;
  title: string;
  author: string;
  explanation: string;
  language: string;
  category: string;
  lentTo: string;
  createdAt: string;
};

export default async function HomePage() {
  await connection();
  const res = await apiFetch("/api/books");
  const { books: allBooks }: { books: Book[] } = await res.json();
  const count = allBooks.length;
  const available = allBooks.filter((b) => !b.lentTo);
  const lentOut = allBooks.filter((b) => b.lentTo);
  const categories = [...new Set(allBooks.map((b) => b.category).filter(Boolean))];

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-1">Book Collection</h1>
        <p className="text-neutral-500 text-xs sm:text-sm">
          {count} books &middot; {available.length} available &middot;{" "}
          {lentOut.length} lent out
        </p>
      </div>

      <div className="mb-4 sm:mb-6 flex flex-wrap gap-1.5 sm:gap-2">
        {categories.sort().map((cat) => (
          <span
            key={cat}
            className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs rounded-full bg-neutral-100 text-neutral-600"
          >
            {cat}
          </span>
        ))}
      </div>

      {/* Mobile: card layout */}
      <div className="sm:hidden space-y-2">
        {allBooks.map((book) => (
          <div
            key={book.id}
            className="border border-neutral-200 rounded-lg p-3 flex items-start justify-between gap-2"
          >
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{book.title}</p>
              <p className="text-xs text-neutral-500 truncate">{book.author}</p>
              {book.category && (
                <p className="text-xs text-neutral-400 mt-0.5">{book.category}</p>
              )}
            </div>
            {book.lentTo ? (
              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700">
                Unavailable
              </span>
            ) : (
              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700">
                Available
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Desktop: table layout */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 text-left text-neutral-500">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Author</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Language</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {allBooks.map((book) => (
              <tr key={book.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-3 font-medium">{book.title}</td>
                <td className="px-4 py-3 text-neutral-600">{book.author}</td>
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
