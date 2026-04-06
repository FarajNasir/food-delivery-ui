"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthChangeEvent, RealtimeChannel, Session } from "@supabase/supabase-js";
import { toast } from "sonner";

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

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const data = await res.json();
      if (data.data) {
        setOrders(data.data.orders);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const setupRealtime = async () => {
      await fetchOrders();

      if (channel) supabase.removeChannel(channel);

      channel = supabase
        .channel("orders_realtime_customer")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders" },
          (payload: { eventType: string; new: Order; }) => {
            if (payload.eventType === "INSERT") {
              const newOrder = payload.new as Order;
              setOrders((prev) => {
                if (prev.find(o => o.id === newOrder.id)) return prev;
                return [newOrder, ...prev];
              });
            } 
            else if (payload.eventType === "UPDATE") {
              const updatedOrder = payload.new as Order;
              setOrders((prev) => 
                prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
              );
              
              // 100% Foolproof Guard: Only show toasts if we are actually on the Customer Dashboard AND the user is a customer
              const isCustomerPage = typeof window !== "undefined" && window.location.pathname.includes("/dashboard/customer");
              
              if (isCustomerPage && userRole === "customer") {
                if (updatedOrder.status === "CONFIRMED") {
                  toast.success("Restaurant confirmed your order!", { icon: "✅" });
                } else if (updatedOrder.status === "OUT_FOR_DELIVERY") {
                  toast.info("Your food is on the way!", { icon: "🛵" });
                }
              }
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
    };

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
        if (session) {
          try {
            const authRes = await fetch("/api/auth/me");
            if (authRes.ok) {
              const { data: userData } = await authRes.json();
              setUserRole(userData?.role);
            }
          } catch (err) {}
          setupRealtime();
        }
      } else if (event === "SIGNED_OUT") {
        cleanup();
        setUserRole(null);
      }
    });

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const authRes = await fetch("/api/auth/me");
          if (authRes.ok) {
            const { data: userData } = await authRes.json();
            setUserRole(userData?.role);
          }
        } catch (err) {
          // Fallback to null
        }
        setupRealtime();
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

  const updateOrderStatus = async (id: string, status: string, paymentIntentId?: string) => {
    // 1. Store previous state for rollback
    const previousOrders = [...orders];

    // 2. Optimistically update local state
    setOrders((prev) => 
      prev.map((o) => (o.id === id ? { ...o, status, paymentIntentId } : o))
    );

    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, paymentIntentId }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        // Rollback on failure
        setOrders(previousOrders);
        toast.error(data.message || "Failed to update order status");
        return;
      }
      
      // Realtime will handle the sync, but we already updated optimistically
    } catch (err) {
      // Rollback on network error
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
