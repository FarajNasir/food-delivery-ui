import { relations } from "drizzle-orm";
import { users } from "./users";
import { restaurants } from "./restaurants";
import { menuItems } from "./menuItems";
import { orders, orderItems } from "./orders";
import { orderSessions } from "./orderSessions";
import { deliveryJobs } from "./deliveryJobs";
import { reviews } from "./reviews";

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
  reviews: many(reviews),
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
  review: one(reviews, {
    fields: [orders.id],
    references: [reviews.orderId],
  }),
  deliveryJob: one(deliveryJobs, {
    fields: [orders.id],
    references: [deliveryJobs.orderId],
  }),
  session: one(orderSessions, {
    fields: [orders.sessionId],
    references: [orderSessions.id],
  }),
}));

export const deliveryJobsRelations = relations(deliveryJobs, ({ one }) => ({
  order: one(orders, {
    fields: [deliveryJobs.orderId],
    references: [orders.id],
  }),
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

/**
 * ── Review Relations ─────────────────────────────────────
 */
export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  restaurant: one(restaurants, {
    fields: [reviews.restaurantId],
    references: [restaurants.id],
  }),
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
}));


/**
 * ── Session Relations ─────────────────────────────────────
 */
export const orderSessionsRelations = relations(orderSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [orderSessions.userId],
    references: [users.id],
  }),
  orders: many(orders),
}));
