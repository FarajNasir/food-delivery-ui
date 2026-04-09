import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminReviews from "@/components/dashboard/admin/AdminReviews";

export default async function AdminReviewsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");
  
  return <AdminReviews />;
}
