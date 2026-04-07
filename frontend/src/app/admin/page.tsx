import { cookies } from "next/headers";
import { apiFetch } from "@/lib/db";
import { LoginForm } from "./login-form";
import { AdminDashboard } from "./dashboard";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  if (!session) {
    return (
      <div className="max-w-sm mx-auto mt-12 sm:mt-20 px-2">
        <h1 className="text-xl font-bold mb-4">Admin Login</h1>
        <LoginForm />
      </div>
    );
  }

  const res = await apiFetch("/api/books");
  const { books } = await res.json();

  return <AdminDashboard initialBooks={books} />;
}
