import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.books.ammarfaisal.me";

export async function POST(request: Request) {
  const body = await request.json();

  const res = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (res.ok && data.success) {
    // Extract the admin_session cookie from the API response
    const setCookieHeader = res.headers.get("set-cookie");
    if (setCookieHeader) {
      const match = setCookieHeader.match(/admin_session=([^;]+)/);
      if (match) {
        const cookieStore = await cookies();
        cookieStore.set("admin_session", match[1], {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      }
    }
  }

  return Response.json(data, { status: res.status });
}
