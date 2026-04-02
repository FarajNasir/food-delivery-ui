import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import OwnerRestaurants from "@/components/dashboard/owner/OwnerRestaurants";

export default async function OwnerRestaurantsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner") redirect("/dashboard");
  return <OwnerRestaurants />;
}
