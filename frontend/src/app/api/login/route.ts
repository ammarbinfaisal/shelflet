import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: "Wrong password" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set("admin_session", password, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  });

  return Response.json({ success: true });
}
