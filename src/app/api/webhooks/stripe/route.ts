import { db } from "@/lib/db";
import { orders, restaurants, users, notifications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { NotificationService } from "@/services/notification.service";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  let event;

  try {
    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      return new NextResponse("Missing Stripe signature or webhook secret", { status: 400 });
    }

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error(`[Stripe Webhook] Error: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      console.log(`[Stripe Webhook] Received completion for Order: ${orderId}`);

      try {
        // 1. Fetch current order status to ensure idempotency
        const currentOrder = await db.query.orders.findFirst({
          where: eq(orders.id, orderId),
        });

        if (currentOrder && currentOrder.status === "PAID") {
          console.log(`[Stripe Webhook] Order ${orderId} is already marked as PAID. Skipping.`);
          return new NextResponse(null, { status: 200 });
        }

        // 2. Update Order Status to PAID
        const [updatedOrder] = await db
          .update(orders)
          .set({
            status: "PAID",
            updatedAt: new Date()
          })
          .where(eq(orders.id, orderId))
          .returning();

        if (updatedOrder) {
          // 3. Notify Restaurant Owner
          const [restaurant] = await db
            .select({
              ownerId: restaurants.ownerId,
              name: restaurants.name
            })
            .from(restaurants)
            .where(eq(restaurants.id, updatedOrder.restaurantId))
            .limit(1);

          if (restaurant) {
            const [owner] = await db
              .select({ lastActive: users.lastActive })
              .from(users)
              .where(eq(users.id, restaurant.ownerId))
              .limit(1);

            const isOwnerActive = owner?.lastActive && (Date.now() - new Date(owner.lastActive).getTime() < 300000);

            const [ownerNotification] = await db.insert(notifications).values({
              recipientId: restaurant.ownerId,
              type: "ORDER",
              subject: "Payment Received! 💰",
              body: `Payment for Order #${updatedOrder.id.slice(0, 8)} at ${restaurant.name} has been confirmed. You can now begin preparation.`,
              channel: isOwnerActive ? "FCM" : "WHATSAPP",
              status: "PENDING",
              metadata: { orderId: updatedOrder.id, orderStatus: "PAID" }
            }).returning();

            if (ownerNotification && ownerNotification.channel === "FCM") {
              NotificationService.trigger(ownerNotification.id);
            }
          }

          // 4. Notify Customer
          try {
            const [customer] = await db
              .select({ lastActive: users.lastActive })
              .from(users)
              .where(eq(users.id, updatedOrder.userId))
              .limit(1);

            const isCustomerActive = customer?.lastActive && (Date.now() - new Date(customer.lastActive).getTime() < 300000);

            const [customerNotification] = await db.insert(notifications).values({
              recipientId: updatedOrder.userId,
              type: "ORDER",
              subject: "Payment Confirmed! ✅",
              body: `Your payment was successful. The restaurant will start preparing your meal shortly.`,
              channel: isCustomerActive ? "FCM" : "WHATSAPP",
              status: "PENDING",
              metadata: { orderId: updatedOrder.id, orderStatus: "PAID" }
            }).returning();

            if (customerNotification && customerNotification.channel === "FCM") {
              NotificationService.trigger(customerNotification.id);
            }
          } catch (notifyErr) {
            console.error("[Stripe Webhook] Failed to notify customer:", notifyErr);
          }
        }
      } catch (dbErr) {
        console.error("[Stripe Webhook] Database Error:", dbErr);
        return new NextResponse("Internal Server Error during order update", { status: 500 });
      }
    }
  }

  return new NextResponse(null, { status: 200 });
}
