const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.books.ammarfaisal.me";

export async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  return res;
}
