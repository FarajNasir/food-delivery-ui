import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DriverEarnings from "@/components/dashboard/driver/DriverEarnings";

export default async function DriverEarningsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "driver") redirect("/dashboard");
  return <DriverEarnings />;
}
