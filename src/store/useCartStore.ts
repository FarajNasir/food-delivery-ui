import { create } from "zustand";
import { persist } from "zustand/middleware";
import { customerService } from "@/services/customer.service";
import { toast } from "sonner";
import type { OrderItem as CartItem } from "@/types/api.types";

/**
 * useCartStore.ts - High-performance cart management with guest & sync logic.
 */

interface CartState {
  cartItems: CartItem[];
  isLoading: boolean;
  isGuest: boolean;
  
  // Actions
  addItem: (item: Omit<CartItem, "id" | "quantity">) => Promise<void>;
  removeItem: (menuItemId: string) => Promise<void>;
  updateQuantity: (menuItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  
  // Computed (getters)
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartItems: [],
      isLoading: false,
      isGuest: true,

      getTotalItems: () => get().cartItems.reduce((acc, item) => acc + item.quantity, 0),
      getTotalPrice: () => get().cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),

      refreshCart: async () => {
        set({ isLoading: true });
        try {
          const { success, data } = await customerService.getMe();
          if (success && data) {
            set({ isGuest: false });
            // Sync guest items if any
            const guestItems = get().cartItems.filter(i => i.id.startsWith("guest-"));
            if (guestItems.length > 0) {
              await customerService.syncCart(guestItems.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })));
            }
            // Fetch fresh from DB
            const cartRes = await customerService.getCart();
            if (cartRes.success && cartRes.data) {
              set({ cartItems: cartRes.data.items });
            }
          } else {
            set({ isGuest: true });
          }
        } finally {
          set({ isLoading: false });
        }
      },

      addItem: async (item) => {
        const { isGuest, cartItems } = get();
        
        // Optimistic update
        const existingIdx = cartItems.findIndex(i => i.menuItemId === item.menuItemId);
        const updatedItems = [...cartItems];
        
        if (existingIdx > -1) {
          updatedItems[existingIdx] = { ...updatedItems[existingIdx], quantity: updatedItems[existingIdx].quantity + 1 };
        } else {
          updatedItems.push({ 
            id: isGuest ? `guest-${Date.now()}` : `temp-${Date.now()}`, 
            ...item, 
            quantity: 1 
          });
        }
        
        set({ cartItems: updatedItems });
        toast.success(`'${item.name}' added to cart`);

        if (!isGuest) {
          const res = await customerService.addToCart(item.menuItemId, 1);
          if (!res.success) {
            toast.error("Failed to sync cart with server");
            get().refreshCart(); // Rollback
          }
        }
      },

      updateQuantity: async (menuItemId, quantity) => {
        if (quantity < 0) return;
        const { isGuest, cartItems } = get();
        
        const updatedItems = cartItems
          .map(i => i.menuItemId === menuItemId ? { ...i, quantity } : i)
          .filter(i => i.quantity > 0);
          
        set({ cartItems: updatedItems });
        if (quantity === 0) toast.info("Item removed from cart");

        if (!isGuest) {
          const res = await customerService.updateCartItem(menuItemId, quantity);
          if (!res.success) {
            toast.error("Failed to update cart on server");
            get().refreshCart(); // Rollback
          }
        }
      },

      removeItem: (menuItemId) => get().updateQuantity(menuItemId, 0),

      clearCart: async () => {
        const { isGuest } = get();
        set({ cartItems: [] });
        toast.success("Cart cleared");

        if (!isGuest) {
          const res = await customerService.clearCart();
          if (!res.success) {
            toast.error("Failed to clear cart on server");
            get().refreshCart(); // Rollback
          }
        }
      },
    }),
    {
      name: "food-cart-storage",
      partialize: (state) => ({ cartItems: state.cartItems }),
    }
  )
);
