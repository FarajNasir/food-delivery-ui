import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import OwnerSettings from "@/components/dashboard/owner/OwnerSettings";

export default async function OwnerSettingsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner") redirect("/dashboard");
  return <OwnerSettings />;
}
