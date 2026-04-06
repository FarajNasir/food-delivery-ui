import { create } from "zustand";
import { customerService } from "@/services/customer.service";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Order } from "@/types/api.types";

/**
 * useOrderStore.ts - Real-time order management and history tracking.
 */

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  
  // Actions
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (id: string, status: string, paymentIntentId?: string) => Promise<void>;
  subscribeToUpdates: () => () => void;
}

const supabase = createClient();

export const useOrderStore = create<OrderState>()((set, get) => ({
  orders: [],
  isLoading: false,

  refreshOrders: async () => {
    set({ isLoading: true });
    try {
      const { success, data } = await customerService.getOrders();
      if (success && data) {
        set({ orders: data.orders });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  updateOrderStatus: async (id, status, paymentIntentId) => {
    const previousOrders = [...get().orders];
    
    // Optimistic update
    set({
      orders: previousOrders.map((o) => 
        o.id === id ? { ...o, status, paymentIntentId } : o
      ),
    });

    const res = await customerService.updateOrderStatus(id, status, paymentIntentId);
    if (!res.success) {
      toast.error("Failed to update order status on server");
      set({ orders: previousOrders }); // Rollback
    }
  },

  subscribeToUpdates: () => {
    const channel = supabase
      .channel("orders_realtime_customer_store")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        async (payload: { eventType: string; new: Order; }) => {
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as Order;
            set((state) => {
              if (state.orders.find(o => o.id === newOrder.id)) return state;
              return { orders: [newOrder, ...state.orders] };
            });
          } 
          else if (payload.eventType === "UPDATE") {
            const updatedOrder = payload.new as Order;
            set((state) => ({
              orders: state.orders.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
            }));
            
            // 100% Foolproof Guard: Only show customer status toasts if we are physically on the Customer Dashboard
            const isCustomerPage = typeof window !== "undefined" && window.location.pathname.includes("/dashboard/customer");
            
            // Optimization: Only show these customer-facing toasts on customer pages
            if (isCustomerPage) {
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

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
