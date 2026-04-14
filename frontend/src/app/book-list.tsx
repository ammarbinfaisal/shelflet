"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Book } from "@/lib/db/schema";
import { config } from "@/lib/config";
import { Badge } from "@/components/ui/badge";

const FEAT = config.features;
const HIDE_INFO = config.hiddenListColumns.has("info");

function isAvailable(book: Book): boolean {
  return FEAT.copies ? book.availableCopies > 0 : !book.lentTo;
}
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[''ʿ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ── Extracted Item Components ────────────────────────

function FilterOption({
  option,
  selected,
  onToggle,
}: {
  option: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-neutral-50 text-left ${
        selected ? "font-medium text-neutral-900" : "text-neutral-600"
      }`}
    >
      <span
        className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
          selected ? "bg-neutral-900 border-neutral-900" : "border-neutral-300"
        }`}
      >
        {selected && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      {option}
    </button>
  );
}

function FilterChip({
  option,
  selected,
  onToggle,
}: {
  option: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`px-2.5 py-1.5 text-xs rounded-full transition-colors ${
        selected
          ? "bg-neutral-900 text-white"
          : "bg-neutral-100 text-neutral-600 active:bg-neutral-200"
      }`}
    >
      {option}
    </button>
  );
}

function SortOption({
  field,
  currentField,
  currentDir,
  onSelect,
}: {
  field: SortField;
  currentField: SortField;
  currentDir: SortDir;
  onSelect: () => void;
}) {
  const isActive = currentField === field;
  return (
    <button
      onClick={onSelect}
      className={`flex items-center justify-between w-full px-2 py-1.5 text-xs rounded hover:bg-neutral-50 ${
        isActive ? "font-medium text-neutral-900" : "text-neutral-600"
      }`}
    >
      <span className="capitalize">{field}</span>
      {isActive && (
        <span className="text-[10px] text-neutral-400">{currentDir === "asc" ? "A-Z" : "Z-A"}</span>
      )}
    </button>
  );
}

