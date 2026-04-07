import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.books.ammarfaisal.me";

export async function POST(request: Request) {
  const body = await request.json();
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  const res = await fetch(`${API_BASE}/api/books/mutate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Cookie: `admin_session=${session.value}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}
