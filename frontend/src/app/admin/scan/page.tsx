import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BulkScan } from "./bulk-scan";
import { apiFetch } from "@/lib/db";

export default async function ScanPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  if (!session) {
    redirect("/admin");
  }

  // Get existing categories and languages for suggestions
  const res = await apiFetch("/api/books?all=1", {
    headers: { Cookie: `admin_session=${session.value}` },
  });
  const { books } = await res.json();

  const categories = [...new Set(
    books.flatMap((b: { category?: string }) =>
      (b.category || "").split(",").map((s: string) => s.trim()).filter(Boolean)
    )
  )].sort() as string[];

  const languages = [...new Set(
    books.flatMap((b: { language?: string }) =>
      (b.language || "").split(",").map((s: string) => s.trim()).filter(Boolean)
    )
  )].sort() as string[];

  const authors = [...new Set(
    books
      .map((b: { author?: string }) => (b.author || "").trim())
      .filter(Boolean)
  )].sort() as string[];

  return (
    <BulkScan
      initialCategories={categories}
      initialLanguages={languages}
      initialAuthors={authors}
    />
  );
}
