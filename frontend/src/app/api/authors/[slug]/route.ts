import { apiFetch } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await apiFetch(`/api/authors/${encodeURIComponent(slug)}`);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
