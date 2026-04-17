import { pgTable, uuid, text, timestamp, decimal, index } from "drizzle-orm/pg-core";
import { restaurants } from "./restaurants";

export const settlements = pgTable("settlements", {
  id:           uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  amount:       decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status:       text("status").$type<"PENDING" | "COMPLETED">().default("COMPLETED").notNull(),
  transactionId: text("transaction_id"), // External bank transfer ID
  periodStart:  timestamp("period_start"),
  periodEnd:    timestamp("period_end"),
  notes:        text("notes"),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  updatedAt:    timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("settlements_restaurant_idx").on(t.restaurantId),
  index("settlements_created_at_idx").on(t.createdAt),
]);
