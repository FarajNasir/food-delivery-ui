import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminUsers from "@/components/dashboard/admin/AdminUsers";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");
  return <AdminUsers currentUserId={user.id} />;
}
