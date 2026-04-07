import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

  switch (action) {
    case "add": {
      await db.insert(books).values({
        title: data.title,
        author: data.author,
        explanation: data.explanation || "",
        language: data.language || "English",
        category: data.category || "",
      });
      return Response.json({ success: true });
    }
    case "delete": {
      if (!data.id) return Response.json({ error: "id required" }, { status: 400 });
      await db.delete(books).where(eq(books.id, data.id));
      return Response.json({ success: true });
    }
    case "lend": {
      if (!data.id || !data.lentTo)
        return Response.json({ error: "id and lentTo required" }, { status: 400 });
      await db.update(books).set({ lentTo: data.lentTo }).where(eq(books.id, data.id));
      return Response.json({ success: true });
    }
    case "return": {
      if (!data.id) return Response.json({ error: "id required" }, { status: 400 });
      await db.update(books).set({ lentTo: "" }).where(eq(books.id, data.id));
      return Response.json({ success: true });
    }
    default:
      return Response.json({ error: "Unknown action" }, { status: 400 });
  }
}
