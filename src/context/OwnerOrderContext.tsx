"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
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
}

const OwnerOrderContext = createContext<OwnerOrderContextType | undefined>(undefined);
const supabase = createClient();

export function OwnerOrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<OwnerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/owner/orders", { cache: "no-store" });
      const data = await res.json();
      if (data.data) {
        setOrders(data.data.orders);
      }
    } catch (err) {
      console.error("Failed to fetch owner orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    // ── Supabase Realtime Subscription ──────────────────────────
    // Note: Owners listen for any orders in restaurants they own.
    // For now, we subscribe to all order updates and the context filters them locally
    // or we'll rely on the API for the initial fetch and Realtime for the "instant" feel.
    const channel = supabase
      .channel("owner_orders_realtime_dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload: { eventType: string; new: any; }) => {
          console.log("🔔 [OWNER] Realtime update:", payload);
          // When a new order arrives, just refresh to get full item details
          fetchOrders(); 
          
          if (payload.eventType === "INSERT") {
            toast.info("A new order just landed at your restaurant!", { icon: "🔔" });
          } else if (payload.eventType === "UPDATE") {
            const updatedOrder = payload.new as any;
            if (updatedOrder.status === "PAID") {
              toast.success("Payment confirmed for an order!", { icon: "💰" });
            }
          }
        }
      )
      .subscribe((status: string) => {
        console.log("📡 [OWNER] Realtime status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
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
    <OwnerOrderContext.Provider value={{ orders, loading, refreshOrders: fetchOrders, updateOrderStatus }}>
      {children}
    </OwnerOrderContext.Provider>
  );
}

export const useOwnerOrders = () => {
  const context = useContext(OwnerOrderContext);
  if (!context) throw new Error("useOwnerOrders must be used within an OwnerOrderProvider");
  return context;
};
