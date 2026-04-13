import { ok, fail, withOwnerAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, restaurants, users, notifications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NotificationService } from "@/services/notification.service";

// Human-readable labels for customer-facing notifications
const STATUS_LABELS: Record<string, { subject: string; body: (id: string, restaurant: string) => string }> = {
  CONFIRMED:       { subject: "Order Confirmed! ✅", body: (id, r) => `Your order #${id} at ${r} has been confirmed and is being prepared.` },
  PREPARING:       { subject: "Kitchen is Cooking! 👨‍🍳", body: (id, r) => `Your order #${id} at ${r} is now being prepared.` },
  OUT_FOR_DELIVERY:{ subject: "On the Way! 🛵", body: (id, r) => `Your order #${id} from ${r} is out for delivery.` },
  DELIVERED:       { subject: "Delivered! 🎉", body: (id, r) => `Your order #${id} from ${r} has been delivered. Enjoy!` },
  CANCELLED:       { subject: "Order Cancelled ❌", body: (id, r) => `Your order #${id} from ${r} has been cancelled.` },
};

/**
 * PATCH /api/owner/orders/[id]/status
 * Updates the order status, but ONLY if the restaurant belongs to the current user.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOwnerAuth(req, async (user) => {
    try {
      const { id } = await params;
      const json = await req.json();
      const { status } = json;

      if (!status) {
        return fail("Status is required.", 400);
      }

      // 1. Ownership Validation: 
      const [ownedOrder] = await db
        .select({ id: orders.id, userId: orders.userId, restaurantId: orders.restaurantId })
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
      const [updated] = await db
        .update(orders)
        .set({ 
          status,
          updatedAt: new Date()
        })
        .where(eq(orders.id, id))
        .returning();

      // 3. Notify the customer via FCM
      try {
        const label = STATUS_LABELS[status];
        if (label && ownedOrder.userId) {
          const [restaurantRow] = await db
            .select({ name: restaurants.name })
            .from(restaurants)
            .where(eq(restaurants.id, ownedOrder.restaurantId))
            .limit(1);

          const [customer] = await db
            .select({ lastActive: users.lastActive })
            .from(users)
            .where(eq(users.id, ownedOrder.userId))
            .limit(1);

          const isActive = customer?.lastActive &&
            (Date.now() - new Date(customer.lastActive).getTime() < 300000); // 5 min window for customers

          if (isActive) {
            const [newNotification] = await db.insert(notifications).values({
              recipientId: ownedOrder.userId,
              type: "ORDER",
              subject: label.subject,
              body: label.body(id.slice(0, 8), restaurantRow?.name ?? "restaurant"),
              channel: "FCM",
              status: "PENDING",
              metadata: { orderId: id, orderStatus: status },
            }).returning();

            if (newNotification) {
              NotificationService.trigger(newNotification.id);
            }
          }
        }
      } catch (notifyErr) {
        console.error("[owner/orders/status] Failed to notify customer:", notifyErr);
      }

      return ok({ order: updated });
    } catch (err) {
      console.error("[api/owner/orders/[id]/status PATCH]", err);
      return fail("Failed to update status by owner.", 500);
    }
  });
}
