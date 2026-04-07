import { cookies } from "next/headers";
import { fetchBooks } from "@/lib/api";
import { LoginForm } from "./login-form";
import { AdminDashboard } from "./dashboard";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isLoggedIn =
    cookieStore.get("admin_session")?.value === process.env.ADMIN_PASSWORD;

  if (!isLoggedIn) {
    return (
      <div className="max-w-sm mx-auto mt-20">
        <h1 className="text-xl font-bold mb-4">Admin Login</h1>
        <LoginForm />
      </div>
    );
  }

  const { books } = await fetchBooks();

  return <AdminDashboard initialBooks={books} />;
}
