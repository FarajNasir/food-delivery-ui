import type { SiteKey } from "@/config/sites";

export type EmailBrand = {
  siteKey: SiteKey;
  siteName: string;
  location: string;
  supportEmail: string;
  primary: string;
  accent: string;
  notice: string;
};

export type OrderTemplateData = {
  orderId: string;
  status: string;
  restaurantName: string;
  restaurantLocation: string | null;
  totalAmount: string;
  deliveryFee: string;
  currency: string;
  deliveryAddress: string | null;
  createdAt: Date | null;
  items: Array<{ name: string; quantity: number; price: string }>;
};

export type ResetPasswordTemplateData = {
  customerName?: string | null;
  resetUrl: string;
  expiresInMinutes?: number;
  brandLocation?: string | null;
};
