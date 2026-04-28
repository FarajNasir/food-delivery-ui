import { ok, fail, withOwnerAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { restaurants, orders, users } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { NotificationService } from "@/services/notification.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: restaurantId } = await params;

  return withOwnerAuth(req, async (user) => {
    // 1. Verify restaurant belongs to owner
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId))
      .limit(1);

    if (!restaurant) return fail("Restaurant not found.", 404);
    
    // Admins can delete any restaurant, owners only their own
    if (user.role !== "admin" && restaurant.ownerId !== user.id) {
      return fail("Forbidden.", 403);
    }

    // 2. Check for active orders
    const activeOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          inArray(orders.status, ["PENDING_CONFIRMATION", "CONFIRMED", "PREPARING"])
        )
      );

    if (activeOrders.length > 0) {
      return fail(
        "Cannot delete restaurant with active orders. Please wait for all current orders to complete.",
        400
      );
    }

    // 3. Update restaurants table
    await db
      .update(restaurants)
      .set({
        deletionStatus: "PENDING_DELETION",
        deletionRequestedAt: new Date(),
        deletionScheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        isActive: false,
        status: "inactive",
      })
      .where(eq(restaurants.id, restaurantId));

    // 4. Notify all admins
    const admins = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "admin"));

    const notificationPromises = admins.map((admin) =>
      NotificationService.dispatchOrderNotifications({
        userId: admin.id,
        type: "SYSTEM",
        subject: "Restaurant Deletion Requested",
        body: `${restaurant.name} has been scheduled for deletion in 14 days. Requested by owner ${user.name || user.email}.`,
        channels: ["FCM", "WHATSAPP"],
      })
    );
    await Promise.all(notificationPromises);

    return ok({ message: "Restaurant deletion scheduled." });
  });
}
