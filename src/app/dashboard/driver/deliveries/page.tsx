import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DriverDeliveries from "@/components/dashboard/driver/DriverDeliveries";

export default async function DriverDeliveriesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "driver") redirect("/dashboard");
  return <DriverDeliveries />;
}
