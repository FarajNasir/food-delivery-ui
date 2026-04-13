import { create } from "zustand";
import { ownerService } from "@/services/owner.service";
import { toast } from "sonner";

/**
 * useOwnerStore.ts - Real-time dashboard for restaurant owners.
 * Manages live orders and kitchen state transitions.
 */

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

interface OwnerState {
  orders: OwnerOrder[];
  ownedRestaurantIds: string[];
  isLoading: boolean;
  
  // Actions
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (id: string, status: string) => Promise<boolean>;
  updateSingleOrder: (order: Partial<OwnerOrder> & { id: string }) => void;
}

export const useOwnerStore = create<OwnerState>()((set, get) => ({
  orders: [],
  ownedRestaurantIds: [],
  isLoading: false,

  refreshOrders: async () => {
    set({ isLoading: true });
    try {
      const response = await ownerService.getLiveOrders();
      // Adjusting to handle both direct array and { orders, ownedRestaurantIds }
      const data = response.data as any;
      const fetchedOrders = data?.orders || (Array.isArray(data) ? data : []);
      const fetchedRestaurantIds = data?.ownedRestaurantIds || [];
      
      set({ 
        orders: fetchedOrders,
        ownedRestaurantIds: fetchedRestaurantIds
      });
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

  updateSingleOrder: (updatedOrder) => {
    set((state) => {
      const exists = state.orders.find((o) => o.id === updatedOrder.id);
      if (exists) {
        // Order already known — just patch the changed fields
        return {
          orders: state.orders.map((o) =>
            o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o
          ),
        };
      }
      // Order is brand-new — always refresh to get its full data from the server
      get().refreshOrders();
      return state;
    });
  },
}));
