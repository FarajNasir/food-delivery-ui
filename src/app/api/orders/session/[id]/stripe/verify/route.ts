import { ok, fail } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, orderSessions, restaurants, users, notifications } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { NotificationService } from "@/services/notification.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/orders/session/[id]/stripe/verify
 * Verifies a Stripe Checkout Session for an Entire Order Session.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { sessionId } = await req.json();

    if (!sessionId) return fail("Missing session_id", 400);

    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", 401);

    // 1. Retrieve the session from Stripe
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    if (stripeSession.payment_status !== "paid") {
      return fail("Payment not completed", 400);
    }

    // 2. Fetch the Order Session
    const [orderSession] = await db
      .select()
      .from(orderSessions)
      .where(and(eq(orderSessions.id, id), eq(orderSessions.userId, user.id)))
      .limit(1);

    if (!orderSession) return fail("Order session not found.", 404);

    // 3. Perform updates if not already PAID
    if (orderSession.status !== "PAID") {
      await db.transaction(async (tx) => {
        // Update Session Status
        await tx.update(orderSessions)
          .set({ status: "PAID", updatedAt: new Date() })
          .where(eq(orderSessions.id, id));

        // Update all CONFIRMED orders in this session
        const updatedOrders = await tx
          .update(orders)
          .set({ status: "PAID", updatedAt: new Date() })
          .where(and(eq(orders.sessionId, id), eq(orders.status, "CONFIRMED")))
          .returning();

        // 4. Notifications for each updated order
        for (const order of updatedOrders) {
          try {
            const [restaurant] = await tx
              .select({ ownerId: restaurants.ownerId, name: restaurants.name })
              .from(restaurants)
              .where(eq(restaurants.id, order.restaurantId))
              .limit(1);

            if (restaurant) {
              const [owner] = await tx
                .select({ lastActive: users.lastActive })
                .from(users)
                .where(eq(users.id, restaurant.ownerId))
                .limit(1);

              const isActive = owner?.lastActive && (Date.now() - new Date(owner.lastActive).getTime() < 300000);

              const [newNotification] = await tx.insert(notifications).values({
                recipientId: restaurant.ownerId,
                type: "ORDER",
                subject: "Payment Received",
                body: `Payment for Order #${order.id.slice(0, 8)} at ${restaurant.name} has been confirmed. You can now begin preparation.`,
                channel: isActive ? "FCM" : "WHATSAPP",
                status: "PENDING",
                metadata: { orderId: order.id, orderStatus: "PAID" }
              }).returning();

              if (newNotification && newNotification.channel === "FCM") {
                NotificationService.trigger(newNotification.id);
              }
            }
          } catch (notifyErr) {
            console.error("Failed to notify restaurant:", notifyErr);
          }
        }

        // 5. Notify Customer (once)
        try {
          const [customer] = await tx
            .select({ lastActive: users.lastActive })
            .from(users)
            .where(eq(users.id, user.id))
            .limit(1);

          const isActive = customer?.lastActive && (Date.now() - new Date(customer.lastActive).getTime() < 300000);

          const [customerNotification] = await tx.insert(notifications).values({
            recipientId: user.id,
            type: "ORDER",
            subject: "Payment Confirmed",
            body: `Your payment was successful. The restaurants will start preparing your meal shortly.`,
            channel: isActive ? "FCM" : "WHATSAPP",
            status: "PENDING",
            metadata: { sessionId: id, status: "PAID" }
          }).returning();

          if (customerNotification && customerNotification.channel === "FCM") {
            NotificationService.trigger(customerNotification.id);
          }
        } catch (notifyErr) {
          console.error("Failed to notify customer:", notifyErr);
        }
      });
    }

    return ok({ status: "PAID" });
  } catch (err: any) {
    console.error("[api/orders/session/[id]/stripe/verify POST] ERROR:", err);
    return fail(`Verification Error: ${err.message || "Unknown error"}`, 500);
  }
}
