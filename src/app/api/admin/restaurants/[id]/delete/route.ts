import { ok, fail, withAdminAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { restaurants, orders, menuItems } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { NotificationService } from "@/services/notification.service";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: restaurantId } = await params;

  return withAdminAuth(req, async (user) => {
    // 1. Fetch restaurant
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId))
      .limit(1);

    if (!restaurant) return fail("Restaurant not found.", 404);

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

    // 3. Permanent deletion immediately
    await db.transaction(async (tx) => {
      // Set all menu items to unavailable
      await tx
        .update(menuItems)
        .set({ status: "unavailable" })
        .where(eq(menuItems.restaurantId, restaurantId));

      // Update restaurant
      await tx
        .update(restaurants)
        .set({
          deletionStatus: "DELETED",
          isActive: false,
          name: "Deleted Restaurant",
          ownerId: null as any,
          deletionScheduledAt: null as any,
          status: "inactive",
        })
        .where(eq(restaurants.id, restaurantId));
    });

    // 4. Notify owner
    if (restaurant.ownerId) {
      await NotificationService.dispatchOrderNotifications({
        userId: restaurant.ownerId,
        type: "SYSTEM",
        subject: "Your Restaurant Has Been Removed",
        body: `${restaurant.name} has been permanently removed by the admin.`,
        channels: ["FCM", "WHATSAPP"],
      });
    }

    return ok({ message: "Restaurant permanently deleted." });
  });
}
