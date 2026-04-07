"use client";

import { useActionState, useTransition } from "react";
import { useState } from "react";
import type { Book } from "@/lib/api";

async function mutate(action: string, data: Record<string, unknown>) {
  const res = await fetch("/api/books/mutate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...data }),
  });
  return res.json();
}

// ── Add Book Form ────────────────────────────────────

type AddState = { message?: string; error?: string } | null;

async function addBookAction(
  _prev: AddState,
  formData: FormData
): Promise<AddState> {
  const result = await mutate("add", {
    title: formData.get("title"),
    author: formData.get("author"),
    explanation: formData.get("explanation"),
    language: formData.get("language") || "English",
    category: formData.get("category"),
  });

  if (result.error) return { error: result.error };
  return { message: "Book added" };
}

function AddBookForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(
    async (prev: AddState, formData: FormData) => {
      const result = await addBookAction(prev, formData);
      if (result?.message) onDone();
      return result;
    },
    null
  );

  return (
    <form action={formAction} className="space-y-3 border border-neutral-200 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-sm">Add a Book</h3>
      <div className="grid grid-cols-2 gap-3">
        <input name="title" placeholder="Title" required className="input-field" />
        <input name="author" placeholder="Author" required className="input-field" />
        <input name="category" placeholder="Category" className="input-field" />
        <input name="language" placeholder="Language" defaultValue="English" className="input-field" />
        <input name="explanation" placeholder="Explanation / Notes" className="input-field col-span-2" />
      </div>
      {state?.error && <p className="text-red-600 text-sm">{state.error}</p>}
      {state?.message && <p className="text-green-600 text-sm">{state.message}</p>}
      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? "Adding..." : "Add Book"}
      </button>
    </form>
  );
}

// ── Lend Dialog ──────────────────────────────────────

function LendDialog({
  book,
  onClose,
  onDone,
}: {
  book: Book;
  onClose: () => void;
  onDone: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: AddState, formData: FormData) => {
      const result = await mutate("lend", {
        row: book.row,
        lentTo: formData.get("lentTo"),
      });
      if (result.success) {
        onDone();
        return { message: "Done" };
      }
      return { error: result.error };
    },
    null
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <h3 className="font-semibold mb-3">
          Lend &ldquo;{book.title}&rdquo;
        </h3>
        <form action={formAction} className="space-y-3">
          <input
            name="lentTo"
            placeholder="Borrower name"
            required
            autoFocus
            className="input-field w-full"
          />
          {state?.error && <p className="text-red-600 text-sm">{state.error}</p>}
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

// ── Dashboard ────────────────────────────────────────

export function AdminDashboard({ initialBooks }: { initialBooks: Book[] }) {
  const [books, setBooks] = useState(initialBooks);
  const [lendingBook, setLendingBook] = useState<Book | null>(null);
  const [isRefreshing, startRefresh] = useTransition();

  function refresh() {
    startRefresh(async () => {
      const res = await fetch("/api/books");
      const data = await res.json();
      setBooks(data.books);
    });
  }

  function handleReturn(book: Book) {
    startRefresh(async () => {
      await mutate("return", { row: book.row });
      const res = await fetch("/api/books");
      const data = await res.json();
      setBooks(data.books);
    });
  }

  function handleDelete(book: Book) {
    if (!confirm(`Delete "${book.title}"?`)) return;
    startRefresh(async () => {
      await mutate("delete", { row: book.row });
      const res = await fetch("/api/books");
      const data = await res.json();
      setBooks(data.books);
    });
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/admin";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <button onClick={refresh} disabled={isRefreshing} className="btn-secondary text-xs">
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button onClick={handleLogout} className="btn-secondary text-xs">
            Logout
          </button>
        </div>
      </div>

      <AddBookForm onDone={refresh} />

      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 text-left text-neutral-500">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Author</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {books.map((book) => (
              <tr key={book.row} className="hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium">{book.title}</td>
                <td className="px-4 py-3 text-neutral-600">{book.author}</td>
                <td className="px-4 py-3 text-neutral-500">{book.category}</td>
                <td className="px-4 py-3">
                  {book.lentTo ? (
                    <span className="text-xs text-amber-700">Lent to {book.lentTo}</span>
                  ) : (
                    <span className="text-xs text-green-700">Available</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {book.lentTo ? (
                      <button
                        onClick={() => handleReturn(book)}
                        className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        Return
                      </button>
                    ) : (
                      <button
                        onClick={() => setLendingBook(book)}
                        className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100"
                      >
                        Lend
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(book)}
                      className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {lendingBook && (
        <LendDialog
          book={lendingBook}
          onClose={() => setLendingBook(null)}
          onDone={() => {
            setLendingBook(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
