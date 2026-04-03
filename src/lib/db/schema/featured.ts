import { pgTable, uuid, varchar, pgEnum, integer, timestamp, index } from "drizzle-orm/pg-core";

export const featuredTypeEnum   = pgEnum("featured_type",   ["restaurant", "dish"]);
export const featuredStatusEnum = pgEnum("featured_status", ["active", "inactive"]);

export const featuredItems = pgTable("featured_items", {
  id:        uuid("id").primaryKey().defaultRandom(),
  type:      featuredTypeEnum("type").notNull(),
  entityId:  uuid("entity_id").notNull(),   // restaurantId or menuItemId
  location:  varchar("location", { length: 100 }).notNull(),
  status:    featuredStatusEnum("status").default("active").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("featured_items_type_location_idx").on(t.type, t.location),
  index("featured_items_status_idx").on(t.status),
  index("featured_items_entity_idx").on(t.entityId),
]);
