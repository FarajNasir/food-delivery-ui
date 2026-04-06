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

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  // Register FCM Token & Listener
  useFcmToken(userId);

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
    const startSession = async () => {
      await fetchOrders();
    };

    const cleanup = () => {
      setOrders([]);
    };

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
        if (session) {
          setUserId(session.user.id);
          try {
            const authRes = await fetch("/api/auth/me");
            if (authRes.ok) {
              const { data: userData } = await authRes.json();
              setUserRole(userData?.role);
            }
          } catch (err) {}
          startSession();
        }
      } else if (event === "SIGNED_OUT") {
        cleanup();
        setUserRole(null);
        setUserId(undefined);
      }
    });

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        try {
          const authRes = await fetch("/api/auth/me");
          if (authRes.ok) {
            const { data: userData } = await authRes.json();
            setUserRole(userData?.role);
          }
        } catch (err) {
          // Fallback to null
        }
        startSession();
      } else {
        setLoading(false);
      }
    };

    init();

    // Listen for custom refresh events from FCM hook
    const handleRefresh = () => fetchOrders();
    window.addEventListener("REFRESH_ORDERS", handleRefresh);

    return () => {
      authListener.unsubscribe();
      cleanup();
      window.removeEventListener("REFRESH_ORDERS", handleRefresh);
    };
  }, [fetchOrders]);

  const updateOrderStatus = async (id: string, status: string, paymentIntentId?: string) => {
    const previousOrders = [...orders];

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
