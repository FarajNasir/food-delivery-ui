"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export interface AdminOrder {
  id: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  deliveryAddress: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  restaurant: {
    id: string;
    name: string;
  };
}

interface AdminStats {
  totalRevenue: string;
  totalOrders: number;
  pendingOrders: number;
}

interface AdminOrderContextType {
  orders: AdminOrder[];
  stats: AdminStats;
  loading: boolean;
  refreshOrders: () => Promise<void>;
}

const AdminOrderContext = createContext<AdminOrderContextType | undefined>(undefined);

export function AdminOrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalRevenue: "0",
    totalOrders: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const { session, isReady, user } = useAuthStore();

  const fetchOrders = useCallback(async () => {
    const currentSession = useAuthStore.getState().session;
    if (!currentSession) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/orders?t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error || "Unknown error";
        console.warn(`[AdminOrderContext] Fetch skipped/failed (${res.status}):`, msg);
        setLoading(false);
        return;
      }

      if (data.data) {
        setOrders(data.data.orders);
        setStats(data.data.stats);
      }
    } catch (err) {
      console.error("[AdminOrderContext] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch when auth is ready
  useEffect(() => {
    if (isReady && session) {
      setLoading(true);
      fetchOrders();
    } else if (isReady) {
      setLoading(false);
    }
  }, [isReady, session, fetchOrders]);

  // Listen for REFRESH_ORDERS event (triggered by FCM or manual actions)
  useEffect(() => {
    const handleRefresh = () => {
      console.log("[AdminOrderContext] Refreshing orders via global event...");
      fetchOrders();
    };
    window.addEventListener("REFRESH_ORDERS", handleRefresh);

    return () => {
      window.removeEventListener("REFRESH_ORDERS", handleRefresh);
    };
  }, [fetchOrders]);

  return (
    <AdminOrderContext.Provider
      value={{
        orders,
        stats,
        loading,
        refreshOrders: fetchOrders,
      }}
    >
      {children}
    </AdminOrderContext.Provider>
  );
}

export const useAdminOrders = () => {
  const context = useContext(AdminOrderContext);
  if (!context) {
    throw new Error("useAdminOrders must be used within an AdminOrderProvider");
  }
  return context;
};
