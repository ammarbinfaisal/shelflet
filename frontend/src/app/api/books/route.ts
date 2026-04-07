import { apiFetch } from "@/lib/db";

export async function GET() {
  const res = await apiFetch("/api/books");
  const data = await res.json();
  return Response.json(data);
}
