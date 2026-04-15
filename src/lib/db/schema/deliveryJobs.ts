import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { orders } from "./orders";

export const deliveryJobProviderEnum = ["shipday"] as const;
export const deliveryJobStatusEnum = [
  "DISPATCH_REQUESTED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

export type DeliveryJobProvider = (typeof deliveryJobProviderEnum)[number];
export type DeliveryJobStatus = (typeof deliveryJobStatusEnum)[number];

export const deliveryJobs = pgTable("delivery_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().unique().references(() => orders.id, { onDelete: "cascade" }),
  provider: text("provider").$type<DeliveryJobProvider>().default("shipday").notNull(),
  status: text("status").$type<DeliveryJobStatus>().default("DISPATCH_REQUESTED").notNull(),
  providerOrderId: text("provider_order_id"),
  trackingId: text("tracking_id"),
  trackingUrl: text("tracking_url"),
  driverName: text("driver_name"),
  driverPhone: text("driver_phone"),
  eta: text("eta"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("delivery_jobs_provider_idx").on(t.provider),
  index("delivery_jobs_status_idx").on(t.status),
  index("delivery_jobs_provider_order_idx").on(t.providerOrderId),
  index("delivery_jobs_tracking_idx").on(t.trackingId),
]);
