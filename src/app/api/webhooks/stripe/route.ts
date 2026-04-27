import { db } from "@/lib/db";
import { orders, restaurants, users, notifications, orderItems, menuItems } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
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
        // 1. Atomic Update: Only proceed if status is NOT already PAID
        const [updatedOrder] = await db
          .update(orders)
          .set({
            status: "PAID",
            updatedAt: new Date()
          })
          .where(and(eq(orders.id, orderId), ne(orders.status, "PAID")))
          .returning();

        if (!updatedOrder) {
          console.log(`[Stripe Webhook] Order ${orderId} already PAID or not found. Skipping notifications.`);
          return new NextResponse(null, { status: 200 });
        }

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
            const subject = "Payment Received";
            
            // Build Detailed Body for Owner
            const itemsRows = await db
              .select({
                name: menuItems.name,
                quantity: orderItems.quantity,
              })
              .from(orderItems)
              .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
              .where(eq(orderItems.orderId, updatedOrder.id));
            
            const itemsSummary = itemsRows.map(i => `${i.quantity}x ${i.name}`).join("\n");
            const ownerBody = `Payment Confirmed! 💰\nOrder: #${updatedOrder.id.slice(0, 8)}\nRestaurant: ${restaurant.name}\nStatus: PAID\n\nItems:\n${itemsSummary}\n\nTotal: £${updatedOrder.totalAmount}`;

            // Dispatch Owner Notifications
            await NotificationService.dispatchOrderNotifications({
              userId: restaurant.ownerId,
              type: "ORDER",
              subject,
              body: ownerBody,
              metadata: { orderId: updatedOrder.id, orderStatus: "PAID" },
              channels: ["FCM", "WHATSAPP"]
            });
            console.log(`[Stripe Webhook] Owner notification dispatched for order ${orderId}`);
          }

          // 4. Notify Customer
          try {
            const subject = "Payment Confirmed";
            const body = `Your payment was successful. The restaurant will start preparing your meal shortly.`;

            // Dispatch Customer Notifications
            await NotificationService.dispatchOrderNotifications({
              userId: updatedOrder.userId,
              type: "ORDER",
              subject,
              body,
              metadata: { orderId: updatedOrder.id, orderStatus: "PAID" },
              channels: ["FCM", "WHATSAPP", "EMAIL"] // PAID is a key stage for Email
            });
            console.log(`[Stripe Webhook] Customer notification dispatched for order ${orderId}`);
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
