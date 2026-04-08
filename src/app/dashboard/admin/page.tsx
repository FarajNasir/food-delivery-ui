import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminOverview from "@/components/dashboard/admin/AdminOverview";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");
  return <AdminOverview />;
}
