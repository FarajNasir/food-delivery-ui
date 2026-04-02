import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSettings from "@/components/dashboard/admin/AdminSettings";

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");
  return <AdminSettings />;
}
