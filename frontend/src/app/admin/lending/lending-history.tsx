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

function NoteSection({ log, onNoteAdded }: { log: LendingLog; onNoteAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function addNote() {
    if (!note.trim()) return;
    setSaving(true);
    await fetch(`${API}/api/lending-logs/${log.id}/note`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ note: note.trim() }),
    });
    setNote("");
    setOpen(false);
    setSaving(false);
    onNoteAdded();
  }

  const notes = (log.note || "")
    .split("\n")
    .filter(Boolean);

  return (
    <div className="mt-2">
      {notes.length > 0 && (
        <div className="space-y-1 mb-2">
          {notes.map((n, i) => {
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
      {open ? (
        <div className="flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note..."
            className="flex-1 px-2 py-1 text-xs border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-neutral-400"
            onKeyDown={(e) => e.key === "Enter" && addNote()}
            autoFocus
          />
          <button
            onClick={addNote}
            disabled={saving || !note.trim()}
            className="px-2 py-1 text-xs bg-neutral-900 text-white rounded disabled:opacity-50"
          >
            {saving ? "..." : "Add"}
          </button>
          <button
            onClick={() => { setOpen(false); setNote(""); }}
            className="px-2 py-1 text-xs text-neutral-500 hover:text-neutral-700"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-neutral-400 hover:text-neutral-600"
        >
          + Add note
        </button>
      )}
    </div>
  );
}

export function LendingHistory() {
  const [logs, setLogs] = useState<LendingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "lend" | "return">("all");

  const fetchLogs = useCallback(async () => {
    const res = await fetch(`${API}/api/lending-logs`, { credentials: "include" });
    const data = await res.json();
    setLogs(data.logs || []);
    setLoading(false);
  }, []);

  useMountEffect(fetchLogs);

  const filtered = filter === "all" ? logs : logs.filter((l) => l.action === filter);

  // Group by date
  const grouped = new Map<string, LendingLog[]>();
  for (const log of filtered) {
    const date = formatDate(log.createdAt);
    if (!grouped.has(date)) grouped.set(date, []);
    grouped.get(date)!.push(log);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold">Lending History</h1>
          <p className="text-xs text-neutral-500 mt-0.5">{logs.length} entries</p>
        </div>
        <Link
          href="/admin"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(["all", "lend", "return"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filter === f
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {f === "all" ? "All" : f === "lend" ? "Lent out" : "Returned"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-neutral-400 text-sm py-8 text-center">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-neutral-400 text-sm py-8 text-center">No lending history yet.</p>
      ) : (
        <div className="space-y-6">
          {[...grouped.entries()].map(([date, dateLogs]) => (
            <div key={date}>
              <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
                {date}
              </h2>
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
                          {log.action === "lend" ? (
                            <>
                              Lent to <span className="text-amber-700 font-medium">{log.borrower}</span>
                            </>
                          ) : (
                            <>
                              Returned from <span className="text-blue-700 font-medium">{log.borrower}</span>
                            </>
                          )}
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
                    <NoteSection log={log} onNoteAdded={fetchLogs} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
