export interface Book {
  row: number;
  title: string;
  author: string;
  explanation: string;
  language: string;
  category: string;
  lentTo: string;
}

export interface BooksResponse {
  books: Book[];
  count: number;
}

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL!;
const API_TOKEN = process.env.API_TOKEN!;

export async function fetchBooks(
  availableOnly = false
): Promise<BooksResponse> {
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set("action", "books");
  if (availableOnly) url.searchParams.set("available", "1");

  const res = await fetch(url.toString(), { cache: "no-store" });
  return res.json();
}

export async function postAction(
  action: string,
  data: Record<string, unknown>
) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, action, token: API_TOKEN }),
  });
  return res.json();
}
