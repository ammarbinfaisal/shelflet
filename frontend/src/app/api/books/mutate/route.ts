import { cookies } from "next/headers";
import { postAction } from "@/lib/api";

async function isAuthed(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === process.env.ADMIN_PASSWORD;
}

export async function POST(request: Request) {
  if (!(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action, ...data } = body;

  if (!action) {
    return Response.json({ error: "action is required" }, { status: 400 });
  }

  const result = await postAction(action, data);
  return Response.json(result);
}
