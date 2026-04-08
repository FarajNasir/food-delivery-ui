"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useFcmToken } from "@/hooks/useFcmToken";

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  paymentIntentId?: string | null;
  restaurant?: {
    name: string;
  };
  items?: {
    id: string;
    quantity: number;
    price: string;
    menuItem: {
      name: string;
      imageUrl?: string;
    };
  }[];
}

interface OrderContextType {
  orders: Order[];
  loading: boolean;
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (id: string, status: string, paymentIntentId?: string) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);
const supabase = createClient();

import { useAuthStore } from "@/store/useAuthStore";

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { session, isReady, user } = useAuthStore();
  const userId = user?.id;

  // Register FCM Token & Listener
  useFcmToken(userId);

  const fetchOrders = useCallback(async (tokenOverride?: string, retryCount = 0): Promise<void> => {
    const sessionToUse = tokenOverride 
      ? { access_token: tokenOverride } 
      : useAuthStore.getState().session;

    if (!sessionToUse?.access_token) {
        console.log("[OrderContext] No session available for fetching orders.");
        setOrders([]);
        setLoading(false);
        return;
    }

    console.log(`[OrderContext] Fetching orders (retry: ${retryCount})...`);

    try {
      const res = await fetch("/api/orders", { 
        cache: "no-store",
        headers: {
            "Authorization": `Bearer ${sessionToUse.access_token}`
        }
      });
      
      if (res.status === 401) {
        console.warn(`[OrderContext] 401 Unauthorized received (retry: ${retryCount})`);
        // With Bearer tokens, 401 usually means genuinely unauthorized.
        // We still retry once just in case the token was refreshed mid-flight.
        if (retryCount < 1) {
          await new Promise(r => setTimeout(r, 500));
          return fetchOrders(tokenOverride, retryCount + 1);
        }
        
        console.warn("[OrderContext] Session unauthorized after retry. Stopping fetch.");
        return;
      }

      const data = await res.json();
      
      // Robust parsing: handle { data: { orders: [] } } and { data: [] }
      const fetchedOrders = data.data?.orders || (Array.isArray(data.data) ? data.data : null);

      if (Array.isArray(fetchedOrders)) {
        console.log(`[OrderContext] Successfully fetched ${fetchedOrders.length} orders.`);
        setOrders(fetchedOrders);
      } else {
        console.warn("[OrderContext] No valid orders array found in response:", data);
        // Only clear if we are certain it's valid empty data or if success is true
        if (data.success) setOrders([]);
      }
    } catch (err) {
      console.error("[OrderContext] Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;

    if (session) {
      console.log("[OrderContext] Auth detected, initiating fetch sequence...");
      setLoading(true);
      
      // Fetch role info (best-effort)
      fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.data?.role) setUserRole(data.data.role);
      })
      .catch(() => {});

      fetchOrders(session.access_token);
    } else {
      console.log("[OrderContext] No session, clearing orders.");
      setOrders([]);
      setUserRole(null);
      setLoading(false);
    }
  }, [session, isReady, fetchOrders]);

  useEffect(() => {
    const handleRefresh = () => fetchOrders();
    window.addEventListener("REFRESH_ORDERS", handleRefresh);

    return () => {
      window.removeEventListener("REFRESH_ORDERS", handleRefresh);
    };
  }, [fetchOrders]);

  const updateOrderStatus = async (id: string, status: string, paymentIntentId?: string) => {
    const previousOrders = [...orders];

    setOrders((prev) => 
      prev.map((o) => (o.id === id ? { ...o, status, paymentIntentId } : o))
    );

    try {
      const currentSession = useAuthStore.getState().session;
      const res = await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": currentSession ? `Bearer ${currentSession.access_token}` : ""
        },
        body: JSON.stringify({ status, paymentIntentId }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        setOrders(previousOrders);
        toast.error(data.message || "Failed to update order status");
        return;
      }
    } catch (err) {
      setOrders(previousOrders);
      toast.error("Network error: Failed to update order status");
    }
  };

  return (
    <OrderContext.Provider value={{ orders, loading, refreshOrders: fetchOrders, updateOrderStatus }}>
      {children}
    </OrderContext.Provider>
  );
}

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useOrders must be used within an OrderProvider");
  return context;
};
