"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useMountEffect } from "@/lib/hooks";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.books.ammarfaisal.me";

type LendingLog = {
  id: number;
  bookId: number;
  bookTitle: string;
  borrower: string;
  action: string;
  note: string;
  createdAt: string;
};

type CurrentBook = {
  id: number;
  bookId: number;
  bookTitle: string;
  bookAuthor: string;
  borrower: string;
  borrowerContact: string;
  note: string;
  lentAt: string;
};

type BorrowerData = {
  borrower: string;
  logs: LendingLog[];
  currentBooks: CurrentBook[];
  stats: {
    totalBorrowed: number;
    totalReturned: number;
    currentlyHas: number;
  };
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function daysSince(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function IconBack({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function IconBook({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

export function BorrowerDetail({ borrowerName }: { borrowerName: string }) {
  const [data, setData] = useState<BorrowerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/borrowers/${encodeURIComponent(borrowerName)}`, {
        credentials: "include",
      });
      if (res.status === 401) {
        window.location.href = "/admin";
        return;
      }
      if (!res.ok) {
        setError("Failed to load borrower data");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError("Failed to load borrower data");
    } finally {
      setLoading(false);
    }
  }, [borrowerName]);

  useMountEffect(fetchData);

  if (loading) {
    return (
      <div className="text-neutral-400 text-sm py-8 text-center">Loading...</div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <Link
          href="/admin/lending"
          className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900 mb-4"
        >
          <IconBack />
          Back to Lending History
        </Link>
        <div className="text-red-600 text-sm py-8 text-center">{error || "No data found"}</div>
      </div>
    );
  }

  // Group logs by date
  const grouped = new Map<string, LendingLog[]>();
  for (const log of data.logs) {
    const date = formatDate(log.createdAt);
    if (!grouped.has(date)) grouped.set(date, []);
    grouped.get(date)!.push(log);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/admin/lending"
            className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 mb-1"
          >
            <IconBack className="w-3 h-3" />
            Lending History
          </Link>
          <h1 className="text-lg sm:text-2xl font-bold">{data.borrower}</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border border-neutral-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{data.stats.totalBorrowed}</p>
          <p className="text-xs text-neutral-500">Total Borrowed</p>
        </div>
        <div className="border border-neutral-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{data.stats.totalReturned}</p>
          <p className="text-xs text-neutral-500">Total Returned</p>
        </div>
        <div className="border border-neutral-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{data.stats.currentlyHas}</p>
          <p className="text-xs text-neutral-500">Currently Has</p>
        </div>
      </div>

      {/* Currently Borrowed Books */}
      {data.currentBooks.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <IconBook className="w-4 h-4 text-amber-600" />
            Currently Borrowed ({data.currentBooks.length})
          </h2>
          <div className="space-y-2">
            {data.currentBooks.map((book) => {
              const days = daysSince(book.lentAt);
              return (
                <div
                  key={book.id}
                  className="border border-amber-200 bg-amber-50 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{book.bookTitle}</p>
                      <p className="text-xs text-neutral-500">{book.bookAuthor}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-neutral-400">
                        {formatDate(book.lentAt)}
                      </p>
                      <p className={`text-xs font-medium ${days > 30 ? "text-red-600" : days > 14 ? "text-amber-600" : "text-neutral-500"}`}>
                        {days} day{days !== 1 ? "s" : ""} ago
                      </p>
                    </div>
                  </div>
                  {book.note && (
                    <p className="text-xs text-neutral-500 mt-2 bg-white/50 rounded px-2 py-1">
                      {book.note}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lending History */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Lending History</h2>
        {data.logs.length === 0 ? (
          <p className="text-neutral-400 text-sm py-4 text-center">No history yet.</p>
        ) : (
          <div className="space-y-4">
            {[...grouped.entries()].map(([date, dateLogs]) => (
              <div key={date}>
                <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
                  {date}
                </h3>
                <div className="space-y-2">
                  {dateLogs.map((log) => (
                    <div
                      key={log.id}
                      className="border border-neutral-200 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{log.bookTitle}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {log.action === "lend" ? "Borrowed" : "Returned"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-neutral-400">
                            {formatTime(log.createdAt)}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              log.action === "lend"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {log.action === "lend" ? "OUT" : "IN"}
                          </span>
                        </div>
                      </div>
                      {log.note && (
                        <div className="mt-2 space-y-1">
                          {log.note.split("\n").filter(Boolean).map((n, i) => {
                            const match = n.match(/^\[(.+?)\]\s*(.*)/);
                            if (match) {
                              return (
                                <div key={i} className="text-xs text-neutral-500 bg-neutral-50 rounded px-2 py-1">
                                  <span className="text-neutral-400">{formatDate(match[1])} {formatTime(match[1])}</span>
                                  <span className="mx-1.5">&middot;</span>
                                  <span className="text-neutral-600">{match[2]}</span>
                                </div>
                              );
                            }
                            return (
                              <div key={i} className="text-xs text-neutral-600 bg-neutral-50 rounded px-2 py-1">
                                {n}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
