"use client";

import { useState, useRef, useTransition, useEffect, useCallback } from "react";
import Link from "next/link";
import { ComboboxMulti } from "@/components/combobox-multi";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.books.ammarfaisal.me";
const QUAGGA_CDN = "https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.8.4/dist/quagga.min.js";

type ScannedBook = {
  id: string;
  isbn: string;
  title: string;
  author: string;
  explanation: string;
  categories: string[];
  languages: string[];
  status: "loading" | "found" | "not-found" | "error";
  expanded: boolean;
};

function IconChevron({ className = "w-4 h-4", down = false }: { className?: string; down?: boolean }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d={down ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

function IconX({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconBack({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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

function IconSave({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconCamera({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

// Camera barcode scanner using native BarcodeDetector or quagga2 fallback
function CameraScanner({
  onDetected,
  onClose,
}: {
  onDetected: (isbn: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const scanningRef = useRef(false);
  const quaggaRef = useRef<any>(null);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (quaggaRef.current) {
      try {
        quaggaRef.current.stop();
      } catch {}
      quaggaRef.current = null;
    }
  }, []);

  const handleDetected = useCallback(
    (isbn: string) => {
      if (!scanningRef.current) return;
      scanningRef.current = false;
      stopCamera();
      onDetected(isbn);
      onClose();
    },
    [onDetected, onClose, stopCamera]
  );

  useEffect(() => {
    let animationId: number;

    async function startNativeScanner(stream: MediaStream) {
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      setIsLoading(false);
      scanningRef.current = true;

      const detector = new (window as any).BarcodeDetector({
        formats: ["ean_13", "ean_8"],
      });

      async function scan() {
        if (!scanningRef.current || !videoRef.current) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            handleDetected(barcodes[0].rawValue);
            return;
          }
        } catch {}
        animationId = requestAnimationFrame(scan);
      }
      scan();
    }

    async function startQuaggaScanner() {
      // Dynamically load quagga2 from CDN
      if (!(window as any).Quagga) {
        const script = document.createElement("script");
        script.src = QUAGGA_CDN;
        script.async = true;
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load scanner"));
          document.head.appendChild(script);
        });
      }

      const Quagga = (window as any).Quagga;
      quaggaRef.current = Quagga;

      await new Promise<void>((resolve, reject) => {
        Quagga.init(
          {
            inputStream: {
              type: "LiveStream",
              target: videoRef.current!.parentElement,
              constraints: {
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            },
            decoder: {
              readers: ["ean_reader", "ean_8_reader"],
            },
            locate: true,
          },
          (err: any) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      setIsLoading(false);
      scanningRef.current = true;
      Quagga.start();

      Quagga.onDetected((result: any) => {
        if (result?.codeResult?.code) {
          handleDetected(result.codeResult.code);
        }
      });
    }

    async function init() {
      try {
        // Check for native BarcodeDetector
        if ("BarcodeDetector" in window) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
          });
          streamRef.current = stream;
          await startNativeScanner(stream);
        } else {
          // Fallback to quagga2
          await startQuaggaScanner();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Camera access denied");
        setIsLoading(false);
      }
    }

    init();

    return () => {
      cancelAnimationFrame(animationId);
      stopCamera();
    };
  }, [handleDetected, stopCamera]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 bg-black/80">
        <h2 className="text-white font-medium">Scan ISBN Barcode</h2>
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="text-white p-2"
        >
          <IconX className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            Loading camera...
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-red-400 p-4 text-center">
            {error}
          </div>
        )}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        {/* Scan guide overlay */}
        {!error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-32 border-2 border-white/50 rounded-lg">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white rounded-tl" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white rounded-tr" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white rounded-bl" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white rounded-br" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-black/80 text-center text-white/70 text-sm">
        Point camera at the barcode on the book
      </div>
    </div>
  );
}

export function BulkScan({
  initialCategories,
  initialLanguages,
}: {
  initialCategories: string[];
  initialLanguages: string[];
}) {
  const [books, setBooks] = useState<ScannedBook[]>([]);
  const [isbnInput, setIsbnInput] = useState("");
  const [isSaving, startSaving] = useTransition();
  const [saveResult, setSaveResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Collect all categories from initial + any added in this session
  const allCategories = [
    ...new Set([
      ...initialCategories,
      ...books.flatMap((b) => b.categories),
    ]),
  ].sort();

  const allLanguages = [
    ...new Set([
      ...initialLanguages,
      ...books.flatMap((b) => b.languages),
    ]),
  ].sort();

  async function lookupISBN(isbn: string) {
    const cleanISBN = isbn.replace(/[^0-9X]/gi, "");
    if (!cleanISBN || (cleanISBN.length !== 10 && cleanISBN.length !== 13)) {
      return;
    }

    // Check if already scanned
    if (books.some((b) => b.isbn === cleanISBN)) {
      return;
    }

    const id = crypto.randomUUID();
    const newBook: ScannedBook = {
      id,
      isbn: cleanISBN,
      title: "",
      author: "",
      explanation: "",
      categories: [],
      languages: ["English"],
      status: "loading",
      expanded: true,
    };

    setBooks((prev) => [newBook, ...prev]);

    try {
      const res = await fetch(`${API}/api/isbn/${cleanISBN}`, { credentials: "include" });
      const data = await res.json();

      if (res.ok) {
        setBooks((prev) =>
          prev.map((b) =>
            b.id === id
              ? {
                  ...b,
                  title: data.title || "",
                  author: data.author || "",
                  explanation: data.publishDate ? `Published: ${data.publishDate}` : "",
                  status: "found",
                }
              : b
          )
        );
      } else {
        setBooks((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: "not-found" } : b))
        );
      }
    } catch {
      setBooks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "error" } : b))
      );
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      lookupISBN(isbnInput);
      setIsbnInput("");
    }
  }

  function updateBook(id: string, updates: Partial<ScannedBook>) {
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  }

  function removeBook(id: string) {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }

  function toggleExpanded(id: string) {
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, expanded: !b.expanded } : b))
    );
  }

  function saveAll() {
    const validBooks = books.filter((b) => b.title.trim());
    if (validBooks.length === 0) return;

    startSaving(async () => {
      const res = await fetch(`${API}/api/books/mutate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "bulk-add",
          books: validBooks.map((b) => ({
            title: b.title,
            author: b.author,
            explanation: b.explanation,
            category: b.categories.join(", "),
            language: b.languages.join(", "),
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveResult({ success: true, message: `Added ${data.added} book${data.added !== 1 ? "s" : ""}` });
        setBooks([]);
      } else {
        setSaveResult({ success: false, message: data.error || "Failed to save" });
      }
    });
  }

  const validCount = books.filter((b) => b.title.trim()).length;

  return (
    <div className="pb-24 sm:pb-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="icon-btn">
            <IconBack />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <h1 className="text-lg sm:text-2xl font-bold">Bulk Scan</h1>
        </div>
      </div>

      {/* Camera Scanner */}
      {showScanner && (
        <CameraScanner
          onDetected={(isbn) => {
            lookupISBN(isbn);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* ISBN Input */}
      <div className="mb-4 sm:mb-6">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={isbnInput}
            onChange={(e) => setIsbnInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Type or scan ISBN..."
            className="input-field flex-1"
            autoFocus
          />
          <button
            onClick={() => setShowScanner(true)}
            className="btn-secondary flex items-center gap-1.5"
            title="Scan with camera"
          >
            <IconCamera className="w-5 h-5" />
            <span className="hidden sm:inline">Scan</span>
          </button>
          <button
            onClick={() => {
              lookupISBN(isbnInput);
              setIsbnInput("");
              inputRef.current?.focus();
            }}
            className="btn-primary"
            disabled={!isbnInput.trim()}
          >
            Add
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          Use a barcode scanner or type ISBN manually. Press Enter to add.
        </p>
      </div>

      {saveResult && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            saveResult.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          {saveResult.message}
        </div>
      )}

      {/* Scanned Books List */}
      {books.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <IconBarcode className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No books scanned yet</p>
          <p className="text-xs mt-1">Scan a barcode or type an ISBN to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {books.map((book) => (
            <div
              key={book.id}
              className={`border rounded-lg overflow-hidden ${
                book.status === "loading"
                  ? "border-neutral-200 bg-neutral-50"
                  : book.status === "not-found" || book.status === "error"
                  ? "border-amber-200 bg-amber-50"
                  : "border-border"
              }`}
            >
              {/* Header row */}
              <div
                className="flex items-center gap-2 p-3 cursor-pointer"
                onClick={() => toggleExpanded(book.id)}
              >
                <IconChevron
                  className={`w-4 h-4 text-muted-foreground transition-transform ${
                    book.expanded ? "rotate-90" : ""
                  }`}
                  down={book.expanded}
                />
                <div className="flex-1 min-w-0">
                  {book.status === "loading" ? (
                    <p className="text-sm text-muted-foreground animate-pulse">
                      Looking up ISBN {book.isbn}...
                    </p>
                  ) : (
                    <>
                      <p className="font-medium text-sm truncate">
                        {book.title || <span className="text-muted-foreground italic">No title</span>}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {book.author || "Unknown author"} &middot; ISBN: {book.isbn}
                        {book.status === "not-found" && (
                          <span className="text-amber-600 ml-2">(Not found - enter manually)</span>
                        )}
                      </p>
                    </>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBook(book.id);
                  }}
                  className="p-1.5 rounded hover:bg-neutral-100 text-muted-foreground"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>

              {/* Expanded edit form */}
              {book.expanded && book.status !== "loading" && (
                <div className="px-3 pb-3 pt-0 border-t border-border/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    <input
                      value={book.title}
                      onChange={(e) => updateBook(book.id, { title: e.target.value })}
                      placeholder="Title"
                      className="input-field"
                    />
                    <input
                      value={book.author}
                      onChange={(e) => updateBook(book.id, { author: e.target.value })}
                      placeholder="Author"
                      className="input-field"
                    />
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                      <ComboboxMulti
                        options={allCategories}
                        selected={book.categories}
                        onChange={(cats) => updateBook(book.id, { categories: cats })}
                        placeholder="Select categories..."
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Language</label>
                      <ComboboxMulti
                        options={allLanguages}
                        selected={book.languages}
                        onChange={(langs) => updateBook(book.id, { languages: langs })}
                        placeholder="Select languages..."
                      />
                    </div>
                    <input
                      value={book.explanation}
                      onChange={(e) => updateBook(book.id, { explanation: e.target.value })}
                      placeholder="Notes"
                      className="input-field sm:col-span-2"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Save button - fixed on mobile */}
      {books.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border sm:static sm:border-0 sm:p-0 sm:mt-4">
          <button
            onClick={saveAll}
            disabled={isSaving || validCount === 0}
            className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <IconSave />
            {isSaving ? "Saving..." : `Save ${validCount} Book${validCount !== 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}
