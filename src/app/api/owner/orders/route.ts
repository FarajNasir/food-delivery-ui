import { ok, fail, withOwnerAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, orderItems, restaurants, menuItems } from "@/lib/db/schema";
import { eq, inArray, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/owner/orders
 *
 * Optimized to 2 DB round-trips (down from 3):
 *   1. Restaurant IDs for this owner (fast, indexed)
 *   2. One big JOIN: orders + restaurants + orderItems + menuItems
 *      Produces one row per order-item; reassembled in JS.
 *
 * Saving one Tokyo round-trip ≈ -400ms vs the previous 3-query approach.
 */
export async function GET(req: Request) {
  return withOwnerAuth(req, async (user) => {
    try {
      // ── 1. Get the owner's restaurant IDs ──────────────────────────────────
      const ownedRestos = await db
        .select({ id: restaurants.id })
        .from(restaurants)
        .where(eq(restaurants.ownerId, user.id));

      if (!ownedRestos.length) return ok({ orders: [], ownedRestaurantIds: [] });

      const ownedRestaurantIds = ownedRestos.map((r) => r.id);

      // ── 2. Single JOIN: orders + restaurants + orderItems + menuItems ───────
      // One row per order-item. Orders with no items still appear (LEFT JOIN).
      const rows = await db
        .select({
          // order fields
          orderId:         orders.id,
          userId:          orders.userId,
          restaurantId:    orders.restaurantId,
          restaurantName:  restaurants.name,
          status:          orders.status,
          totalAmount:     orders.totalAmount,
          deliveryFee:     orders.deliveryFee,
          deliveryAddress: orders.deliveryAddress,
          deliveryArea:    orders.deliveryArea,
          customerPhone:   orders.customerPhone,
          currency:        orders.currency,
          createdAt:       orders.createdAt,
          updatedAt:       orders.updatedAt,
          // order item fields (null when no items)
          itemId:          orderItems.id,
          itemMenuItemId:  orderItems.menuItemId,
          itemQuantity:    orderItems.quantity,
          itemPrice:       orderItems.price,
          itemName:        menuItems.name,
          itemImageUrl:    menuItems.imageUrl,
        })
        .from(orders)
        .innerJoin(restaurants, eq(orders.restaurantId, restaurants.id))
        .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
        .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
        .where(inArray(orders.restaurantId, ownedRestaurantIds))
        .orderBy(desc(orders.createdAt));

      // ── 3. Reassemble denormalized rows → structured orders ────────────────
      const orderMap = new Map<string, {
        id: string; userId: string; restaurantId: string; status: string;
        totalAmount: string; deliveryFee: string; deliveryAddress: string | null;
        deliveryArea: string | null; customerPhone: string | null;
        currency: string; createdAt: Date; updatedAt: Date;
        restaurant: { name: string };
        items: { id: string; quantity: number; price: string; menuItem: { id: string; name: string; imageUrl: string | null } }[];
      }>();

      for (const row of rows) {
        if (!orderMap.has(row.orderId)) {
          orderMap.set(row.orderId, {
            id:              row.orderId,
            userId:          row.userId,
            restaurantId:    row.restaurantId,
            status:          row.status,
            totalAmount:     row.totalAmount,
            deliveryFee:     row.deliveryFee,
            deliveryAddress: row.deliveryAddress,
            deliveryArea:    row.deliveryArea,
            customerPhone:   row.customerPhone,
            currency:        row.currency,
            createdAt:       row.createdAt,
            updatedAt:       row.updatedAt,
            restaurant:      { name: row.restaurantName },
            items:           [],
          });
        }

        // Append item if this row has one (LEFT JOIN may produce nulls)
        if (row.itemId && row.itemMenuItemId) {
          orderMap.get(row.orderId)!.items.push({
            id:       row.itemId,
            quantity: row.itemQuantity!,
            price:    row.itemPrice!,
            menuItem: {
              id:       row.itemMenuItemId,
              name:     row.itemName ?? "",
              imageUrl: row.itemImageUrl ?? null,
            },
          });
        }
      }

      const result = Array.from(orderMap.values());
      return ok({ orders: result, ownedRestaurantIds });
    } catch (err) {
      console.error("[api/owner/orders GET]", err);
      return fail("Failed to fetch owner orders.", 500);
    }
  });
}

