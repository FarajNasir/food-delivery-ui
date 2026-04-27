import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, restaurants } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/payments/[id]
 * Fetches all UNPAID (unsettled) orders for a specific restaurant.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async () => {
    try {
      const { id } = await params;

      // 1. Fetch restaurant info
      const [rest] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, id))
        .limit(1);

      if (!rest) return fail("Restaurant not found.", 404);

      // 2. Fetch all orders that are PAID or DELIVERED but NOT SETTLED
      const unpaidOrders = await db
        .select({
          id: orders.id,
          totalAmount: orders.totalAmount,
          createdAt: orders.createdAt,
          status: orders.status,
          isSettled: orders.isSettled,
        })
        .from(orders)
        .where(and(
          eq(orders.restaurantId, id),
          inArray(orders.status, ["PAID", "DELIVERED"]),
          eq(orders.isSettled, "NO")
        ));

      return ok({
        restaurant: rest,
        unpaidOrders,
      });
    } catch (err: any) {
      console.error("[api/admin/payments/[id] GET]", err);
      return fail("Failed to fetch unpaid orders.", 500);
    }
  }, ["admin"]);
}
