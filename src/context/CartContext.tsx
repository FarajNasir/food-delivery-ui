"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";

export interface CartItem {
  id: string;
  menuItemId: string;
  quantity: number;
  name: string;
  price: number;
  imageUrl: string;
  restaurantName: string;
  restaurantId: string;
}

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  isGuest: boolean;
  totalItems: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, "id" | "quantity">) => Promise<void>;
  removeItem: (menuItemId: string) => Promise<void>;
  updateQuantity: (menuItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_KEY = "guest_cart";

// ── localStorage helpers ─────────────────────────────────────
function loadGuestCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestCart(items: CartItem[]) {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {}
}

// Removed checkIsLoggedIn to prevent Supabase lock conflicts. Use session from onAuthStateChange instead.

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(true);

  // ── Fetch DB cart (logged-in users) ─────────────────────────
  const fetchDBCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      if (data.data) {
        setCartItems(data.data.items);
      }
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    }
  }, []);

  // ── Sync guest cart → DB on first login ─────────────────────
  const syncGuestCartToDB = useCallback(async () => {
    const guestItems = loadGuestCart();
    if (guestItems.length === 0) return;

    try {
      await fetch("/api/cart/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: guestItems.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })) }),
      });
      localStorage.removeItem(GUEST_CART_KEY);
    } catch (err) {
      console.error("Failed to sync guest cart:", err);
    }
  }, []);

  // ── Init: determine guest vs. logged-in ─────────────────────
  // Removed refreshCart to prevent Supabase lock conflicts. Auth is now handled by onAuthStateChange.

  useEffect(() => {
    const supabase = createClient();

    // Listen for auth changes (login/logout) to refresh cart state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      setLoading(true);
      if (session) {
        setIsGuest(false);
        // Sync any leftover guest cart into DB first
        await syncGuestCartToDB();
        await fetchDBCart();
      } else {
        setIsGuest(true);
        setCartItems(loadGuestCart());
        if (event === "SIGNED_OUT" || event === "INITIAL_SESSION") {
            setLoading(false);
        }
      }
      
      // Ensure loading is off if we didn't hit the SIGNED_OUT/INITIAL_SESSION paths (e.g. on SIGNED_IN)
      // fetchDBCart handles its own setLoading(false) via finally block in some contexts, 
      // but here we should be explicit.
      if (session) setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchDBCart, syncGuestCartToDB]);

  // ── Add item ─────────────────────────────────────────────────
  const addItem = async (item: Omit<CartItem, "id" | "quantity">) => {
    // If we are currently a guest, use localStorage
    if (isGuest) {
      // Guest: pure localStorage
      const current = loadGuestCart();
      const existingIdx = current.findIndex(i => i.menuItemId === item.menuItemId);
      if (existingIdx > -1) {
        current[existingIdx].quantity += 1;
      } else {
        current.push({ id: `guest-${Date.now()}`, ...item, quantity: 1 });
      }
      saveGuestCart(current);
      setCartItems([...current]);
      toast.success(`'${item.name}' added to cart`);
      return;
    }

    // Logged-in: optimistic + DB
    const existingIndex = cartItems.findIndex(i => i.menuItemId === item.menuItemId);
    const newItems = [...cartItems];
    if (existingIndex > -1) {
      newItems[existingIndex] = { ...newItems[existingIndex], quantity: newItems[existingIndex].quantity + 1 };
    } else {
      newItems.push({ id: "temp-" + Date.now(), ...item, quantity: 1 });
    }
    setCartItems(newItems);

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId: item.menuItemId, quantity: 1 }),
      });
      if (!res.ok) throw new Error();
      await fetchDBCart();
      toast.success(`'${item.name}' added to order`);
    } catch {
      toast.error("Failed to add item. Please try again.");
      await fetchDBCart(); // rollback
    }
  };

  // ── Update quantity ──────────────────────────────────────────
  const updateQuantity = async (menuItemId: string, quantity: number) => {
    if (quantity < 0) return;

    // If guest mode
    if (isGuest) {
      const current = loadGuestCart()
        .map(i => i.menuItemId === menuItemId ? { ...i, quantity } : i)
        .filter(i => i.quantity > 0);
      saveGuestCart(current);
      setCartItems(current);
      if (quantity === 0) toast.info("Item removed from cart");
      return;
    }

    // Logged-in: optimistic + DB
    const newItems = cartItems
      .map(i => i.menuItemId === menuItemId ? { ...i, quantity } : i)
      .filter(i => i.quantity > 0);
    setCartItems(newItems);

    try {
      const res = await fetch(`/api/cart/${menuItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error();
      if (quantity === 0) toast.info("Item removed from cart");
    } catch {
      toast.error("Failed to update quantity");
      await fetchDBCart(); // rollback
    }
  };

  // ── Remove item ──────────────────────────────────────────────
  const removeItem = async (menuItemId: string) => {
    await updateQuantity(menuItemId, 0);
  };

  // ── Clear cart ───────────────────────────────────────────────
  const clearCart = async () => {
    if (isGuest) {
      localStorage.removeItem(GUEST_CART_KEY);
      setCartItems([]);
      toast.success("Cart cleared");
      return;
    }

    const backup = [...cartItems];
    setCartItems([]);
    try {
      const res = await fetch("/api/cart/clear", { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success("Order cleared");
    } catch {
      toast.error("Failed to clear cart");
      setCartItems(backup);
    }
  };

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      loading,
      isGuest,
      totalItems,
      totalPrice,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
