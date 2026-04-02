import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import OwnerReports from "@/components/dashboard/owner/OwnerReports";

export default async function OwnerReportsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner") redirect("/dashboard");
  return <OwnerReports />;
}
