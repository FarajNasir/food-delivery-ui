import { create } from "zustand";
import { customerService } from "@/services/customer.service";
import { toast } from "sonner";
import type { Order } from "@/types/api.types";

/**
 * useOrderStore.ts - Real-time order management and history tracking.
 */

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  pagination: {
    total: number;
    page: number;
    limit: number;
  };

  // Actions
  refreshOrders: (page?: number, scope?: "all" | "active" | "past", limit?: number) => Promise<void>;
  updateOrderStatus: (id: string, status: string, paymentIntentId?: string) => Promise<void>;
  updateSingleOrder: (order: Partial<Order> & { id: string }) => void;
  reorder: (orderId: string) => Promise<{ success: boolean; orderId?: string }>;
}

export const useOrderStore = create<OrderState>()((set, get) => ({
  orders: [],
  isLoading: false,
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
  },

  refreshOrders: async (page, scope = "all", limit = 20) => {
    set({ isLoading: true });
    try {
      const currentPage = page ?? get().pagination.page;
      const { success, data } = await customerService.getOrders({ page: currentPage, scope, limit });
      if (success && data) {
        set({ 
          orders: data.orders,
          pagination: data.pagination ?? get().pagination
        });
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

  updateSingleOrder: async (updatedOrder) => {
    const state = get();
    const exists = state.orders.find((o) => o.id === updatedOrder.id);

    if (exists) {
      set({
        orders: state.orders.map((o) =>
          o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o
        ),
      });
      console.log(`[useOrderStore] Updated local order ${updatedOrder.id} status to ${updatedOrder.status}`);
    } else {
      // Order is missing from current view (e.g. on another page or brand new)
      console.log(`[useOrderStore] Order ${updatedOrder.id} missing from local state. Fetching from server...`);
      const { success, data } = await customerService.getOrderById(updatedOrder.id);
      
      if (success && data) {
        set({
          orders: [data, ...get().orders].filter((o, idx, self) => 
            self.findIndex(other => other.id === o.id) === idx
          )
        });
        console.log(`[useOrderStore] Successfully fetched and prepended missing order ${updatedOrder.id}`);
      } else {
        // Fallback: full refresh if single fetch fails
        await get().refreshOrders();
      }
    }
  },
  reorder: async (orderId: string) => {
    set({ isLoading: true });
    try {
      const { success, data } = await customerService.reorder(orderId);
      if (success && data?.order) {
        toast.success("Order duplicated successfully!");
        // We don't manually add to state, as we want to maintain the correct sort order.
        // refreshOrders will fetch the new list.
        await get().refreshOrders();
        return { success: true, orderId: data.order.id };
      } else {
        toast.error("Failed to reorder. Please try again.");
        return { success: false };
      }
    } catch {
      toast.error("A network error occurred.");
      return { success: false };
    } finally {
      set({ isLoading: false });
    }
  },
}));
