import { pgTable, uuid, text, timestamp, integer, index, unique } from "drizzle-orm/pg-core";
import { users } from "./users";
import { restaurants } from "./restaurants";
import { orders } from "./orders";

export const reviews = pgTable("reviews", {
  id:           uuid("id").primaryKey().defaultRandom(),
  userId:       uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  restaurantId: uuid("restaurant_id").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  orderId:      uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  rating:       integer("rating").notNull(),
  comment:      text("comment"),
  status:       text("status").$type<"active" | "inactive" | "ban">().default("inactive").notNull(),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  updatedAt:    timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("reviews_user_idx").on(t.userId),
  index("reviews_restaurant_idx").on(t.restaurantId),
  index("reviews_order_idx").on(t.orderId),
  index("reviews_status_idx").on(t.status),
  unique("reviews_order_unique_idx").on(t.orderId), // One review per order
]);
