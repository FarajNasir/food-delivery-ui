"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
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
    fetchOrders();

    // ── Supabase Realtime Subscription ──────────────────────────
    const channel = supabase
      .channel("orders_realtime_customer")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload: { eventType: string; new: Order; }) => {
          console.log("🔔 Realtime update received:", payload);
          
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as Order;
            setOrders((prev) => {
              if (prev.find(o => o.id === newOrder.id)) return prev;
              return [newOrder, ...prev];
            });
            toast.info("Order update received!", { icon: "📦" });
          } 
          else if (payload.eventType === "UPDATE") {
            const updatedOrder = payload.new as Order;
            setOrders((prev) => 
              prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
            );
            
            // Check for status specific toasts
            if (updatedOrder.status === "CONFIRMED") {
              toast.success("Restaurant confirmed your order!", { icon: "✅" });
            } else if (updatedOrder.status === "OUT_FOR_DELIVERY") {
              toast.info("Your food is on the way!", { icon: "🛵" });
            }
          }
        }
      )
      .subscribe((status: string) => {
        console.log("📡 Realtime subscription status:", status);
        if (status === "CHANNEL_ERROR") {
          console.error("❌ Realtime connection failed. Checking replication settings might be needed.");
        }
      });

    return () => {
      supabase.removeChannel(channel);
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
