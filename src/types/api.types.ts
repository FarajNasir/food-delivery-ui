/**
 * api.types.ts - Shared TypeScript interfaces for all API communications.
 */

export type UserRole = "customer" | "driver" | "owner" | "admin";
export type UserStatus = "active" | "banned";
export type RestaurantStatus = "active" | "inactive" | "suspended";
export type MenuItemStatus = "available" | "unavailable";
export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type DayHours = { open: string; close: string } | null;
export type OpeningHours = Partial<Record<DayKey, DayHours>>;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface RestaurantItem {
  id: string;
  name: string;
  location: string | null;
  logoUrl: string | null;
  ownerId: string;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  managerPhone?: string | null;
  contactEmail: string;
  contactPhone: string;
  businessRegNo?: string | null;
  openingHours: OpeningHours | null;
  status: RestaurantStatus;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  restaurantName?: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  status: MenuItemStatus;
  imageUrl: string;
  createdAt: string;
}

export interface FeaturedItem {
  id: string;
  entityId: string;
  type: "restaurant" | "dish";
  name: string;
  location?: string | null;
  logoUrl?: string | null;
  imageUrl?: string | null;
  restaurantName?: string;
  restaurantId?: string;
  price?: number;
  category?: string;
  sortOrder: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  price: number;
  name: string;
  imageUrl: string;
  restaurantName: string;
  restaurantId: string;
}

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  status: string;
  sessionId?: string | null;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  paymentIntentId?: string | null;
  restaurant?: { name: string };
  items?: {
    id: string;
    quantity: number;
    price: string;
    menuItem: { id: string; name: string; imageUrl?: string };
  }[];
}

export type FeaturedType = "restaurant" | "dish";
export type FeaturedStatus = "active" | "inactive";

export interface FeaturedPayload {
  type: FeaturedType;
  entityId: string;
  location: string;
  status?: FeaturedStatus;
  sortOrder?: number;
}