function BookCard({ book }: { book: Book }) {
  return (
    <div className="border border-neutral-200 rounded-lg p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/book/${encodeURIComponent(book.slug)}`} className="font-medium text-sm hover:underline">
            {book.title}
          </Link>
          <Link href={`/author/${encodeURIComponent(book.authorShortName || book.author)}`} className="text-xs text-neutral-500 hover:text-neutral-700 hover:underline block">
            {book.authorShortName || book.author}
          </Link>
        </div>
        {FEAT.copies ? (
          <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${isAvailable(book) ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
            {book.totalCopies > 1
              ? `${book.availableCopies}/${book.totalCopies}`
              : isAvailable(book)
              ? "In"
              : "Out"}
          </span>
        ) : book.lentTo ? (
          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700">
            Out
          </span>
        ) : (
          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700">
            In
          </span>
        )}
      </div>
      {((!HIDE_INFO && book.explanation) || book.category) && (
        <div className="mt-1.5 flex flex-wrap gap-1 items-center">
          {!HIDE_INFO && book.explanation && (
            <span className="text-[10px] text-neutral-400">{book.explanation}</span>
          )}
          {book.category && (
            <span className="text-[10px] text-neutral-400">
              {!HIDE_INFO && book.explanation ? " · " : ""}
              {(book.category || "").split(",").map((cat) => cat.trim()).filter(Boolean).map((cat, i) => (
                <span key={cat}>
                  {i > 0 && ", "}
                  <Link href={`/category/${encodeURIComponent(slugify(cat))}`} className="hover:text-neutral-600 hover:underline">{cat}</Link>
                </span>
              ))}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function BookTableRow({ book }: { book: Book }) {
  return (
    <tr className="hover:bg-neutral-50 transition-colors">
      <td className="px-4 py-3 font-medium truncate">
        <Link href={`/book/${encodeURIComponent(book.slug)}`} className="hover:underline">{book.title}</Link>
      </td>
      <td className="px-4 py-3 text-neutral-600 truncate">
        <Link href={`/author/${encodeURIComponent(book.authorShortName || book.author)}`} className="hover:text-neutral-900 hover:underline">
          {book.authorFullName || book.author}
        </Link>
      </td>
      {!HIDE_INFO && (
        <td className="px-4 py-3 text-neutral-500 text-xs truncate">{book.explanation}</td>
      )}
      <td className="px-4 py-3 text-neutral-500 truncate">
        {(book.category || "").split(",").map((cat) => cat.trim()).filter(Boolean).map((cat, i) => (
          <span key={cat}>
            {i > 0 && ", "}
            <Link href={`/category/${encodeURIComponent(slugify(cat))}`} className="hover:text-neutral-700 hover:underline">{cat}</Link>
          </span>
        ))}
      </td>
      <td className="px-4 py-3 text-neutral-500">
        <Link href={`/language/${encodeURIComponent(slugify(book.language))}`} className="hover:text-neutral-700 hover:underline">{book.language}</Link>
      </td>
      <td className="px-4 py-3">
        {FEAT.copies ? (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isAvailable(book) ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
            {book.totalCopies > 1
              ? `${book.availableCopies}/${book.totalCopies} available`
              : isAvailable(book)
              ? "Available"
              : "Unavailable"}
          </span>
        ) : book.lentTo ? (
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
  );
}

type SortField = "title" | "author" | "category" | "language";
type SortDir = "asc" | "desc";

type Filters = {
  categories: Set<string>;
  languages: Set<string>;
  authors: Set<string>;
  query: string;
};

function parseInitialState(params: URLSearchParams) {
  return {
    sortField: (params.get("sort") as SortField) || "language",
    sortDir: (params.get("dir") as SortDir) || "desc",
    filters: {
      categories: params.get("cat") ? new Set(params.get("cat")!.split(",")) : new Set<string>(),
      languages: params.get("lang") ? new Set(params.get("lang")!.split(",")) : new Set<string>(),
      authors: params.get("author") ? new Set(params.get("author")!.split(",")) : new Set<string>(),
      query: params.get("q") || "",
    } as Filters,
  };
}

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

function IconFilter({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}

function IconChevron({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ── Column Filter Popover (desktop) ──────────────────

function ColumnFilter({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  onToggle: (val: string) => void;
  onClear: () => void;
}) {
  const hasFilter = selected.size > 0;

  return (
    <Popover>
      <PopoverTrigger
        className={`inline-flex items-center gap-0.5 text-xs cursor-pointer ${
          hasFilter ? "text-neutral-900 font-semibold" : "text-neutral-400"
        } hover:text-neutral-600`}
      >
        <IconFilter className="w-3 h-3" />
        {hasFilter && <span className="text-[10px]">({selected.size})</span>}
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="start">
        <div className="max-h-56 overflow-y-auto p-1">
          {options.map((opt) => (
            <FilterOption
              key={opt}
              option={opt}
              selected={selected.has(opt)}
              onToggle={() => onToggle(opt)}
            />
          ))}
        </div>
        {hasFilter && (
          <div className="border-t p-1">
            <button
              onClick={onClear}
              className="w-full px-2 py-1 text-xs text-neutral-400 hover:text-neutral-600 text-left"
            >
              Clear filter
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ── Mobile Filter Sheet ──────────────────────────────

function FilterSection({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  onToggle: (val: string) => void;
}) {
  return (
    <div className="mb-4">
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <FilterChip
            key={opt}
            option={opt}
            selected={selected.has(opt)}
            onToggle={() => onToggle(opt)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────

export function BookList({ books }: { books: Book[] }) {
  const searchParams = useSearchParams();
  const initial = useMemo(() => parseInitialState(searchParams), []);

  const [sortField, setSortField] = useState<SortField>(initial.sortField);
  const [sortDir, setSortDir] = useState<SortDir>(initial.sortDir);
  const [filters, setFilters] = useState<Filters>(initial.filters);

  // Deferred URL sync
  const rafId = useRef(0);
  const syncToUrl = useCallback((s: { sort: SortField; dir: SortDir; f: Filters }) => {
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      const params = new URLSearchParams();
      if (s.f.query) params.set("q", s.f.query);
      if (s.sort !== "language") params.set("sort", s.sort);
      if (s.dir !== "desc") params.set("dir", s.dir);
      if (s.f.categories.size > 0) params.set("cat", [...s.f.categories].join(","));
      if (s.f.languages.size > 0) params.set("lang", [...s.f.languages].join(","));
      if (s.f.authors.size > 0) params.set("author", [...s.f.authors].join(","));
      const qs = params.toString();
      window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
    });
  }, []);

  // Unique values for filter options
  const allCategories = useMemo(
    () => [...new Set(books.flatMap((b) => (b.category || "").split(",").map((s) => s.trim())).filter(Boolean))].sort(),
    [books]
  );
  const allLanguages = useMemo(
    () => [...new Set(books.flatMap((b) => (b.language || "").split(",").map((s) => s.trim())).filter(Boolean))].sort(),
    [books]
  );
  const allAuthors = useMemo(
    () => [...new Set(books.map((b) => b.author).filter(Boolean))].sort(),
    [books]
  );

  function toggleFilter(key: keyof Pick<Filters, "categories" | "languages" | "authors">, val: string) {
    setFilters((prev) => {
      const next = { ...prev, [key]: new Set(prev[key]) };
      if (next[key].has(val)) next[key].delete(val);
      else next[key].add(val);
      syncToUrl({ sort: sortField, dir: sortDir, f: next });
      return next;
    });
  }

  function clearFilter(key: keyof Pick<Filters, "categories" | "languages" | "authors">) {
    setFilters((prev) => {
      const next = { ...prev, [key]: new Set<string>() };
      syncToUrl({ sort: sortField, dir: sortDir, f: next });
      return next;
    });
  }

  function clearAllFilters() {
    const next: Filters = { categories: new Set(), languages: new Set(), authors: new Set(), query: "" };
    setFilters(next);
    syncToUrl({ sort: sortField, dir: sortDir, f: next });
  }

  function updateQuery(q: string) {
    setFilters((prev) => {
      const next = { ...prev, query: q };
      syncToUrl({ sort: sortField, dir: sortDir, f: next });
      return next;
    });
  }

  function toggleSort(field: SortField) {
    const newDir = sortField === field
      ? (sortDir === "asc" ? "desc" : "asc") as SortDir
      : (field === "language" ? "desc" : "asc") as SortDir;
    setSortField(field);
    setSortDir(newDir);
    syncToUrl({ sort: field, dir: newDir, f: filters });
  }

  const activeFilterCount = filters.categories.size + filters.languages.size + filters.authors.size + (filters.query ? 1 : 0);

  const filtered = useMemo(() => {
    let result = books;

    if (filters.query) {
      const q = filters.query.toLowerCase();
      result = result.filter(
        (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
      );
    }

    if (filters.categories.size > 0) {
      result = result.filter((b) => {
        const bookCats = (b.category || "").split(",").map((s) => s.trim());
        return bookCats.some((c) => filters.categories.has(c));
      });
    }

    if (filters.languages.size > 0) {
      result = result.filter((b) => {
        const bookLangs = (b.language || "").split(",").map((s) => s.trim());
        return bookLangs.some((l) => filters.languages.has(l));
      });
    }

    if (filters.authors.size > 0) {
      result = result.filter((b) => filters.authors.has(b.author));
    }

    result = [...result].sort((a, b) => {
      const av = (a[sortField] || "").toLowerCase();
      const bv = (b[sortField] || "").toLowerCase();
      const cmp = av.localeCompare(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [books, filters, sortField, sortDir]);

  const available = filtered.filter(isAvailable);
  const lentOut = filtered.filter((b) => !isAvailable(b));

  const SortHeader = ({ field, children, className }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <th className={`px-4 py-3 font-medium ${className || ""}`}>
      <div className="flex items-center gap-1">
        <button
          className="cursor-pointer select-none hover:text-neutral-700 flex items-center"
          onClick={() => toggleSort(field)}
        >
          {children}
          <IconSort active={sortField === field} dir={sortField === field ? sortDir : "asc"} />
        </button>
      </div>
    </th>
  );

  const FilterableHeader = ({
    field,
    children,
    options,
    selected,
    filterKey,
    className,
  }: {
    field: SortField;
    children: React.ReactNode;
    options: string[];
    selected: Set<string>;
    filterKey: keyof Pick<Filters, "categories" | "languages" | "authors">;
    className?: string;
  }) => (
    <th className={`px-4 py-3 font-medium ${className || ""}`}>
      <div className="flex items-center gap-1.5">
        <button
          className="cursor-pointer select-none hover:text-neutral-700 flex items-center"
          onClick={() => toggleSort(field)}
        >
          {children}
          <IconSort active={sortField === field} dir={sortField === field ? sortDir : "asc"} />
        </button>
        <ColumnFilter
          label={field}
          options={options}
          selected={selected}
          onToggle={(v) => toggleFilter(filterKey, v)}
          onClear={() => clearFilter(filterKey)}
        />
      </div>
    </th>
  );

  // Active filter badges
  const activeBadges: { label: string; key: keyof Pick<Filters, "categories" | "languages" | "authors">; val: string }[] = [];
  for (const c of filters.categories) activeBadges.push({ label: c, key: "categories", val: c });
  for (const l of filters.languages) activeBadges.push({ label: l, key: "languages", val: l });
  for (const a of filters.authors) activeBadges.push({ label: a, key: "authors", val: a });

  return (
    <div className="pb-20 sm:pb-0">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-1">Book Collection</h1>
        <p className="text-neutral-500 text-xs sm:text-sm">
          {filtered.length} books &middot; {available.length} available &middot;{" "}
          {lentOut.length} lent out
        </p>
      </div>

      {/* Active filter badges */}
      {(activeBadges.length > 0 || filters.query) && (
        <div className="mb-3 sm:mb-4 flex flex-wrap gap-1.5 items-center">
          {filters.query && (
            <Badge
              variant="secondary"
              className="text-xs cursor-pointer"
              onClick={() => updateQuery("")}
            >
              &ldquo;{filters.query}&rdquo; &times;
            </Badge>
          )}
          {activeBadges.map((b) => (
            <Badge
              key={`${b.key}-${b.val}`}
              variant="secondary"
              className="text-xs cursor-pointer"
              onClick={() => toggleFilter(b.key, b.val)}
            >
              {b.label} &times;
            </Badge>
          ))}
          <button
            onClick={clearAllFilters}
            className="text-xs text-neutral-400 hover:text-neutral-600 ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Mobile: cards + fixed bottom filter bar */}
      <div className="sm:hidden space-y-2">
        {filtered.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-neutral-400 text-sm py-8">No books match your filters.</p>
        )}

        {/* Fixed bottom filter bar — thumb zone */}
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-neutral-200 px-4 py-3 flex items-center justify-between z-40">
          <Dialog>
            <DialogTrigger
              render={
                <Button variant="outline" size="default" />
              }
            >
              <IconFilter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-neutral-900 text-white">
                  {activeFilterCount}
                </span>
              )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Filter Books</DialogTitle>
              </DialogHeader>
              <div className="mt-2">
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search title or author..."
                    value={filters.query}
                    onChange={(e) => updateQuery(e.target.value)}
                    className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <FilterSection
                  label="Category"
                  options={allCategories}
                  selected={filters.categories}
                  onToggle={(v) => toggleFilter("categories", v)}
                />
                <FilterSection
                  label="Language"
                  options={allLanguages}
                  selected={filters.languages}
                  onToggle={(v) => toggleFilter("languages", v)}
                />
                <FilterSection
                  label="Author"
                  options={allAuthors}
                  selected={filters.authors}
                  onToggle={(v) => toggleFilter("authors", v)}
                />
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="w-full py-2 text-sm text-neutral-500 hover:text-neutral-700"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Sort toggle */}
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="outline" size="default" />
              }
            >
              <IconChevron className="w-3 h-3" />
              Sort: {sortField}
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1" align="end" side="top">
              {(["title", "author", "category", "language"] as const).map((f) => (
                <SortOption
                  key={f}
                  field={f}
                  currentField={sortField}
                  currentDir={sortDir}
                  onSelect={() => toggleSort(f)}
                />
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Desktop: table layout */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className={HIDE_INFO ? "w-[32%]" : "w-[25%]"} />  {/* Title */}
            <col className={HIDE_INFO ? "w-[24%]" : "w-[18%]"} />  {/* Author */}
            {!HIDE_INFO && <col className="w-[18%]" />}           {/* Info */}
            <col className={HIDE_INFO ? "w-[20%]" : "w-[16%]"} />  {/* Category */}
            <col className={HIDE_INFO ? "w-[12%]" : "w-[10%]"} />  {/* Language */}
            <col className={HIDE_INFO ? "w-[12%]" : "w-[13%]"} />  {/* Status */}
          </colgroup>
          <thead>
            <tr className="bg-neutral-50 text-left text-neutral-500">
              <SortHeader field="title">Title</SortHeader>
              <FilterableHeader field="author" options={allAuthors} selected={filters.authors} filterKey="authors">Author</FilterableHeader>
              {!HIDE_INFO && <th className="px-4 py-3 font-medium">Info</th>}
              <FilterableHeader field="category" options={allCategories} selected={filters.categories} filterKey="categories">Category</FilterableHeader>
              <FilterableHeader field="language" options={allLanguages} selected={filters.languages} filterKey="languages">Language</FilterableHeader>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtered.map((book) => (
              <BookTableRow key={book.id} book={book} />
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="hidden sm:block text-center text-neutral-400 text-sm py-8">No books match your filters.</p>
      )}
    </div>
  );
}
