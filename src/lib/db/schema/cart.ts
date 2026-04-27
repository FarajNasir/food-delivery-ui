import { pgTable, uuid, integer, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";
import { menuItems } from "./menuItems";

export const cartItems = pgTable("cart_items", {
  id:         uuid("id").primaryKey().defaultRandom(),
  userId:     uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  menuItemId: uuid("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
  quantity:   integer("quantity").default(1).notNull(),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
  updatedAt:  timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("unique_user_menu_item").on(t.userId, t.menuItemId),
  index("cart_items_user_idx").on(t.userId),
  index("cart_items_menu_item_idx").on(t.menuItemId),
]);
