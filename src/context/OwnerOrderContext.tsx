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
  
  const ownedRestaurantIdsRef = useRef<string[]>([]);
  
  const fetchOrders = useCallback(async (targetOrderId?: string, isRetry = false) => {
    try {
      console.log(`🔄 [OWNER] Syncing data... (isRetry: ${isRetry})`);
      // Cache busting with timestamp ensures the browser never serves stale data
      const res = await fetch(`/api/owner/orders?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      
      if (data.data) {
        const fetchedOrders = data.data.orders as OwnerOrder[];
        setOrders(fetchedOrders);
        console.log(`✅ [OWNER] Fetched ${fetchedOrders.length} orders.`);

        if (data.data.ownedRestaurantIds) {
          setOwnedRestaurantIds(data.data.ownedRestaurantIds);
          ownedRestaurantIdsRef.current = data.data.ownedRestaurantIds;
        }

        // If we were expecting a specific new order, verify it's there
        if (targetOrderId) {
          const found = fetchedOrders.some(o => o.id === targetOrderId);
          if (found) {
            console.log(`🎯 [OWNER] New order ${targetOrderId} successfully found in list.`);
          } else if (!isRetry) {
            console.warn(`⚠️ [OWNER] New order ${targetOrderId} NOT found yet. Retrying in 1.5s...`);
            setTimeout(() => fetchOrders(targetOrderId, true), 1500);
          } else {
            console.error(`❌ [OWNER] New order ${targetOrderId} still missing after retry.`);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch owner orders:", err);
    } finally {
      if (!isRetry) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const setupRealtime = async () => {
      await fetchOrders();

      if (channel) supabase.removeChannel(channel);
      
      channel = supabase
        .channel("owner_orders_realtime_dashboard")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders" },
          async (payload: any) => {
            if (payload.eventType === "INSERT") {
              const newOrder = payload.new;
              if (ownedRestaurantIdsRef.current.includes(newOrder.restaurant_id)) {
                toast.info("A new order just landed at your restaurant!", { icon: "🔔" });
                fetchOrders(newOrder.id);
              }
            } else if (payload.eventType === "UPDATE") {
              const row = payload.new;
              const mappedRow = {
                id: row.id,
                userId: row.user_id,
                restaurantId: row.restaurant_id,
                status: row.status,
                totalAmount: row.total_amount,
                updatedAt: row.updated_at,
              };
              
              setOrders((prev) => 
                 prev.map((o) => (o.id === row.id ? { ...o, ...mappedRow } : o))
              );

              if (row.status === "PAID") {
                // Only show payment toasts to owners on the owner dashboard
                const isOwnerPage = typeof window !== "undefined" && window.location.pathname.includes("/dashboard/owner");
                if (isOwnerPage) {
                  toast.success("Payment confirmed for an order!", { icon: "💰" });
                }
              }
            } else if (payload.eventType === "DELETE") {
              setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    };

    const cleanup = () => {
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
      setOrders([]);
      setOwnedRestaurantIds([]);
      ownedRestaurantIdsRef.current = [];
    };

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
        if (session) {
          try {
            const authRes = await fetch("/api/auth/me");
            if (authRes.ok) {
              const { data: userData } = await authRes.json();
              if (userData?.role === "owner") {
                setupRealtime();
              } else {
                cleanup();
              }
            }
          } catch (err) {
            // Silently handle error
          }
        }
      } else if (event === "SIGNED_OUT") {
        cleanup();
      }
    });

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const authRes = await fetch("/api/auth/me");
          if (authRes.ok) {
            const { data: userData } = await authRes.json();
            if (userData?.role === "owner") {
              setupRealtime();
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

    return () => {
      authListener.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const updateOrderStatus = async (id: string, status: string) => {
    // 1. Store previous state for rollback
    const previousOrders = [...orders];

    // 2. Optimistically update local state
    setOrders((prev) => 
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );

    try {
      const res = await fetch(`/api/owner/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        // Rollback on failure
        setOrders(previousOrders);
        toast.error(data.message || "Failed to update status");
        return false;
      }

      toast.success(`Order status updated to ${status}`);
      return true;
    } catch (err) {
      // Rollback on network error
      setOrders(previousOrders);
      toast.error("Network error: Failed to update order status");
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
