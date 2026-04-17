import { http } from "./api.helper";
import type { 
  RestaurantItem, 
  MenuItem, 
  MenuItemStatus, 
  OpeningHours, 
  RestaurantStatus 
} from "@/types/api.types";

/**
 * owner.service.ts - Handles all API operations for restaurant owners.
 */

export interface RestaurantPayload {
  name: string;
  location?: string;
  logoUrl?: string;
  ownerId?: string;
  managerPhone?: string;
  contactEmail: string;
  contactPhone: string;
  businessRegNo?: string;
  openingHours?: OpeningHours;
  status?: RestaurantStatus;
}

export interface MenuItemPayload {
  restaurantId: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  status?: MenuItemStatus;
  imageUrl: string;
}

export const ownerService = {
  /* ── Restaurant Management ── */
  listRestaurants: () => http.get<{ items: RestaurantItem[] }>("/api/owner/restaurants"),
  
  getRestaurant: (id: string) => http.get<RestaurantItem>(`/api/owner/restaurants/${id}`),
  
  updateRestaurant: (id: string, payload: Partial<RestaurantPayload>) => 
    http.put<RestaurantItem>(`/api/owner/restaurants/${id}`, payload),
    
  /* ── Menu Management ── */
  listMenuItems: (params: { restaurantId?: string; search?: string; status?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params.restaurantId) qs.set("restaurantId", params.restaurantId);
    if (params.search) qs.set("search", params.search);
    if (params.status) qs.set("status", params.status);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    return http.get<{ items: MenuItem[]; total: number }>(`/api/admin/menu?${qs.toString()}`);
  },
  
  createMenuItem: (payload: MenuItemPayload) => 
    http.post<MenuItem>("/api/admin/menu", payload),
    
  updateMenuItem: (id: string, payload: Partial<MenuItemPayload>) => 
    http.put<MenuItem>(`/api/admin/menu/${id}`, payload),
    
  deleteMenuItem: (id: string) => 
    http.delete<{ id: string }>(`/api/admin/menu/${id}`),

  /* ── Orders (for owner view) ── */
  getLiveOrders: (params?: { restaurantId?: string; page?: number; limit?: number; scope?: "active" | "history"; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.restaurantId) qs.set("restaurantId", params.restaurantId);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.scope) qs.set("scope", params.scope);
    if (params?.status) qs.set("status", params.status);
    return http.get<{ orders: any[]; ownedRestaurantIds: string[]; pagination: any }>(`/api/owner/orders?${qs.toString()}`);
  },
  
  updateOrderStatus: (orderId: string, status: string) => 
    http.patch(`/api/owner/orders/${orderId}/status`, { status }),
};
