import { http } from "./api.helper";
import type { 
  RestaurantItem, 
  MenuItem, 
  FeaturedItem, 
  AuthUser,
  Order,
  OrderItem,
} from "@/types/api.types";

type Pagination = {
  total: number;
  page: number;
  limit: number;
};

/**
 * customer.service.ts - Handles all public and customer-facing API operations.
 */

export const customerService = {
  /* ── Auth ── */
  getMe: () => http.get<AuthUser>("/api/auth/me"),
  
  /* ── Restaurants ── */
  getRestaurants: (params: { location: string; category?: string }) => {
    const qs = new URLSearchParams({ location: params.location });
    if (params.category) qs.set("category", params.category);
    return http.get<{ items: RestaurantItem[] }>(`/api/restaurants?${qs.toString()}`);
  },
  
  getRestaurantById: (id: string) => 
    http.get<RestaurantItem>(`/api/restaurants/${id}`),

  /* ── Menu & Dishes ── */
  getDishes: (params: { location: string; search?: string; category?: string; limit?: number }) => {
    const qs = new URLSearchParams({ location: params.location });
    if (params.search) qs.set("search", params.search);
    if (params.category) qs.set("category", params.category);
    if (params.limit) qs.set("limit", String(params.limit));
    return http.get<{ items: MenuItem[] }>(`/api/dishes?${qs.toString()}`);
  },

  getDishById: (id: string) => 
    http.get<MenuItem>(`/api/dishes/${id}`),

  /* ── Featured Content ── */
  getFeatured: (params: { location: string; type: "restaurant" | "dish"; restaurantId?: string }) => {
    const qs = new URLSearchParams({ location: params.location, type: params.type });
    if (params.restaurantId) qs.set("restaurantId", params.restaurantId);
    return http.get<{ items: FeaturedItem[] }>(`/api/featured?${qs.toString()}`);
  },

  /* ── Cart ── */
  getCart: () => http.get<{ items: OrderItem[] }>("/api/cart"),
  
  syncCart: (items: { menuItemId: string; quantity: number }[]) => 
    http.post("/api/cart/sync", { items }),
  
  addToCart: (menuItemId: string, quantity: number = 1) => 
    http.post("/api/cart", { menuItemId, quantity }),
    
  updateCartItem: (menuItemId: string, quantity: number) => 
    http.patch(`/api/cart/${menuItemId}`, { quantity }),
    
  clearCart: () => http.post("/api/cart/clear", {}),

  /* ── Orders ── */
  getOrders: (params?: { page?: number; limit?: number; scope?: "all" | "active" | "past" }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.scope) qs.set("scope", params.scope);
    return http.get<{ orders: Order[]; pagination: Pagination }>(`/api/orders?${qs.toString()}`);
  },
  
  getOrderById: (id: string) => http.get<Order>(`/api/orders/${id}`),
  
  updateOrderStatus: (id: string, status: string, paymentIntentId?: string) => 
    http.patch(`/api/orders/${id}/status`, { status, paymentIntentId }),

  reorder: (orderId: string) => http.post<{ order: Order }>(`/api/orders/${orderId}/reorder`, {}),
};
