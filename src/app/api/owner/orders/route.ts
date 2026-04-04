import { ok, fail } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, restaurants, orderItems, menuItems } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

/**
 * GET /api/owner/orders
 * Fetches all orders for all restaurants owned by the current user.
 * Verified for security: only returns orders that belong to the caller.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "owner") {
      return fail("Unauthorized - Owner role required", 401);
    }

    // 1. Fetch orders joining with restaurants to filter by ownerId
    // We use the query API for easy relations fetching
    const ownerOrders = await db.query.orders.findMany({
      where: (orders, { exists }) => exists(
        db.select()
          .from(restaurants)
          .where(and(
            eq(restaurants.id, orders.restaurantId),
            eq(restaurants.ownerId, user.id)
          ))
      ),
      with: {
        items: {
          with: {
            menuItem: true
          }
        },
        restaurant: true
      },
      orderBy: [desc(orders.createdAt)]
    });

    // 2. Fetch the owner's restaurant IDs to enable frontend filtering
    const ownedRestos = await db
      .select({ id: restaurants.id })
      .from(restaurants)
      .where(eq(restaurants.ownerId, user.id));
    
    const ownedRestaurantIds = ownedRestos.map(r => r.id);

    return ok({ 
      orders: ownerOrders,
      ownedRestaurantIds
    });
  } catch (err) {
    console.error("[api/owner/orders GET]", err);
    return fail("Failed to fetch owner orders.", 500);
  }
}
