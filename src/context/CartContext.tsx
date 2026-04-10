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
  restaurantLocation?: string;
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

import { useAuthStore } from "@/store/useAuthStore";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { session, isReady } = useAuthStore();
  const isGuest = !session;

  // ── Fetch DB cart (logged-in users) ─────────────────────────
  const fetchDBCart = useCallback(async (tokenOverride?: string, retryCount = 0) => {
    const sessionToUse = tokenOverride 
      ? { access_token: tokenOverride } 
      : useAuthStore.getState().session;

    if (!sessionToUse?.access_token) {
        console.log("[CartContext] No session available for fetching DB cart.");
        setCartItems(loadGuestCart());
        setLoading(false);
        return;
    }

    console.log(`[CartContext] Fetching DB cart (retry: ${retryCount})...`);

    try {
      const res = await fetch("/api/cart", { 
        cache: "no-store",
        headers: {
            "Authorization": `Bearer ${sessionToUse.access_token}`
        }
      });
      
      if (res.status === 401) {
        console.warn(`[CartContext] 401 Unauthorized received (retry: ${retryCount})`);
        if (retryCount < 1) {
          await new Promise(r => setTimeout(r, 500));
          return fetchDBCart(tokenOverride, retryCount + 1);
        }
        console.warn("[CartContext] Session unauthorized after retry. Falling back to guest cart.");
        setCartItems(loadGuestCart());
        return;
      }

      const data = await res.json();
      
      const fetchedItems = data.data?.items || (Array.isArray(data.data) ? data.data : null);

      if (Array.isArray(fetchedItems)) {
        console.log(`[CartContext] Successfully fetched ${fetchedItems.length} items from DB.`);
        setCartItems(fetchedItems);
      } else {
        console.warn("[CartContext] No valid items array found in response:", data);
        if (data.success) setCartItems(loadGuestCart());
      }
    } catch (err) {
      console.error("[CartContext] Failed to fetch cart:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Sync guest cart → DB on first login ─────────────────────
  const syncGuestCartToDB = useCallback(async (tokenOverride?: string) => {
    const sessionToUse = tokenOverride 
      ? { access_token: tokenOverride } 
      : useAuthStore.getState().session;

    if (!sessionToUse?.access_token) return;

    const guestItems = loadGuestCart();
    if (guestItems.length === 0) return;

    console.log(`[CartContext] Syncing ${guestItems.length} guest items to DB...`);

    try {
      const res = await fetch("/api/cart/sync", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionToUse.access_token}`
        },
        body: JSON.stringify({ items: guestItems.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })) }),
      });
      
      if (res.ok) {
        console.log("[CartContext] Guest cart synced successfully.");
        localStorage.removeItem(GUEST_CART_KEY);
      }
    } catch (err) {
      console.error("[CartContext] Failed to sync guest cart:", err);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const initCart = async () => {
        setLoading(true);
        if (session) {
            console.log("[CartContext] Auth detected, initiating sync and fetch...");
            await syncGuestCartToDB(session.access_token);
            await fetchDBCart(session.access_token);
        } else {
            console.log("[CartContext] No session, loading guest cart.");
            setCartItems(loadGuestCart());
            setLoading(false);
        }
    };

    initCart();
  }, [session, isReady, fetchDBCart, syncGuestCartToDB]);

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
      const currentSession = useAuthStore.getState().session;
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": currentSession ? `Bearer ${currentSession.access_token}` : ""
        },
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
      const currentSession = useAuthStore.getState().session;
      const res = await fetch(`/api/cart/${menuItemId}`, {
        method: "PATCH",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": currentSession ? `Bearer ${currentSession.access_token}` : ""
        },
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
      const currentSession = useAuthStore.getState().session;
      const res = await fetch("/api/cart/clear", { 
        method: "POST",
        headers: {
            "Authorization": currentSession ? `Bearer ${currentSession.access_token}` : ""
        }
      });
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
