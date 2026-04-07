import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.books.ammarfaisal.me";

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  const res = await fetch(`${API_BASE}/api/lending-logs`, {
    headers: session ? { Cookie: `admin_session=${session.value}` } : {},
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}
