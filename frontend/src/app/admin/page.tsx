import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { LoginForm } from "./login-form";
import { AdminDashboard } from "./dashboard";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isLoggedIn =
    cookieStore.get("admin_session")?.value === process.env.ADMIN_PASSWORD;

  if (!isLoggedIn) {
    return (
      <div className="max-w-sm mx-auto mt-12 sm:mt-20 px-2">
        <h1 className="text-xl font-bold mb-4">Admin Login</h1>
        <LoginForm />
      </div>
    );
  }

  const allBooks = await db.select().from(books);

  return <AdminDashboard initialBooks={allBooks} />;
}
