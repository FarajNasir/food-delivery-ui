import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orderSessions, orders, orderItems, menuItems, restaurants } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders/session/[id]
 * Fetches the details of an order session, including all sub-orders.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (user) => {
    try {
      const { id } = await params;

      // 1. Fetch Session
      const [session] = await db
        .select()
        .from(orderSessions)
        .where(eq(orderSessions.id, id))
        .limit(1);

      if (!session) return fail("Session not found", 404);
      if (session.userId !== user.id && user.role !== "admin") {
        return fail("Unauthorized", 403);
      }

      // 2. Fetch Sub-Orders
      const subOrders = await db
        .select({
          id: orders.id,
          status: orders.status,
          totalAmount: orders.totalAmount,
          deliveryFee: orders.deliveryFee,
          restaurantId: orders.restaurantId,
          restaurantName: restaurants.name,
          restaurantLogo: restaurants.logoUrl,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        })
        .from(orders)
        .innerJoin(restaurants, eq(orders.restaurantId, restaurants.id))
        .where(eq(orders.sessionId, id));

      // 3. Fetch Items for all sub-orders
      const orderIds = subOrders.map(o => o.id);
      let items: any[] = [];
      if (orderIds.length > 0) {
        items = await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            quantity: orderItems.quantity,
            price: orderItems.price,
            itemName: menuItems.name,
            itemImage: menuItems.imageUrl,
          })
          .from(orderItems)
          .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
          .where(inArray(orderItems.orderId, orderIds));
      }

      // 4. Assemble
      const result = {
        ...session,
        orders: subOrders.map(order => ({
          ...order,
          items: items.filter(i => i.orderId === order.id)
        }))
      };

      return ok({ session: result });
    } catch (err) {
      console.error("[api/orders/session/[id] GET]", err);
      return fail("Failed to fetch session details.", 500);
    }
  });
}
