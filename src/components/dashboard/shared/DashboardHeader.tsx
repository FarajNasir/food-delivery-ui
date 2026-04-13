"use client";

import { useRouter } from "next/navigation";
import React, { useState, useRef } from "react";
import { Menu, LogOut, Bell } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { useOwnerStore } from "@/store/useOwnerStore";
import { toast } from "sonner";
import NotificationDropdown from "./NotificationDropdown";

const roleBadge: Record<string, string> = {
  owner:    "bg-purple-100 text-purple-700",
  admin:    "bg-blue-100 text-blue-700",
  driver:   "bg-amber-100 text-amber-700",
  customer: "bg-orange-100 text-orange-600",
};

export default function DashboardHeader({
  user,
  onMenuClick,
  hideMenuButton = false,
}: {
  user: SessionUser;
  onMenuClick: () => void;
  hideMenuButton?: boolean;
}) {
  const router = useRouter();
  const { orders } = useOwnerStore();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);

  const pendingOrdersCount = user.role === "owner" 
    ? orders.filter(o => ["PENDING_CONFIRMATION", "PAID"].includes(o.status)).length
    : 0;

  const handleLogout = async () => {
    await useAuthStore.getState().logout();
    toast.success("Logged out.");
    router.push("/login");
  };

  return (
    <header
      className="h-16 flex items-center justify-between px-4 md:px-6 shrink-0 relative"
      style={{
        background:   "var(--dash-header-bg)",
        borderBottom: "1px solid var(--dash-header-border)",
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className={`${hideMenuButton ? "hidden" : "lg:hidden"} p-2 rounded-lg hover:bg-gray-100 transition-colors`}
        >
          <Menu className="w-5 h-5" style={{ color: "var(--dash-text-secondary)" }} />
        </button>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>
            Hi, {user.name.split(" ")[0]}
          </p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${roleBadge[user.role]}`}>
            {user.role}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button 
            ref={bellRef}
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
          >
            <Bell className="w-5 h-5" style={{ color: "var(--dash-text-secondary)" }} />
            {pendingOrdersCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse" />
            )}
          </button>
          
          <NotificationDropdown 
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
          />
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
          style={{ color: "var(--dash-text-secondary)" }}
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">Logout</span>
        </button>
      </div>
    </header>
  );
}
