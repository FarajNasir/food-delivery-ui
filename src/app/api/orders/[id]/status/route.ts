import { ok, fail, parseBody, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, restaurants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const StatusSchema = z.object({
  status: z.enum([
    "CONFIRMED", 
    "PAID", 
    "PREPARING", 
    "OUT_FOR_DELIVERY", 
    "DELIVERED", 
    "CANCELLED"
  ]),
  paymentIntentId: z.string().optional(),
});

/**
 * PATCH /api/orders/[id]/status
 * Updates the status of an order.
 * - Customer can update to PAID (providing paymentIntentId).
 * - Restaurant owner can update to other states.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (user) => {
    try {
      const { id } = await params;
      const body = await parseBody(req, StatusSchema);
      if ("error" in body) return body.error;
      const { status, paymentIntentId } = body.data;

      // 1. Fetch the order
      const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
      if (!order) return fail("Order not found", 404);

      // 2. Permission Check: 
      if (status === "PAID") {
        // Only the customer who placed the order can mark it as PAID
        if (order.userId !== user.id) {
          return fail("You don't have permission to mark this order as paid.", 403);
        }
      } else {
        // Manager status: CONFIRMED, PREPARING, etc.
        // Requires OWNER or ADMIN role and ownership of the restaurant
        if (user.role === "customer") {
          return fail("Unauthorized. Only restaurant owners can update kitchen status.", 403);
        }

        const [ownedResto] = await db
          .select({ id: restaurants.id })
          .from(restaurants)
          .where(and(
            eq(restaurants.id, order.restaurantId),
            eq(restaurants.ownerId, user.id)
          ))
          .limit(1);

        if (!ownedResto && user.role !== "admin") {
          return fail("Forbidden. You don't own the restaurant associated with this order.", 403);
        }
      }

      // 3. Update the status
      const updateData: any = { 
        status,
        updatedAt: new Date()
      };
      if (paymentIntentId) updateData.paymentIntentId = paymentIntentId;

      const [updated] = await db
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, id))
        .returning();

      return ok({ order: updated });
    } catch (err) {
      console.error("[api/orders/[id]/status PATCH]", err);
      return fail("Failed to update order status.", 500);
    }
  });
}
