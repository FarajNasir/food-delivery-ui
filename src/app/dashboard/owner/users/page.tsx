import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import OwnerUsers from "@/components/dashboard/owner/OwnerUsers";

export default async function OwnerUsersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner") redirect("/dashboard");
  return <OwnerUsers />;
}
