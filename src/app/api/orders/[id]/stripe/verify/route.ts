import { ok, fail } from "@/lib/proxy";
import { db } from "@/lib/db";
import { orders, restaurants, users, notifications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * POST /api/orders/[id]/stripe/verify
 * Verifies a Stripe Checkout Session status and updates the order if paid.
 * This acts as a fallback for webhooks that might be missed in local dev.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { sessionId } = await req.json();

    if (!sessionId) {
      return fail("Missing session_id", 400);
    }

    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", 401);

    // 1. Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return fail("Payment not completed", 400);
    }

    // 2. Fetch the order to ensure it belongs to the user and needs updating
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, id), eq(orders.userId, user.id)),
    });

    if (!order) {
      return fail("Order not found.", 404);
    }

    // 3. Update status if not already PAID
    if (order.status !== "PAID") {
      await db
        .update(orders)
        .set({ 
          status: "PAID",
          updatedAt: new Date()
        })
        .where(eq(orders.id, id));

      // 4. Notify Restaurant Owner (same logic as webhook)
      const [restaurant] = await db
        .select({ 
          ownerId: restaurants.ownerId, 
          name: restaurants.name 
        })
        .from(restaurants)
        .where(eq(restaurants.id, order.restaurantId))
        .limit(1);

      if (restaurant) {
        const [owner] = await db
          .select({ lastActive: users.lastActive })
          .from(users)
          .where(eq(users.id, restaurant.ownerId))
          .limit(1);

        const isActive = owner?.lastActive && (Date.now() - new Date(owner.lastActive).getTime() < 60000);

        await db.insert(notifications).values({
          recipientId: restaurant.ownerId,
          type: "ORDER",
          subject: "Payment Received! 💰",
          body: `Payment for Order #${order.id.slice(0, 8)} at ${restaurant.name} has been confirmed. You can now begin preparation.`,
          channel: isActive ? "FCM" : "WHATSAPP",
          status: "PENDING",
          metadata: { orderId: order.id }
        });
      }
      
      console.log(`[Stripe Verify] Order ${id} marked as PAID via frontend verify.`);
    }

    return ok({ status: "PAID" });
  } catch (err: any) {
    console.error("[api/orders/[id]/stripe/verify POST] ERROR:", err.message || err);
    return fail(`Verification Error: ${err.message || "Unknown error"}`, 500);
  }
}
