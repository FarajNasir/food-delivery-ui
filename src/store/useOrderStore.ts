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

  // Actions
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (id: string, status: string, paymentIntentId?: string) => Promise<void>;
  updateSingleOrder: (order: Partial<Order> & { id: string }) => void;
  reorder: (orderId: string) => Promise<{ success: boolean; orderId?: string }>;
}

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

  updateSingleOrder: (updatedOrder) => {
    const state = get();
    const exists = state.orders.find((o) => o.id === updatedOrder.id);

    if (exists) {
      set({
        orders: state.orders.map((o) =>
          o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o
        ),
      });

      // Handle toasts for status changes
      if (updatedOrder.status) {
        const isCustomerPage = typeof window !== "undefined" && window.location.pathname.includes("/dashboard/customer");
        if (isCustomerPage) {
          if (updatedOrder.status === "CONFIRMED") {
            toast.success("Restaurant confirmed your order!");
          } else if (updatedOrder.status === "OUT_FOR_DELIVERY") {
            toast.info("Your food is on the way!");
          }
        }
      }
    } else {
      // Order is brand-new — always refresh the full list to maintain order and relations
      get().refreshOrders();
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
    } catch (err) {
      toast.error("A network error occurred.");
      return { success: false };
    } finally {
      set({ isLoading: false });
    }
  },
}));
