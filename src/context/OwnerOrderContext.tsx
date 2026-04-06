"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthChangeEvent, RealtimeChannel, Session } from "@supabase/supabase-js";
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

export function OwnerOrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<OwnerOrder[]>([]);
  const [ownedRestaurantIds, setOwnedRestaurantIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>();
  const ownedRestaurantIdsRef = useRef<string[]>([]);

  const fetchOrders = useCallback(async (targetOrderId?: string, isRetry = false) => {
    try {
      const res = await fetch(`/api/owner/orders?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.data) {
        const fetchedOrders = data.data.orders as OwnerOrder[];
        setOrders(fetchedOrders);
        if (data.data.ownedRestaurantIds) {
          setOwnedRestaurantIds(data.data.ownedRestaurantIds);
          ownedRestaurantIdsRef.current = data.data.ownedRestaurantIds;
        }
        if (targetOrderId && !fetchedOrders.some(o => o.id === targetOrderId) && !isRetry) {
          setTimeout(() => fetchOrders(targetOrderId, true), 1500);
        }
      }
    } catch (err) {
      console.error("Failed to fetch owner orders:", err);
    } finally {
      if (!isRetry) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let heartbeatInterval: NodeJS.Timeout | null = null;

    const startSession = async () => {
      await fetchOrders();
      if (!heartbeatInterval) {
        heartbeatInterval = setInterval(() => {
          fetch("/api/user/heartbeat", { method: "POST" }).catch(() => {});
        }, 30000); // 30s heartbeat
      }
    };

    const cleanup = () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      setOrders([]);
      setOwnedRestaurantIds([]);
      ownedRestaurantIdsRef.current = [];
    };

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
        if (session) {
          setUserId(session.user.id);
          try {
            const authRes = await fetch("/api/auth/me");
            if (authRes.ok) {
              const { data: userData } = await authRes.json();
              if (userData?.role === "owner") {
                startSession();
              } else {
                cleanup();
              }
            }
          } catch (err) {
            console.error("Auth verify error:", err);
          }
        }
      } else if (event === "SIGNED_OUT") {
        cleanup();
        setUserId(undefined);
      }
    });

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        try {
          const authRes = await fetch("/api/auth/me");
          if (authRes.ok) {
            const { data: userData } = await authRes.json();
            if (userData?.role === "owner") {
              startSession();
            } else {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        } catch (err) {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    init();

    const handleRefresh = () => fetchOrders();
    window.addEventListener("REFRESH_ORDERS", handleRefresh);

    return () => {
      authListener.unsubscribe();
      cleanup();
      window.removeEventListener("REFRESH_ORDERS", handleRefresh);
    };
  }, [fetchOrders]);

  const updateOrderStatus = async (id: string, status: string) => {
    const previousOrders = [...orders];
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      const res = await fetch(`/api/owner/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
