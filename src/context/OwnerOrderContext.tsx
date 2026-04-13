"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useFcmToken } from "@/hooks/useFcmToken";
import { useAuthStore } from "@/store/useAuthStore";
import { useOwnerStore, OwnerOrder } from "@/store/useOwnerStore";

interface OwnerOrderContextType {
  orders: OwnerOrder[];
  loading: boolean;
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (id: string, status: string) => Promise<boolean>;
  ownedRestaurantIds: string[];
}

const OwnerOrderContext = createContext<OwnerOrderContextType | undefined>(undefined);

export function OwnerOrderProvider({ children }: { children: React.ReactNode }) {
  const {
    orders,
    ownedRestaurantIds,
    isLoading: loading,
    refreshOrders,
    updateOrderStatus: storeUpdateOrderStatus
  } = useOwnerStore();

  const { session, isReady, user, role } = useAuthStore();
  const userId = user?.id;

  // Register FCM
  useFcmToken(userId);

  useEffect(() => {
    if (!isReady) return;

    let heartbeatInterval: NodeJS.Timeout | null = null;

    if (session && (role === "owner" || role === "admin")) {
      console.log("[OwnerOrderContext] Syncing with owner store...");
      refreshOrders().catch(() => { });

      const sendHeartbeat = () => {
        const s = useAuthStore.getState().session;
        if (s) {
          fetch("/api/user/heartbeat", {
            method: "POST",
            headers: { "Authorization": `Bearer ${s.access_token}` }
          }).catch(() => { });
        }
      };

      if (!heartbeatInterval) {
        sendHeartbeat(); // Fire immediately on mount
        heartbeatInterval = setInterval(sendHeartbeat, 60000); // Increased to 60s
      }
    }

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [session, isReady, refreshOrders]);

  const updateOrderStatus = async (id: string, status: string) => {
    return await storeUpdateOrderStatus(id, status);
  };

  return (
    <OwnerOrderContext.Provider value={{ orders, loading, refreshOrders, updateOrderStatus, ownedRestaurantIds }}>
      {children}
    </OwnerOrderContext.Provider>
  );
}

export const useOwnerOrders = () => {
  const context = useContext(OwnerOrderContext);
  if (!context) throw new Error("useOwnerOrders must be used within an OwnerOrderProvider");
  return context;
};
