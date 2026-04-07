import { apiFetch } from "@/lib/db";

export async function GET() {
  const res = await apiFetch("/api/authors");
  const data = await res.json();
  return Response.json(data);
}
