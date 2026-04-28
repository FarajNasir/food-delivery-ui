"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useFcmToken } from "@/hooks/useFcmToken";

import { type Order } from "@/types/api.types";
export { type Order };

interface OrderContextType {
  orders: Order[];
  loading: boolean;
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
  refreshOrders: (page?: number, scope?: "all" | "active" | "past", limit?: number) => Promise<void>;
  updateOrderStatus: (id: string, status: string, paymentIntentId?: string) => Promise<void>;
  reorder: (orderId: string) => Promise<{ success: boolean; orderId?: string }>;
}

import { useAuthStore } from "@/store/useAuthStore";
import { useOrderStore } from "@/store/useOrderStore";

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const { 
    orders, 
    isLoading: loading, 
    pagination,
    refreshOrders, 
    updateOrderStatus: storeUpdateOrderStatus,
    reorder: storeReorder
  } = useOrderStore();
  
  const { session, isReady, user } = useAuthStore();
  const userId = user?.id;

  // Register FCM Token & Listener
  useFcmToken(userId);

  useEffect(() => {
    if (!isReady || !session) return;

    refreshOrders(1, "all").catch(() => {});
  }, [session, isReady, refreshOrders]);

  const updateOrderStatus = async (id: string, status: string, paymentIntentId?: string) => {
    await storeUpdateOrderStatus(id, status, paymentIntentId);
  };

  return (
    <OrderContext.Provider value={{ orders, loading, pagination, refreshOrders, updateOrderStatus, reorder: storeReorder }}>
      {children}
    </OrderContext.Provider>
  );
}

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useOrders must be used within an OrderProvider");
  return context;
};
