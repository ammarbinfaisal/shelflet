"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { Book, ActiveLending } from "@/lib/db/schema";
import { ComboboxMulti } from "@/components/combobox-multi";
import { config } from "@/lib/config";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.books.ammarfaisal.me";
const FEAT = config.features;

type Borrower = { name: string; contact: string };

async function mutate(action: string, data: Record<string, unknown>) {
  const res = await fetch(`${API}/api/books/mutate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action, ...data }),
  });
  return res.json();
}

// ── Icons ────────────────────────────────────────────

function IconPlus({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function IconRefresh({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 15.75-6" />
      <path d="M21 3v6h-6" />
      <path d="M21 12a9 9 0 0 1-15.75 6" />
      <path d="M3 21v-6h6" />
    </svg>
  );
}

function IconLogout({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
    </svg>
  );
}

function IconLend({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
    </svg>
  );
}

function IconUndo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
  );
}

function IconTrash({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function IconEdit({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function IconHistory({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconBarcode({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2v16H3V4zm4 0h1v16H7V4zm3 0h2v16h-2V4zm4 0h3v16h-3V4zm5 0h2v16h-2V4z" />
    </svg>
  );
}

function IconEyeOff({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
    </svg>
  );
}

function IconEye({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

// ── Add Book Form ────────────────────────────────────

type FormState = { message?: string; error?: string } | null;

function AddBookForm({
  onDone,
  categoryOptions,
  languageOptions,
}: {
  onDone: () => void;
  categoryOptions: string[];
  languageOptions: string[];
}) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(["English"]);

  const [state, formAction, isPending] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const result = await mutate("add", {
        title: formData.get("title"),
        author: formData.get("author"),
        translator: FEAT.translator ? formData.get("translator") : undefined,
        explanation: formData.get("explanation"),
        language: languages.join(", "),
        category: categories.join(", "),
        totalCopies: FEAT.copies ? formData.get("totalCopies") : undefined,
      });
      if (result.error) return { error: result.error };
      setCategories([]);
      setLanguages(["English"]);
      onDone();
      return { message: "Book added" };
    },
    null
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-4 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-neutral-300 text-sm text-neutral-600 hover:border-neutral-400 hover:text-neutral-800 w-full sm:w-auto"
      >
        <IconPlus />
        <span>Add book</span>
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 border border-border rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
      <h3 className="font-semibold text-sm">Add a Book</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <input name="title" placeholder="Title" required className="input-field" />
        <input name="author" placeholder="Author" required className="input-field" />
        {FEAT.translator && (
          <input name="translator" placeholder="Translator" className="input-field" />
        )}
        {FEAT.copies && (
          <input
            name="totalCopies"
            type="number"
            min={1}
            defaultValue={1}
            placeholder="Total copies"
            className="input-field"
          />
        )}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Category</label>
          <ComboboxMulti
            options={categoryOptions}
            selected={categories}
            onChange={setCategories}
            placeholder="Select categories..."
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Language</label>
          <ComboboxMulti
            options={languageOptions}
            selected={languages}
            onChange={setLanguages}
            placeholder="Select languages..."
          />
        </div>
        <input name="explanation" placeholder="Explanation of (commentator)" className="input-field sm:col-span-2" />
      </div>
      {state?.error && <p className="text-red-600 text-xs">{state.error}</p>}
      {state?.message && <p className="text-green-600 text-xs">{state.message}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className="btn-primary text-sm">
          {isPending ? "Adding..." : "Add"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Edit Book Dialog ────────────────────────────────

function EditDialog({
  book,
  onClose,
  onDone,
  categoryOptions,
  languageOptions,
}: {
  book: Book;
  onClose: () => void;
  onDone: () => void;
  categoryOptions: string[];
  languageOptions: string[];
}) {
  const [categories, setCategories] = useState<string[]>(
    (book.category || "").split(",").map((s) => s.trim()).filter(Boolean)
  );
  const [languages, setLanguages] = useState<string[]>(
    (book.language || "").split(",").map((s) => s.trim()).filter(Boolean)
  );

  const [state, formAction, isPending] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const result = await mutate("edit", {
        id: book.id,
        title: formData.get("title"),
        author: formData.get("author"),
        translator: FEAT.translator ? formData.get("translator") : undefined,
        explanation: formData.get("explanation"),
        language: languages.join(", "),
        category: categories.join(", "),
        totalCopies: FEAT.copies ? formData.get("totalCopies") : undefined,
      });
      if (result.error) return { error: result.error };
      onDone();
      return { message: "Saved" };
    },
    null
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-background rounded-t-xl sm:rounded-lg p-4 sm:p-6 w-full sm:max-w-md">
        <h3 className="font-semibold mb-3 text-sm">Edit Book</h3>
        <form action={formAction} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <input name="title" defaultValue={book.title} placeholder="Title" required className="input-field" />
            <input name="author" defaultValue={book.author} placeholder="Author" required className="input-field" />
            {FEAT.translator && (
              <input
                name="translator"
                defaultValue={book.translator || ""}
                placeholder="Translator"
                className="input-field"
              />
            )}
            {FEAT.copies && (
              <input
                name="totalCopies"
                type="number"
                min={1}
                defaultValue={book.totalCopies ?? 1}
                placeholder="Total copies"
                className="input-field"
              />
            )}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <ComboboxMulti
                options={categoryOptions}
                selected={categories}
                onChange={setCategories}
                placeholder="Select categories..."
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Language</label>
              <ComboboxMulti
                options={languageOptions}
                selected={languages}
                onChange={setLanguages}
                placeholder="Select languages..."
              />
            </div>
            <input name="explanation" defaultValue={book.explanation} placeholder="Explanation of (commentator)" className="input-field sm:col-span-2" />
          </div>
          {state?.error && <p className="text-red-600 text-xs">{state.error}</p>}
          {state?.message && <p className="text-green-600 text-xs">{state.message}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="btn-primary flex-1">
              {isPending ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Lend Dialog ──────────────────────────────────────

const BORROWER_NAME_LIST = "borrower-name-list";
const BORROWER_PHONE_LIST = "borrower-phone-list";

function LendDialog({
  book,
  borrowers,
  onClose,
  onDone,
}: {
  book: Book;
  borrowers: Borrower[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  const [state, formAction, isPending] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const result = await mutate("lend", {
        id: book.id,
        lentTo: name || formData.get("lentTo"),
        borrowerContact: FEAT.copies ? contact : undefined,
        note: formData.get("note") || "",
      });
      if (result.success) {
        onDone();
        return { message: "Done" };
      }
      return { error: result.error };
    },
    null
  );

  // When the user picks a known name, prefill the phone from history.
  function handleNameChange(v: string) {
    setName(v);
    if (FEAT.copies) {
      const match = borrowers.find((b) => b.name === v && b.contact);
      if (match) setContact(match.contact);
    }
  }

  const uniqueNames = useMemo(
    () => [...new Set(borrowers.map((b) => b.name).filter(Boolean))].sort(),
    [borrowers]
  );
  const uniqueContacts = useMemo(
    () => [...new Set(borrowers.map((b) => b.contact).filter(Boolean))].sort(),
    [borrowers]
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-background rounded-t-xl sm:rounded-lg p-4 sm:p-6 w-full sm:max-w-sm">
        <datalist id={BORROWER_NAME_LIST}>
          {uniqueNames.map((n) => <option key={n} value={n} />)}
        </datalist>
        <datalist id={BORROWER_PHONE_LIST}>
          {uniqueContacts.map((n) => <option key={n} value={n} />)}
        </datalist>
        <h3 className="font-semibold mb-3 text-sm">
          Lend &ldquo;{book.title}&rdquo;
        </h3>
        {FEAT.copies && book.totalCopies > 1 && (
          <p className="text-xs text-muted-foreground mb-2">
            {book.availableCopies} of {book.totalCopies} available
          </p>
        )}
        <form action={formAction} className="space-y-3">
          <input
            name="lentTo"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Borrower name"
            required
            autoComplete="off"
            list={BORROWER_NAME_LIST}
            className="input-field w-full"
          />
          {FEAT.copies && (
            <input
              name="borrowerContact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Phone (optional)"
              autoComplete="off"
              list={BORROWER_PHONE_LIST}
              className="input-field w-full"
            />
          )}
          <input
            name="note"
            placeholder="Note (optional)"
            className="input-field w-full"
          />
          {state?.error && <p className="text-red-600 text-xs">{state.error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="btn-primary flex-1">
              {isPending ? "..." : "Lend"}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Return Dialog (copies mode) ──────────────────────

function ReturnDialog({
  book,
  onClose,
  onDone,
}: {
  book: Book;
  onClose: () => void;
  onDone: () => void;
}) {
  const [lendings, setLendings] = useState<ActiveLending[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [returning, startReturning] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/api/books/${book.id}/active-lendings`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!cancelled) setLendings(data.lendings || []);
      } catch {
        if (!cancelled) setError("Failed to load active lendings");
      }
    })();
    return () => { cancelled = true; };
  }, [book.id]);

  function handleReturn(lending: ActiveLending) {
    startReturning(async () => {
      const result = await mutate("return", { id: book.id, activeLendingId: lending.id });
      if (result.error) {
        setError(result.error);
        return;
      }
      onDone();
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-background rounded-t-xl sm:rounded-lg p-4 sm:p-6 w-full sm:max-w-sm">
        <h3 className="font-semibold mb-3 text-sm">
          Return &ldquo;{book.title}&rdquo;
        </h3>
        {lendings === null && !error && (
          <p className="text-xs text-muted-foreground">Loading…</p>
        )}
        {error && <p className="text-red-600 text-xs mb-2">{error}</p>}
        {lendings && lendings.length === 0 && (
          <p className="text-xs text-muted-foreground">No active lendings.</p>
        )}
        {lendings && lendings.length > 0 && (
          <ul className="space-y-2 mb-3">
            {lendings.map((l) => (
              <li key={l.id} className="flex items-center gap-2 border border-border rounded-lg p-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{l.borrower}</p>
                  {l.borrowerContact && (
                    <p className="text-xs text-muted-foreground truncate">{l.borrowerContact}</p>
                  )}
                </div>
                <button
                  onClick={() => handleReturn(l)}
                  disabled={returning}
                  className="btn-secondary text-xs"
                >
                  Return
                </button>
              </li>
            ))}
          </ul>
        )}
        <button type="button" onClick={onClose} className="btn-secondary w-full">
          Close
        </button>
      </div>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────

export function AdminDashboard({ initialBooks }: { initialBooks: Book[] }) {
  const [books, setBooks] = useState(initialBooks);
  const [lendingBook, setLendingBook] = useState<Book | null>(null);
  const [returningBook, setReturningBook] = useState<Book | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [isRefreshing, startRefresh] = useTransition();

  useEffect(() => {
    if (!FEAT.copies) return;
    fetch(`${API}/api/borrowers`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { borrowers: [] }))
      .then((d) => setBorrowers(d.borrowers || []))
      .catch(() => {});
  }, []);

  const categoryOptions = useMemo(
    () => [...new Set(books.flatMap((b) => (b.category || "").split(",").map((s) => s.trim())).filter(Boolean))].sort(),
    [books]
  );
  const languageOptions = useMemo(
    () => [...new Set(books.flatMap((b) => (b.language || "").split(",").map((s) => s.trim())).filter(Boolean))].sort(),
    [books]
  );

  function refresh() {
    startRefresh(async () => {
      const books = await fetchBooks();
      if (books) setBooks(books);
    });
  }

  async function fetchBooks() {
    const res = await fetch(`${API}/api/books?all=1`, { credentials: "include" });
    if (res.status === 401) {
      window.location.href = "/admin";
      return null;
    }
    const data = await res.json();
    return data.books;
  }

  function handleReturn(book: Book) {
    startRefresh(async () => {
      await mutate("return", { id: book.id });
      const books = await fetchBooks();
      if (books) setBooks(books);
    });
  }

  function handleToggleHide(book: Book) {
    startRefresh(async () => {
      await mutate(book.hidden ? "unhide" : "hide", { id: book.id });
      const books = await fetchBooks();
      if (books) setBooks(books);
    });
  }

  function handleDelete(book: Book) {
    if (!confirm(`Delete "${book.title}"?`)) return;
    startRefresh(async () => {
      await mutate("delete", { id: book.id });
      const books = await fetchBooks();
      if (books) setBooks(books);
    });
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    await fetch(`${API}/api/logout`, { method: "POST", credentials: "include" });
    window.location.href = "/admin";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-1.5 sm:gap-2">
          <Link
            href="/admin/scan"
            className="icon-btn"
            title="Bulk Scan"
          >
            <IconBarcode />
            <span className="hidden sm:inline">Scan</span>
          </Link>
          <Link
            href="/admin/lending"
            className="icon-btn"
            title="Lending History"
          >
            <IconHistory />
            <span className="hidden sm:inline">Lending</span>
          </Link>
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="icon-btn"
            title="Refresh"
          >
            <IconRefresh className={isRefreshing ? "animate-spin w-4 h-4" : "w-4 h-4"} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button onClick={handleLogout} className="icon-btn" title="Logout">
            <IconLogout />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      <AddBookForm
        onDone={refresh}
        categoryOptions={categoryOptions}
        languageOptions={languageOptions}
      />

      {/* Mobile: card list */}
      <div className="sm:hidden space-y-2">
        {books.map((book) => {
          const canLend = FEAT.copies ? book.availableCopies > 0 : !book.lentTo;
          const hasOutstanding = FEAT.copies
            ? book.availableCopies < book.totalCopies
            : !!book.lentTo;
          return (
          <div
            key={book.id}
            className={`border rounded-lg p-3 flex items-start gap-2 ${book.hidden ? "border-neutral-100 opacity-50" : "border-border"}`}
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{book.title}</p>
              <p className="text-xs text-muted-foreground truncate">{book.author}</p>
              {FEAT.translator && book.translator && (
                <p className="text-xs text-neutral-400 mt-0.5 truncate">Tr. {book.translator}</p>
              )}
              {book.explanation && (
                <p className="text-xs text-neutral-400 mt-0.5 truncate">Sharh of {book.explanation}</p>
              )}
              {FEAT.copies ? (
                book.totalCopies > 1 ? (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {book.availableCopies}/{book.totalCopies} available
                  </p>
                ) : (
                  <p className={`text-xs mt-0.5 ${book.availableCopies > 0 ? "text-green-700" : "text-amber-700"}`}>
                    {book.availableCopies > 0 ? "Available" : "Unavailable"}
                  </p>
                )
              ) : book.lentTo ? (
                <p className="text-xs text-amber-700 mt-0.5">Lent to {book.lentTo}</p>
              ) : null}
              {book.hidden ? <p className="text-xs text-neutral-400 mt-0.5">Hidden</p> : null}
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => setEditingBook(book)}
                className="p-2 rounded-lg bg-neutral-50 text-neutral-600 active:bg-neutral-100"
                title="Edit"
              >
                <IconEdit />
              </button>
              <button
                onClick={() => handleToggleHide(book)}
                className="p-2 rounded-lg bg-neutral-50 text-neutral-600 active:bg-neutral-100"
                title={book.hidden ? "Unhide" : "Hide"}
              >
                {book.hidden ? <IconEye /> : <IconEyeOff />}
              </button>
              {hasOutstanding && (
                <button
                  onClick={() => FEAT.copies ? setReturningBook(book) : handleReturn(book)}
                  className="p-2 rounded-lg bg-blue-50 text-blue-700 active:bg-blue-100"
                  title="Return"
                >
                  <IconUndo />
                </button>
              )}
              {canLend && (
                <button
                  onClick={() => setLendingBook(book)}
                  className="p-2 rounded-lg bg-amber-50 text-amber-700 active:bg-amber-100"
                  title="Lend"
                >
                  <IconLend />
                </button>
              )}
              <button
                onClick={() => handleDelete(book)}
                className="p-2 rounded-lg bg-red-50 text-red-700 active:bg-red-100"
                title="Delete"
              >
                <IconTrash />
              </button>
            </div>
          </div>
          );
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Author</th>
              {FEAT.translator && <th className="px-4 py-3 font-medium">Translator</th>}
              <th className="px-4 py-3 font-medium">Sharh of</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {books.map((book) => {
              const canLend = FEAT.copies ? book.availableCopies > 0 : !book.lentTo;
              const hasOutstanding = FEAT.copies
                ? book.availableCopies < book.totalCopies
                : !!book.lentTo;
              return (
              <tr key={book.id} className={`hover:bg-muted/30 ${book.hidden ? "opacity-50" : ""}`}>
                <td className="px-4 py-3 font-medium">{book.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{book.author}</td>
                {FEAT.translator && (
                  <td className="px-4 py-3 text-muted-foreground text-xs">{book.translator}</td>
                )}
                <td className="px-4 py-3 text-muted-foreground text-xs">{book.explanation}</td>
                <td className="px-4 py-3 text-muted-foreground">{book.category}</td>
                <td className="px-4 py-3">
                  {book.hidden ? (
                    <span className="text-xs text-neutral-400">Hidden</span>
                  ) : FEAT.copies ? (
                    <span className={`text-xs ${book.availableCopies > 0 ? "text-green-700" : "text-amber-700"}`}>
                      {book.totalCopies > 1
                        ? `${book.availableCopies}/${book.totalCopies} available`
                        : book.availableCopies > 0
                        ? "Available"
                        : "Unavailable"}
                    </span>
                  ) : book.lentTo ? (
                    <span className="text-xs text-amber-700">Lent to {book.lentTo}</span>
                  ) : (
                    <span className="text-xs text-green-700">Available</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingBook(book)}
                      className="icon-btn-sm text-neutral-600 bg-neutral-50 hover:bg-neutral-100"
                    >
                      <IconEdit />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleToggleHide(book)}
                      className="icon-btn-sm text-neutral-600 bg-neutral-50 hover:bg-neutral-100"
                    >
                      {book.hidden ? <IconEye /> : <IconEyeOff />}
                      <span>{book.hidden ? "Show" : "Hide"}</span>
                    </button>
                    {hasOutstanding && (
                      <button
                        onClick={() => FEAT.copies ? setReturningBook(book) : handleReturn(book)}
                        className="icon-btn-sm text-blue-700 bg-blue-50 hover:bg-blue-100"
                      >
                        <IconUndo />
                        <span>Return</span>
                      </button>
                    )}
                    {canLend && (
                      <button
                        onClick={() => setLendingBook(book)}
                        className="icon-btn-sm text-amber-700 bg-amber-50 hover:bg-amber-100"
                      >
                        <IconLend />
                        <span>Lend</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(book)}
                      className="icon-btn-sm text-red-700 bg-red-50 hover:bg-red-100"
                    >
                      <IconTrash />
                      <span>Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {lendingBook && (
        <LendDialog
          book={lendingBook}
          borrowers={borrowers}
          onClose={() => setLendingBook(null)}
          onDone={() => {
            setLendingBook(null);
            refresh();
          }}
        />
      )}

      {returningBook && (
        <ReturnDialog
          book={returningBook}
          onClose={() => setReturningBook(null)}
          onDone={() => {
            setReturningBook(null);
            refresh();
          }}
        />
      )}

      {editingBook && (
        <EditDialog
          book={editingBook}
          onClose={() => setEditingBook(null)}
          onDone={() => {
            setEditingBook(null);
            refresh();
          }}
          categoryOptions={categoryOptions}
          languageOptions={languageOptions}
        />
      )}
    </div>
  );
}
