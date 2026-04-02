import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import CustomerHome from "@/components/dashboard/customer/CustomerHome";

export default async function CustomerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <CustomerHome user={user} />;
}
