import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LendingHistory } from "./lending-history";

export default async function LendingPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  if (!session) {
    redirect("/admin");
  }

  return <LendingHistory />;
}
