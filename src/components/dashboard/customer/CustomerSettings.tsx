"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, Shield, Trash2, LogOut,
  ChevronRight, Smartphone,
} from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import ConfirmModal from "@/components/shared/ConfirmModal";

function Toggle({ on, onToggle, accentColor }: { on: boolean; onToggle: () => void; accentColor: string }) {
  return (
    <button
      onClick={onToggle}
      className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0"
      style={{ background: on ? accentColor : "#d1d5db" }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: on ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}

export default function CustomerSettings() {
  const { site } = useSite();
  const { gradientFrom, accent } = site.theme;
  const router = useRouter();
  const [notifOrders, setNotifOrders] = useState(true);
  const [smsUpdates, setSmsUpdates] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await useAuthStore.getState().logout();
    toast.success("Logged out.");
    router.push("/login");
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setShowDeleteModal(false);
    try {
      const res = await authApi.deleteAccount();
      if (res.success) {
        toast.success("Your account has been deleted.");
        await useAuthStore.getState().logout();
        router.push("/login");
      } else {
        toast.error(res.error || "Failed to delete account.");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const rows: {
    label: string;
    sub?: string;
    action: React.ReactNode;
    danger?: boolean;
    onClick?: () => void;
  }[] = [
      {
        label: "Order updates",
        sub: "Notify when order status changes",
        action: <Toggle on={notifOrders} onToggle={() => setNotifOrders(!notifOrders)} accentColor={gradientFrom} />,
      },
      {
        label: "SMS updates",
        sub: "Text messages for delivery tracking",
        action: <Toggle on={smsUpdates} onToggle={() => setSmsUpdates(!smsUpdates)} accentColor={gradientFrom} />,
      },
      {
        label: "Privacy",
        sub: "Review our terms and data policy",
        onClick: () => router.push("/privacy"),
        action: <ChevronRight className="w-4 h-4" style={{ color: "var(--dash-text-secondary)" }} />,
      },
      {
        label: loggingOut ? "Logging out…" : "Log out",
        sub: "Sign out of your account",
        danger: true,
        onClick: handleLogout,
        action: <ChevronRight className="w-4 h-4 text-red-400" />,
      },
      {
        label: deleting ? "Deleting account…" : "Delete account",
        sub: "Permanently remove your data",
        danger: true,
        onClick: handleDeleteAccount,
        action: <ChevronRight className="w-4 h-4 text-red-400" />,
      },
    ];

  const icons = [Bell, Smartphone, Shield, LogOut, Trash2];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-5">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--dash-text-primary)" }}>
          Settings
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--dash-text-secondary)" }}>
          Manage your preferences and account
        </p>
      </div>

      {/* Single compact list */}
      <div
        className="rounded-3xl px-5 divide-y"
        style={{
          background: "var(--dash-card)",
          border: "1px solid var(--dash-card-border)",
        }}
      >
        {rows.map((row, i) => {
          const Icon = icons[i];
          const content = (
            <div className="flex items-center gap-4 py-4">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: row.danger ? "#fef2f2" : "var(--dash-bg)" }}
              >
                <Icon className="w-4 h-4" style={{ color: row.danger ? "#ef4444" : "var(--dash-text-secondary)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: row.danger ? "#ef4444" : "var(--dash-text-primary)" }}>
                  {row.label}
                </p>
                {row.sub && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--dash-text-secondary)" }}>
                    {row.sub}
                  </p>
                )}
              </div>
              {row.action}
            </div>
          );

          return row.onClick ? (
            <button
              key={row.label}
              onClick={row.onClick}
              disabled={loggingOut}
              className="w-full text-left disabled:opacity-60"
            >
              {content}
            </button>
          ) : (
            <div key={row.label}>{content}</div>
          );
        })}
      </div>

      {/* Version */}
      <p className="text-center text-xs pb-2" style={{ color: "var(--dash-text-secondary)" }}>
        Eats Platform v1.0.0
      </p>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Account?"
        message="Are you sure you want to delete your account? This action is permanent and cannot be undone."
        confirmText="Delete My Account"
        loading={deleting}
        danger={true}
      />
    </div>
  );
}
