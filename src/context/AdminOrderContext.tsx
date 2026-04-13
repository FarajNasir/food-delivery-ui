"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useAdminStore, type AdminOrder } from "@/store/useAdminStore";
export type { AdminOrder };
import { useFcmToken } from "@/hooks/useFcmToken";

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
  const { 
    orders, 
    stats, 
    isLoading: loading, 
    refreshOrders 
  } = useAdminStore();
  
  const { session, isReady, user } = useAuthStore();
  const userId = user?.id;

  // Real-time updates for Admin
  useFcmToken(userId);

  useEffect(() => {
    if (isReady && session) {
      console.log("[AdminOrderContext] Syncing with admin store...");
      refreshOrders();
    }
  }, [isReady, session, refreshOrders]);

  return (
    <AdminOrderContext.Provider
      value={{
        orders,
        stats,
        loading,
        refreshOrders,
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
