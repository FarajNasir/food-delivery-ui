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
  reorder: (orderId: string) => Promise<{ success: boolean; orderId?: string }>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);
const supabase = createClient();

import { useAuthStore } from "@/store/useAuthStore";
import { useOrderStore } from "@/store/useOrderStore";

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const { 
    orders, 
    isLoading: loading, 
    refreshOrders, 
    updateOrderStatus: storeUpdateOrderStatus,
    reorder: storeReorder
  } = useOrderStore();
  
  const { session, isReady, user } = useAuthStore();
  const userId = user?.id;

  // Register FCM Token & Listener
  useFcmToken(userId);

  useEffect(() => {
    if (!isReady) return;

    if (session) {
      console.log("[OrderContext] Syncing with store...");
      refreshOrders();
    }
  }, [session, isReady, refreshOrders]);

  const updateOrderStatus = async (id: string, status: string, paymentIntentId?: string) => {
    await storeUpdateOrderStatus(id, status, paymentIntentId);
  };

  return (
    <OrderContext.Provider value={{ orders, loading, refreshOrders, updateOrderStatus, reorder: storeReorder }}>
      {children}
    </OrderContext.Provider>
  );
}

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useOrders must be used within an OrderProvider");
  return context;
};
