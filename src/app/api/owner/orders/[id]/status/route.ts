import { ok, fail, withOwnerAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, restaurants, users, notifications, deliveryJobs, orderItems, menuItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NotificationService } from "@/services/notification.service";
import { syncSessionStatus } from "@/lib/order-session";
import { createShipdayOrder } from "@/lib/shipday";

// Human-readable labels for customer-facing notifications
const STATUS_LABELS: Record<string, { subject: string; body: (id: string, restaurant: string) => string }> = {
  PENDING_CONFIRMATION: { subject: "Order Received", body: (id, r) => `Your order #${id} from ${r} has been received and is pending confirmation.` },
  PAID:            { subject: "Payment Confirmed", body: (id, r) => `Your payment for order #${id} at ${r} was successful. The restaurant will start preparing it soon.` },
  CONFIRMED:       { subject: "Order Confirmed", body: (id, r) => `Restaurant confirmed your order #${id} at ${r}. It's now in the kitchen!` },
  PREPARING:       { subject: "Kitchen is Cooking", body: (id, r) => `Your order #${id} at ${r} is in the kitchen and being prepared.` },
  DISPATCH_REQUESTED:{ subject: "Order Dispatched", body: (id, r) => `Your order #${id} from ${r} is now dispatched!` },
  OUT_FOR_DELIVERY:{ subject: "On the Way", body: (id, r) => `Your order #${id} from ${r} is now out for delivery.` },
  DELIVERED:       { subject: "Delivered", body: (id, r) => `Congratulations! Your order #${id} from ${r} is successfully delivered. Enjoy!` },
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
        .select({ 
          id: orders.id, 
          userId: orders.userId, 
          restaurantId: orders.restaurantId,
          totalAmount: orders.totalAmount 
        })
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

      // 2. Perform the DB Update IMMEDIATELY
      // We handle the Shipday logic in the background if status is OUT_FOR_DELIVERY
      if (status === "OUT_FOR_DELIVERY") {
        nextStatus = "DISPATCH_REQUESTED";
      }

      const [updated] = await db
        .update(orders)
        .set({
          status: nextStatus,
          updatedAt: new Date()
        })
        .where(eq(orders.id, id))
        .returning();

      // 3. Fire-and-forget BACKGROUND tasks
      (async () => {
        try {
          // A. Sync Session Status
          if (updated.sessionId && (nextStatus === "CONFIRMED" || nextStatus === "CANCELLED")) {
            await syncSessionStatus(updated.sessionId);
          }

          // B. Handle Shipday for Dispatch
          if (status === "OUT_FOR_DELIVERY") {
            const [existingDeliveryJob] = await db
              .select({ id: deliveryJobs.id, status: deliveryJobs.status })
              .from(deliveryJobs)
              .where(eq(deliveryJobs.orderId, id))
              .limit(1);

            if (!existingDeliveryJob) {
              const orderDetails = await db.query.orders.findFirst({
                where: eq(orders.id, id),
                with: {
                  user: { columns: { name: true, phone: true } },
                  restaurant: { columns: { name: true, location: true, contactPhone: true } },
                  items: { with: { menuItem: { columns: { name: true } } } },
                },
              });

              if (orderDetails?.restaurant && orderDetails.user && orderDetails.deliveryAddress && orderDetails.customerPhone) {
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
              }
            }
          }

          // 2. Fetch Restaurant Info for notifications
          const [restaurantInfo] = await db
            .select({ name: restaurants.name })
            .from(restaurants)
            .where(eq(restaurants.id, ownedOrder.restaurantId))
            .limit(1);

          // C. Notify the customer
          const label = STATUS_LABELS[nextStatus] || { 
            subject: "Order Update", 
            body: (id: string, r: string) => `Your order #${id} from ${r} is now ${nextStatus.toLowerCase().replace(/_/g, " ")}.` 
          };

          if (ownedOrder.userId) {
            const customerId = ownedOrder.userId;
            const restaurantName = restaurantInfo?.name ?? "restaurant";
            const subject = label.subject;
            const body = label.body(id.slice(0, 8), restaurantName);

            // 1. WhatsApp for customer
            const [waNotif] = await db.insert(notifications).values({
              recipientId: customerId,
              type: "ORDER",
              subject,
              body,
              channel: "WHATSAPP",
              status: "PENDING",
              metadata: { orderId: id, orderStatus: nextStatus, targetRole: "customer" }
            }).returning();
            if (waNotif) NotificationService.trigger(waNotif.id);

            // 2. FCM for customer
            const [fcmNotif] = await db.insert(notifications).values({
              recipientId: customerId,
              type: "ORDER",
              subject,
              body,
              channel: "FCM",
              status: "PENDING",
              metadata: { orderId: id, orderStatus: nextStatus, targetRole: "customer" }
            }).returning();
            if (fcmNotif) NotificationService.trigger(fcmNotif.id);
          }

          // D. Notify the owner
          try {
            const restaurantName = restaurantInfo?.name ?? "your restaurant";
            const statusText = nextStatus.replace(/_/g, " ").toLowerCase();
            const subject = `Order Update: #${id.slice(0, 8)}`;
            
            // Fetch order items and total with LEFT JOIN to be safe
            const itemsRows = await db
              .select({
                name: menuItems.name,
                quantity: orderItems.quantity,
              })
              .from(orderItems)
              .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
              .where(eq(orderItems.orderId, id));

            const totalAmount = ownedOrder.totalAmount || "0.00";

            const itemsSummary = itemsRows.length > 0 
              ? itemsRows.map(i => `${i.quantity}x ${i.name || "Unknown Item"}`).join("\n") 
              : "No specific items found for this order.";
              
            const detailedBody = `*Order Update: #${id.slice(0, 8)}*\nRestaurant: ${restaurantName}\nStatus: ${statusText.toUpperCase()}\n\n*Items:*\n${itemsSummary}\n\n*Total:* £${totalAmount}`;

            console.log(`[owner/orders/status] Sending detailed owner alert. Items: ${itemsRows.length}`);

            // 1. WhatsApp for owner (Detailed)
            const [waNotif] = await db.insert(notifications).values({
              recipientId: user.id,
              type: "ORDER",
              subject,
              body: detailedBody,
              channel: "WHATSAPP",
              status: "PENDING",
              metadata: { orderId: id, orderStatus: nextStatus, targetRole: "owner" }
            }).returning();
            if (waNotif) NotificationService.trigger(waNotif.id);

            // 2. FCM for owner (Detailed fallback)
            const [fcmNotif] = await db.insert(notifications).values({
              recipientId: user.id,
              type: "ORDER",
              subject,
              body: detailedBody, // Using detailed body for FCM too as per user request for price/menu
              channel: "FCM",
              status: "PENDING",
              metadata: { orderId: id, orderStatus: nextStatus, targetRole: "owner" }
            }).returning();
            if (fcmNotif) NotificationService.trigger(fcmNotif.id);
          } catch (notifyOwnerErr) {
            console.error("[owner/orders/status] Failed to notify owner:", notifyOwnerErr);
          }
        } catch (bgErr) {
          console.error("[owner/orders/status] Background Task Error:", bgErr);
        }
      })();

      // 4. Respond to owner IMMEDIATELY after DB status update
      return ok({ order: updated });
    } catch (err) {
      console.error("[api/owner/orders/[id]/status PATCH]", err);
      return fail("Failed to update status by owner.", 500);
    }
  });
}
