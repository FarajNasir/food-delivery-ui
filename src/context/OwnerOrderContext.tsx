"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { toast } from "sonner";

export interface OwnerOrder {
  id: string;
  userId: string;
  restaurantId: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  items: {
    id: string;
    quantity: number;
    price: string;
    menuItem: {
      name: string;
      imageUrl?: string;
    };
  }[];
  restaurant: {
    name: string;
  };
}

interface OwnerOrderContextType {
  orders: OwnerOrder[];
  loading: boolean;
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (id: string, status: string) => Promise<boolean>;
  ownedRestaurantIds: string[];
}

const OwnerOrderContext = createContext<OwnerOrderContextType | undefined>(undefined);
const supabase = createClient();

import { useAuthStore } from "@/store/useAuthStore";

export function OwnerOrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<OwnerOrder[]>([]);
  const [ownedRestaurantIds, setOwnedRestaurantIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { session, isReady, user } = useAuthStore();
  const userId = user?.id;
  const ownedRestaurantIdsRef = useRef<string[]>([]);

  const fetchOrders = useCallback(async (tokenOverride?: string, retryCount = 0) => {
    const sessionToUse = tokenOverride 
      ? { access_token: tokenOverride } 
      : useAuthStore.getState().session;

    if (!sessionToUse?.access_token) {
        console.log("[OwnerOrderContext] No session available for fetching owner orders.");
        setOrders([]);
        setLoading(false);
        return;
    }

    console.log(`[OwnerOrderContext] Fetching owner orders (retry: ${retryCount})...`);

    try {
      const res = await fetch(`/api/owner/orders?t=${Date.now()}`, { 
        cache: "no-store",
        headers: {
            "Authorization": `Bearer ${sessionToUse.access_token}`
        }
      });
      
      if (res.status === 401) {
        console.warn(`[OwnerOrderContext] 401 Unauthorized received (retry: ${retryCount})`);
        if (retryCount < 1) {
          await new Promise(r => setTimeout(r, 500));
          return fetchOrders(tokenOverride, retryCount + 1);
        }
        
        console.warn("[OwnerOrderContext] Session unauthorized after retry. Stopping fetch.");
        return;
      }

      const data = await res.json();
      const fetchedOrders = data.data?.orders || (Array.isArray(data.data) ? data.data : null);

      if (Array.isArray(fetchedOrders)) {
        console.log(`[OwnerOrderContext] Successfully fetched ${fetchedOrders.length} orders.`);
        setOrders(fetchedOrders as OwnerOrder[]);
        
        // Handle metadata
        const restaurantIds = data.data?.ownedRestaurantIds || [];
        if (restaurantIds.length > 0) {
          setOwnedRestaurantIds(restaurantIds);
          ownedRestaurantIdsRef.current = restaurantIds;
        }
      } else {
        console.warn("[OwnerOrderContext] No valid orders array found in response:", data);
        if (data.success) setOrders([]);
      }
    } catch (err) {
      console.error("[OwnerOrderContext] Failed to fetch owner orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;

    let heartbeatInterval: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      setOrders([]);
      setOwnedRestaurantIds([]);
      ownedRestaurantIdsRef.current = [];
    };

    if (session) {
      console.log("[OwnerOrderContext] Auth detected, initiating fetch sequence...");
      setLoading(true);
      
      // Verify role and start session
      fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      })
      .then(res => res.json())
      .then(async (data) => {
        if (data.data?.role === "owner" || data.data?.role === "admin") {
          await fetchOrders(session.access_token);
          if (!heartbeatInterval) {
            heartbeatInterval = setInterval(() => {
              const s = useAuthStore.getState().session;
              if (s) {
                fetch("/api/user/heartbeat", { 
                  method: "POST",
                  headers: { "Authorization": `Bearer ${s.access_token}` }
                }).catch(() => { });
              }
            }, 30000);
          }
        } else {
          console.log("[OwnerOrderContext] Non-owner role, skipping fetch.");
          cleanup();
          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
      });
    } else {
      console.log("[OwnerOrderContext] No session, clearing state.");
      cleanup();
      setLoading(false);
    }

    return () => {
      cleanup();
    };
  }, [session, isReady, fetchOrders]);

  useEffect(() => {
    const handleRefresh = () => fetchOrders();
    window.addEventListener("REFRESH_ORDERS", handleRefresh);

    return () => {
      window.removeEventListener("REFRESH_ORDERS", handleRefresh);
    };
  }, [fetchOrders]);

  const updateOrderStatus = async (id: string, status: string) => {
    const previousOrders = [...orders];
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      const currentSession = useAuthStore.getState().session;
      const res = await fetch(`/api/owner/orders/${id}/status`, {
        method: "PATCH",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": currentSession ? `Bearer ${currentSession.access_token}` : ""
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setOrders(previousOrders);
        toast.error("Failed to update status");
        return false;
      }
      toast.success(`Order status updated to ${status}`);
      return true;
    } catch (err) {
      setOrders(previousOrders);
      toast.error("Network error: Failed to update status");
      return false;
    }
  };

  return (
    <OwnerOrderContext.Provider value={{ orders, loading, refreshOrders: fetchOrders, updateOrderStatus, ownedRestaurantIds }}>
      {children}
    </OwnerOrderContext.Provider>
  );
}

export const useOwnerOrders = () => {
  const context = useContext(OwnerOrderContext);
  if (!context) throw new Error("useOwnerOrders must be used within an OwnerOrderProvider");
  return context;
};
