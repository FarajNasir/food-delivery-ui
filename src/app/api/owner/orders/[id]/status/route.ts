import { ok, fail, withOwnerAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, restaurants, users, notifications, deliveryJobs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NotificationService } from "@/services/notification.service";
import { syncSessionStatus } from "@/lib/order-session";
import { createShipdayOrder } from "@/lib/shipday";

// Human-readable labels for customer-facing notifications
const STATUS_LABELS: Record<string, { subject: string; body: (id: string, restaurant: string) => string }> = {
  CONFIRMED:       { subject: "Order Confirmed", body: (id, r) => `Your order #${id} at ${r} has been confirmed and is being prepared.` },
  PREPARING:       { subject: "Kitchen is Cooking", body: (id, r) => `Your order #${id} at ${r} is now being prepared.` },
  DISPATCH_REQUESTED:{ subject: "Dispatch Requested", body: (id, r) => `Your order #${id} from ${r} has been handed to dispatch.` },
  OUT_FOR_DELIVERY:{ subject: "On the Way", body: (id, r) => `Your order #${id} from ${r} is out for delivery.` },
  DELIVERED:       { subject: "Delivered", body: (id, r) => `Your order #${id} from ${r} has been delivered. Enjoy!` },
  CANCELLED:       { subject: "Order Cancelled", body: (id, r) => `Your order #${id} from ${r} has been cancelled.` },
};

function normalizeDeliveryStatus(status: string): string {
  if (status === "DELIVERED") return "DELIVERED";
  if (status === "OUT_FOR_DELIVERY") return "OUT_FOR_DELIVERY";
  return "DISPATCH_REQUESTED";
}

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

      let nextStatus = status;

      if (status === "OUT_FOR_DELIVERY") {
        const [existingDeliveryJob] = await db
          .select({ id: deliveryJobs.id, status: deliveryJobs.status })
          .from(deliveryJobs)
          .where(eq(deliveryJobs.orderId, id))
          .limit(1);

        if (existingDeliveryJob) {
          nextStatus = normalizeDeliveryStatus(existingDeliveryJob.status);
        } else {
          const orderDetails = await db.query.orders.findFirst({
            where: eq(orders.id, id),
            with: {
              user: {
                columns: {
                  name: true,
                  phone: true,
                },
              },
              restaurant: {
                columns: {
                  name: true,
                  location: true,
                  contactPhone: true,
                },
              },
              items: {
                with: {
                  menuItem: {
                    columns: {
                      name: true,
                    },
                  },
                },
              },
            },
          });

          if (!orderDetails?.restaurant || !orderDetails.user) {
            return fail("Unable to build Shipday payload for this order.", 400);
          }

          if (!orderDetails.deliveryAddress || !orderDetails.customerPhone) {
            return fail("Order is missing delivery address or customer phone.", 400);
          }

          const shipdayOrder = await createShipdayOrder({
            orderId: orderDetails.id,
            customerName: orderDetails.user.name,
            customerPhoneNumber: orderDetails.customerPhone || orderDetails.user.phone,
            customerAddress: orderDetails.deliveryAddress,
            restaurantName: orderDetails.restaurant.name,
            restaurantAddress: orderDetails.restaurant.location || orderDetails.restaurant.name,
            restaurantPhoneNumber: orderDetails.restaurant.contactPhone,
            orderItems: orderDetails.items.map((item) => ({
              name: item.menuItem.name,
              quantity: item.quantity,
              unitPrice: Number.parseFloat(item.price),
            })),
            totalAmount: orderDetails.totalAmount,
            deliveryFee: orderDetails.deliveryFee,
          });

          await db.insert(deliveryJobs).values({
            orderId: orderDetails.id,
            provider: "shipday",
            status: "DISPATCH_REQUESTED",
            providerOrderId: shipdayOrder.providerOrderId,
            trackingId: shipdayOrder.trackingId,
            trackingUrl: shipdayOrder.trackingUrl,
            driverName: shipdayOrder.driverName,
            driverPhone: shipdayOrder.driverPhone,
            eta: shipdayOrder.eta,
            updatedAt: new Date(),
          });

          nextStatus = "DISPATCH_REQUESTED";
        }
      }

      // 2. Update the status
      const [updated] = await db
        .update(orders)
        .set({
          status: nextStatus,
          updatedAt: new Date()
        })
        .where(eq(orders.id, id))
        .returning();

      // 3. Sync Session Status (Aggregation)
      if (updated.sessionId && (nextStatus === "CONFIRMED" || nextStatus === "CANCELLED")) {
        await syncSessionStatus(updated.sessionId);
      }

      // 4. Notify the customer via FCM
      try {
        const label = STATUS_LABELS[nextStatus];
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
              metadata: { orderId: id, orderStatus: nextStatus },
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
