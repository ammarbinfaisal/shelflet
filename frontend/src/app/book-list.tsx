"use client";

import { useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Book } from "@/lib/db/schema";

type SortField = "title" | "author" | "category" | "language";
type SortDir = "asc" | "desc";

function IconSort({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg className={`inline w-3 h-3 ml-0.5 ${active ? "text-neutral-900" : "text-neutral-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {dir === "asc" ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      )}
    </svg>
  );
}

export function BookList({ books }: { books: Book[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const search = searchParams.get("q") || "";
  const sortField = (searchParams.get("sort") as SortField) || "language";
  const sortDir = (searchParams.get("dir") as SortDir) || "desc";
  const selectedCategories = useMemo(() => {
    const cats = searchParams.get("cat");
    return cats ? new Set(cats.split(",")) : new Set<string>();
  }, [searchParams]);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "/", { scroll: false });
    },
    [searchParams, router]
  );

  const allCategories = useMemo(
    () =>
      [...new Set(books.flatMap((b) => (b.category || "").split(",").map((s) => s.trim())).filter(Boolean))].sort(),
    [books]
  );

  function toggleSort(field: SortField) {
    if (sortField === field) {
      updateParams({ dir: sortDir === "asc" ? "desc" : "asc" });
    } else {
      updateParams({ sort: field, dir: field === "language" ? "desc" : "asc" });
    }
  }

  function toggleCategory(cat: string) {
    const next = new Set(selectedCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    updateParams({ cat: next.size > 0 ? [...next].join(",") : null });
  }

  function clearCategories() {
    updateParams({ cat: null });
  }

  const filtered = useMemo(() => {
    let result = books;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q)
      );
    }

    if (selectedCategories.size > 0) {
      result = result.filter((b) => {
        const bookCats = (b.category || "").split(",").map((s) => s.trim());
        return bookCats.some((c) => selectedCategories.has(c));
      });
    }

    result = [...result].sort((a, b) => {
      const av = (a[sortField] || "").toLowerCase();
      const bv = (b[sortField] || "").toLowerCase();
      const cmp = av.localeCompare(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [books, search, selectedCategories, sortField, sortDir]);

  const available = filtered.filter((b) => !b.lentTo);
  const lentOut = filtered.filter((b) => b.lentTo);

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="px-4 py-3 font-medium cursor-pointer select-none hover:text-neutral-700"
      onClick={() => toggleSort(field)}
    >
      {children}
      <IconSort active={sortField === field} dir={sortField === field ? sortDir : "asc"} />
    </th>
  );

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-1">Book Collection</h1>
        <p className="text-neutral-500 text-xs sm:text-sm">
          {filtered.length} books &middot; {available.length} available &middot;{" "}
          {lentOut.length} lent out
        </p>
      </div>

      {/* Search */}
      <div className="mb-3 sm:mb-4">
        <input
          type="text"
          placeholder="Search by title or author..."
          value={search}
          onChange={(e) => updateParams({ q: e.target.value || null })}
          className="w-full sm:max-w-xs px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />
      </div>

      {/* Category filters */}
      <div className="mb-4 sm:mb-6 flex flex-wrap gap-1.5 sm:gap-2">
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs rounded-full transition-colors ${
              selectedCategories.has(cat)
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {cat}
          </button>
        ))}
        {selectedCategories.size > 0 && (
          <button
            onClick={clearCategories}
            className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs rounded-full text-neutral-400 hover:text-neutral-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Mobile: card layout */}
      <div className="sm:hidden space-y-2">
        {filtered.map((book) => (
          <div
            key={book.id}
            className="border border-neutral-200 rounded-lg p-3 flex items-start justify-between gap-2"
          >
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{book.title}</p>
              <p className="text-xs text-neutral-500 truncate">{book.author}</p>
              {book.explanation && (
                <p className="text-xs text-neutral-400 mt-0.5 truncate">{book.explanation}</p>
              )}
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
              <SortHeader field="title">Title</SortHeader>
              <SortHeader field="author">Author</SortHeader>
              <th className="px-4 py-3 font-medium">Info</th>
              <SortHeader field="category">Category</SortHeader>
              <SortHeader field="language">Language</SortHeader>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtered.map((book) => (
              <tr key={book.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-3 font-medium">{book.title}</td>
                <td className="px-4 py-3 text-neutral-600">{book.author}</td>
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

      {filtered.length === 0 && (
        <p className="text-center text-neutral-400 text-sm py-8">No books match your filters.</p>
      )}
    </div>
  );
}
