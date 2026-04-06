import { ok, fail } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, restaurants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

/**
 * PATCH /api/owner/orders/[id]/status
 * Updates the order status, but ONLY if the restaurant belongs to the current user.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user || user.role !== "owner") {
      return fail("Unauthorized - Owner role required", 401);
    }

    const json = await req.json();
    const { status } = json;

    if (!status) {
      return fail("Status is required.", 400);
    }

    // 1. Ownership Validation: 
    // Join the order with restaurants table to check if' ownerId matches
    const [ownedOrder] = await db
      .select({ id: orders.id })
      .from(orders)
      .innerJoin(restaurants, eq(orders.restaurantId, restaurants.id))
      .where(and(
        eq(orders.id, id),
        eq(restaurants.ownerId, user.id)
      ))
      .limit(1);

    if (!ownedOrder) {
      return fail("Order not found or you don't have permission to manage it.", 403);
    }

    // 2. Update the status
    console.log(`[Owner] Updating order ${id} to status ${status}`);
    const [updated] = await db
      .update(orders)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();

    console.log(`[Owner] Order ${id} updated result:`, updated);

    return ok({ order: updated });
  } catch (err) {
    console.error("[api/owner/orders/[id]/status PATCH]", err);
    return fail("Failed to update status by owner.", 500);
  }
}
