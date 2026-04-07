import { fetchBooks } from "@/lib/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const available = searchParams.get("available") === "1";
  const data = await fetchBooks(available);
  return Response.json(data);
}
