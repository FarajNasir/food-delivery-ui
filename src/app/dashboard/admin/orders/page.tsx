import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminOrders from "@/components/dashboard/admin/AdminOrders";

export default async function AdminOrdersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");
  return <AdminOrders />;
}
