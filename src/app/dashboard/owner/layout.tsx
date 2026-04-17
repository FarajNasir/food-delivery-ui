import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { OwnerOrderProvider } from "@/context/OwnerOrderContext";

const ROLE_REDIRECTS: Record<string, string> = {
  admin:  "/dashboard/admin",
  customer: "/dashboard/customer",
  driver: "/dashboard/driver",
};

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (user && user.role !== "owner") {
    redirect(ROLE_REDIRECTS[user.role] ?? "/dashboard");
  }

  return (
    <OwnerOrderProvider>
      {children}
    </OwnerOrderProvider>
  );
}
