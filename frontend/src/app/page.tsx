import { fetchBooks } from "@/lib/api";

export default async function HomePage() {
  const { books, count } = await fetchBooks();

  const available = books.filter((b) => !b.lentTo);
  const lentOut = books.filter((b) => b.lentTo);
  const categories = [...new Set(books.map((b) => b.category).filter(Boolean))];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Book Collection</h1>
        <p className="text-neutral-500 text-sm">
          {count} books &middot; {available.length} available &middot;{" "}
          {lentOut.length} lent out
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {categories.sort().map((cat) => (
          <span
            key={cat}
            className="px-2.5 py-1 text-xs rounded-full bg-neutral-100 text-neutral-600"
          >
            {cat}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200">
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
            {books.map((book) => (
              <tr
                key={book.row}
                className="hover:bg-neutral-50 transition-colors"
              >
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
