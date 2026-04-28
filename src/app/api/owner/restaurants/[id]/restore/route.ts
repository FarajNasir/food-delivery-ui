import { ok, fail, withOwnerAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { restaurants, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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
    
    if (user.role !== "admin" && restaurant.ownerId !== user.id) {
      return fail("Forbidden.", 403);
    }

    // 2. Check deletionStatus
    if (restaurant.deletionStatus !== "PENDING_DELETION") {
      return fail("Restaurant is not scheduled for deletion.", 400);
    }

    // 3. Update restaurants table
    await db
      .update(restaurants)
      .set({
        deletionStatus: null,
        deletionRequestedAt: null,
        deletionScheduledAt: null,
        isActive: true,
        status: "active",
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
        subject: "Restaurant Deletion Cancelled",
        body: `${restaurant.name} deletion has been cancelled by the owner.`,
        channels: ["FCM", "WHATSAPP"],
      })
    );
    await Promise.all(notificationPromises);

    return ok({ message: "Restaurant restored successfully." });
  });
}
