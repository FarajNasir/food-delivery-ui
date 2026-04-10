import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import CustomerShell from "@/components/dashboard/customer/CustomerShell";

const ROLE_REDIRECTS: Record<string, string> = {
  admin:  "/dashboard/admin",
  owner:  "/dashboard/owner",
  driver: "/dashboard/driver",
};

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (user && user.role !== "customer") {
    redirect(ROLE_REDIRECTS[user.role] ?? "/dashboard");
  }

  return <CustomerShell user={user}>{children}</CustomerShell>;
}
