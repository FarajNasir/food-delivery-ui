"use client";

import { AdminOrderProvider } from "@/context/AdminOrderContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminOrderProvider>{children}</AdminOrderProvider>;
}
