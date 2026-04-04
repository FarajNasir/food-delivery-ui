import { relations } from "drizzle-orm";
import { users } from "./users";
import { restaurants } from "./restaurants";
import { menuItems } from "./menuItems";
import { orders, orderItems } from "./orders";

/**
 * ── Restaurant Relations ─────────────────────────────────────
 */
export const restaurantsRelations = relations(restaurants, ({ one, many }) => ({
  owner: one(users, {
    fields: [restaurants.ownerId],
    references: [users.id],
  }),
  orders: many(orders),
  menuItems: many(menuItems),
}));

/**
 * ── Menu Item Relations ─────────────────────────────────────
 */
export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [menuItems.restaurantId],
    references: [restaurants.id],
  }),
}));

/**
 * ── Order Relations ──────────────────────────────────────────
 */
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  restaurant: one(restaurants, {
    fields: [orders.restaurantId],
    references: [restaurants.id],
  }),
  items: many(orderItems),
}));

/**
 * ── Order Item Relations ─────────────────────────────────────
 */
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));
