import { pgTable, uuid, text, timestamp, decimal, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const sessionStatusEnum = [
  "PENDING",
  "READY_TO_PAY",
  "PAID",
  "CANCELLED",
] as const;

export type SessionStatus = (typeof sessionStatusEnum)[number];

export const orderSessions = pgTable("order_sessions", {
  id:                uuid("id").primaryKey().defaultRandom(),
  userId:           uuid("user_id").references(() => users.id, { onDelete: "set null" }), // nullable – preserved when user deletes account
  status:            text("status").$type<SessionStatus>().default("PENDING").notNull(),
  totalItemsAmount:  decimal("total_items_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  totalDeliveryFee:  decimal("total_delivery_fee", { precision: 10, scale: 2 }).default("0").notNull(),
  deliveryAddress:   text("delivery_address"),
  deliveryArea:      text("delivery_area"),
  distanceMiles:     decimal("distance_miles", { precision: 10, scale: 4 }),
  customerPhone:     text("customer_phone"),
  currency:          text("currency").default("GBP").notNull(),
  paymentIntentId:   text("payment_intent_id"),
  createdAt:         timestamp("created_at").defaultNow().notNull(),
  updatedAt:         timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("order_sessions_user_idx").on(t.userId),
  index("order_sessions_status_idx").on(t.status),
]);
