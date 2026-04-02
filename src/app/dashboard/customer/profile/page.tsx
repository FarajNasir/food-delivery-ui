import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import CustomerProfile from "@/components/dashboard/customer/CustomerProfile";

export default async function CustomerProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <CustomerProfile user={user} />;
}
