import { create } from "zustand";
import { ownerService } from "@/services/owner.service";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

/**
 * useOwnerStore.ts - Real-time dashboard for restaurant owners.
 * Manages live orders and kitchen state transitions.
 */

export interface OwnerOrder {
  id: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  restaurant: { name: string };
  items: {
    quantity: number;
    price: string;
    menuItem: { name: string };
  }[];
}

interface OwnerState {
  orders: OwnerOrder[];
  isLoading: boolean;
  
  // Actions
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (id: string, status: string) => Promise<boolean>;
  subscribeToUpdates: (restaurantId?: string) => () => void;
}

const supabase = createClient();

export const useOwnerStore = create<OwnerState>()((set, get) => ({
  orders: [],
  isLoading: false,

  refreshOrders: async () => {
    set({ isLoading: true });
    try {
      const { success, data, error } = await ownerService.getLiveOrders();
      if (success && data?.orders) {
        set({ orders: data.orders });
      } else if (!success) {
        toast.error(error || "Failed to sync kitchen data");
      }
    } finally {
      set({ isLoading: false });
    }
  },

  updateOrderStatus: async (id, status) => {
    const previousOrders = [...get().orders];
    
    // Optimistic update
    set({
      orders: previousOrders.map((o) => (o.id === id ? { ...o, status } : o)),
    });

    const res = await ownerService.updateOrderStatus(id, status);
    if (!res.success) {
      toast.error(res.error || "Failed to update order status");
      set({ orders: previousOrders }); // Rollback
      return false;
    }
    
    toast.success(`Order #${id.slice(0, 6)} updated to ${status}`);
    return true;
  },

  subscribeToUpdates: (restaurantId) => {
    const channel = supabase
      .channel("owner_live_orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload: any) => {
          // If we have a specific restaurantId, filter the realtime event
          if (restaurantId && payload.new.restaurantId !== restaurantId) return;

          if (payload.eventType === "INSERT") {
            // New order - refresh to get full relations (items/restaurant)
            get().refreshOrders();
            toast.info("🔔 New order received!", { icon: "🔥" });
          } 
          else if (payload.eventType === "UPDATE") {
            const updatedOrder = payload.new as OwnerOrder;
            set((state) => ({
              orders: state.orders.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
