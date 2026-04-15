import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BorrowerDetail } from "./borrower-detail";

export default async function BorrowerPage({
  params,
}: {
  params: Promise<{ borrower: string }>;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  if (!session) {
    redirect("/admin");
  }

  const { borrower } = await params;

  return <BorrowerDetail borrowerName={decodeURIComponent(borrower)} />;
}
