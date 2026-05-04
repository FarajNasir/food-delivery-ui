"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import type { SessionUser } from "@/lib/auth";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import CustomerBottomNav from "@/components/dashboard/customer/CustomerBottomNav";

export default function DashboardLayout({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isReady, profile } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // If auth state is resolved and no profile is found, the user is logged out.
    // Redirecting to login ensures they can't stay on the dashboard.
    if (isReady && !profile) {
      const currentPath = window.location.pathname + window.location.search;
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [isReady, profile, router]);

  useEffect(() => {
    // Handle BFCache (Back-Forward Cache) — if the page is loaded from cache
    // when clicking the back button, force a reload to re-run auth checks.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const isCustomer = user.role === "customer";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--dash-bg)" }}>
      {/* Sidebar — always visible on desktop; on mobile only for non-customer roles */}
      <DashboardSidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile overlay — only for non-customer (customer uses bottom nav) */}
      {sidebarOpen && !isCustomer && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          hideMenuButton={isCustomer}
        />
        <main className={`flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 ${isCustomer ? "pb-24 lg:pb-8" : ""}`}>
          {children}
        </main>
      </div>

      {/* Customer mobile bottom tab navigation */}
      {isCustomer && <CustomerBottomNav />}
    </div>
  );
}
