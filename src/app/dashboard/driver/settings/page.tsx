import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DriverSettings from "@/components/dashboard/driver/DriverSettings";

export default async function DriverSettingsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "driver") redirect("/dashboard");
  return <DriverSettings user={user} />;
}
