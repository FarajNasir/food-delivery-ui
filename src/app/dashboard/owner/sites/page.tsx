import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import OwnerSites from "@/components/dashboard/owner/OwnerSites";

export default async function OwnerSitesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner") redirect("/dashboard");
  return <OwnerSites />;
}
