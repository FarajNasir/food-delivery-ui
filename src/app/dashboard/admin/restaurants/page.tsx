import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminRestaurants from "@/components/dashboard/admin/AdminRestaurants";

export default async function AdminRestaurantsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");
  return <AdminRestaurants />;
}
