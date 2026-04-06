import { http } from "./api.helper";
import type { 
  AdminUserItem, 
  RestaurantItem, 
  UserRole, 
  UserStatus, 
  FeaturedItem,
  FeaturedPayload 
} from "@/types/api.types";

/**
 * admin.service.ts - Handles all administrative API operations.
 */

export interface ListUsersParams {
  search?: string;
  role?: string;
  status?: string;
  sort?: "name" | "createdAt";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface ListRestaurantsParams {
  search?: string;
  status?: string;
  location?: string;
  sort?: "name" | "createdAt";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export const adminService = {
  /* ── User Management ── */
  listUsers: (params: ListUsersParams = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.role) qs.set("role", params.role);
    if (params.status) qs.set("status", params.status);
    if (params.sort) qs.set("sort", params.sort);
    if (params.order) qs.set("order", params.order);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    return http.get<{ users: AdminUserItem[]; total: number }>(`/api/admin/users?${qs.toString()}`);
  },
  
  createUser: (payload: { name: string; email: string; phone: string; role: UserRole; password: string }) => 
    http.post<AdminUserItem>("/api/admin/users", payload),
    
  updateUser: (id: string, payload: { name?: string; phone?: string; role?: UserRole; status?: UserStatus }) => 
    http.put<AdminUserItem>(`/api/admin/users/${id}`, payload),
    
  deleteUser: (id: string) => 
    http.delete<{ id: string }>(`/api/admin/users/${id}`),
    
  /* ── Restaurant Management ── */
  listRestaurants: (params: ListRestaurantsParams = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.status) qs.set("status", params.status);
    if (params.location) qs.set("location", params.location);
    if (params.sort) qs.set("sort", params.sort);
    if (params.order) qs.set("order", params.order);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    return http.get<{ restaurants: RestaurantItem[]; total: number }>(`/api/admin/restaurants?${qs.toString()}`);
  },
  
  /* ── Featured Management ── */
  listFeatured: (params: { location?: string; type?: string; status?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params.location) qs.set("location", params.location);
    if (params.type) qs.set("type", params.type);
    if (params.status) qs.set("status", params.status);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    return http.get<{ items: FeaturedItem[]; total: number }>(`/api/admin/featured?${qs.toString()}`);
  },
  
  createFeatured: (payload: FeaturedPayload) => 
    http.post<FeaturedItem>("/api/admin/featured", payload),
    
  updateFeatured: (id: string, payload: { status?: string; sortOrder?: number }) => 
    http.put<FeaturedItem>(`/api/admin/featured/${id}`, payload),
    
  deleteFeatured: (id: string) => 
    http.delete<{ id: string }>(`/api/admin/featured/${id}`),
};
