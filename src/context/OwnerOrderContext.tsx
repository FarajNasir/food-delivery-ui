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

  const fetchOrders = useCallback(async (retryCount = 0) => {
    const currentSession = useAuthStore.getState().session;
    if (!currentSession) {
        setOrders([]);
        setLoading(false);
        return;
    }

    try {
      const res = await fetch(`/api/owner/orders?t=${Date.now()}`, { 
        cache: "no-store",
        headers: {
            "Authorization": `Bearer ${currentSession.access_token}`
        }
      });
      
      if (res.status === 401) {
        if (retryCount < 1) {
          await new Promise(r => setTimeout(r, 500));
          return fetchOrders(retryCount + 1);
        }
        setOrders([]);
        return;
      }

      const data = await res.json();
      if (data.data) {
        const fetchedOrders = data.data.orders as OwnerOrder[];
        setOrders(fetchedOrders);
        if (data.data.ownedRestaurantIds) {
          setOwnedRestaurantIds(data.data.ownedRestaurantIds);
          ownedRestaurantIdsRef.current = data.data.ownedRestaurantIds;
        }
      }
    } catch (err) {
      console.error("Failed to fetch owner orders:", err);
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
      setLoading(true);
      
      // Verify role and start session
      fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      })
      .then(res => res.json())
      .then(async (data) => {
        if (data.data?.role === "owner" || data.data?.role === "admin") {
          await fetchOrders();
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
          cleanup();
          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
      });
    } else {
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
