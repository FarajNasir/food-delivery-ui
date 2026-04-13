import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, orderItems, restaurants, users, notifications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NotificationService } from "@/services/notification.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/orders/[id]/reorder
 * Clones an existing order and its items for the authenticated user.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: originalOrderId } = await params;

  return withAuth(req, async (user) => {
    try {
      // 1. Fetch original order
      const [originalOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, originalOrderId))
        .limit(1);

      if (!originalOrder) {
        return fail("Original order not found", 404);
      }

      // 2. Security check: only the customer who placed the order can reorder it
      if (originalOrder.userId !== user.id) {
        return fail("Unauthorized to reorder this order", 403);
      }

      // 3. Fetch original order items
      const originalItems = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, originalOrderId));

      if (originalItems.length === 0) {
        return fail("Original order has no items", 400);
      }

      // 4. Create new order in a transaction
      const newOrder = await db.transaction(async (tx) => {
        const [insertedOrder] = await tx.insert(orders).values({
          userId: user.id,
          restaurantId: originalOrder.restaurantId,
          totalAmount: originalOrder.totalAmount,
          deliveryFee: originalOrder.deliveryFee,
          deliveryAddress: originalOrder.deliveryAddress,
          deliveryArea: originalOrder.deliveryArea,
          distanceMiles: originalOrder.distanceMiles,
          customerPhone: originalOrder.customerPhone,
          currency: originalOrder.currency,
          status: "PENDING_CONFIRMATION", // Reset status
        }).returning();

        await tx.insert(orderItems).values(
          originalItems.map(item => ({
            orderId: insertedOrder.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
          }))
        );

        return insertedOrder;
      });

      // 5. Notify restaurant owner
      try {
        const [restaurant] = await db
          .select({ ownerId: restaurants.ownerId, name: restaurants.name })
          .from(restaurants)
          .where(eq(restaurants.id, newOrder.restaurantId))
          .limit(1);

        if (restaurant) {
          const [owner] = await db
            .select({ lastActive: users.lastActive })
            .from(users)
            .where(eq(users.id, restaurant.ownerId))
            .limit(1);

          const isActive = owner?.lastActive && (Date.now() - new Date(owner.lastActive).getTime() < 300000);

          const [newNotification] = await db.insert(notifications).values({
            recipientId: restaurant.ownerId,
            type: "ORDER",
            subject: "New Reorder Received!",
            body: `Reorder #${newOrder.id.slice(0, 8)} for ${restaurant.name} has been placed.`,
            channel: isActive ? "FCM" : "WHATSAPP",
            status: "PENDING",
            metadata: { orderId: newOrder.id, orderStatus: "PENDING_CONFIRMATION" }
          }).returning();

          if (newNotification && newNotification.channel === "FCM") {
            NotificationService.trigger(newNotification.id);
          }
        }
      } catch (notifyErr) {
        console.error("Failed to queue notification for reorder:", notifyErr);
      }

      return ok({ order: newOrder });
    } catch (err) {
      console.error("[api/orders/[id]/reorder POST]", err);
      return fail("Failed to reorder.", 500);
    }
  });
}
