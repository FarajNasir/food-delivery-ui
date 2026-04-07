import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const notificationTypeEnum = ["ORDER", "PAYMENT", "DELIVERY", "SYSTEM", "PROMO"] as const;
export const notificationChannelEnum = ["FCM", "WHATSAPP", "EMAIL"] as const;
export const notificationStatusEnum = ["PENDING", "SENT", "FAILED"] as const;

export const notifications = pgTable("notifications", {
  id:          uuid("id").primaryKey().defaultRandom(),
  recipientId: uuid("recipient_id").notNull(),
  type:        text("type").$type<(typeof notificationTypeEnum)[number]>().notNull(),
  subject:     text("subject").notNull(),
  body:        text("body").notNull(),
  channel:     text("channel").$type<(typeof notificationChannelEnum)[number]>().notNull(),
  status:      text("status").$type<(typeof notificationStatusEnum)[number]>().default("PENDING").notNull(),
  metadata:    jsonb("metadata"), // stores orderId, paymentId for deep-linking
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});
