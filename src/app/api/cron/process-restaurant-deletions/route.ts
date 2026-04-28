import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { restaurants, orders, menuItems, users } from "@/lib/db/schema";
import { eq, and, lt, inArray } from "drizzle-orm";
import { NotificationService } from "@/services/notification.service";

export async function GET(req: Request) {
  // 1. Check for Cron Secret first (for automated jobs)
  const authHeader = req.headers.get("Authorization");
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (isCron) {
    return runProcessing();
  }

  // 2. Fallback to Admin session (for manual dashboard trigger)
  return withAuth(req, async (user) => {
    if (user.role !== "admin") return fail("Unauthorized", 401);
    return runProcessing();
  });
}

async function runProcessing() {
  try {
    // 2. Find restaurants pending deletion whose time has passed
    const now = new Date();
    const pendingDeletions = await db
      .select()
      .from(restaurants)
      .where(
        and(
          eq(restaurants.deletionStatus, "PENDING_DELETION"),
          lt(restaurants.deletionScheduledAt, now)
        )
      );

    let processedCount = 0;

    // 3. Process each restaurant
    for (const restaurant of pendingDeletions) {
      try {
        // Check for active orders
        const activeOrders = await db
          .select()
          .from(orders)
          .where(
            and(
              eq(orders.restaurantId, restaurant.id),
              inArray(orders.status, ["PENDING_CONFIRMATION", "CONFIRMED", "PREPARING"])
            )
          );

        if (activeOrders.length > 0) {
          console.warn(`[Cron] Skipping restaurant ${restaurant.id} (${restaurant.name}) - has active orders.`);
          continue;
        }

        // Execute permanent deletion
        await db.transaction(async (tx) => {
          // Set menu items unavailable
          await tx
            .update(menuItems)
            .set({ status: "unavailable" })
            .where(eq(menuItems.restaurantId, restaurant.id));

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
            .where(eq(restaurants.id, restaurant.id));
        });

        // Notify admins
        const admins = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.role, "admin"));

        await Promise.all(
          admins.map((admin) =>
            NotificationService.dispatchOrderNotifications({
              userId: admin.id,
              type: "SYSTEM",
              subject: "Restaurant Permanently Deleted",
              body: `${restaurant.name} has been permanently deleted after the 14-day waiting period.`,
              channels: ["FCM", "WHATSAPP"],
            })
          )
        );

        processedCount++;
      } catch (err) {
        console.error(`[Cron] Error processing deletion for restaurant ${restaurant.id}:`, err);
      }
    }

    return ok({ processed: processedCount });
  } catch (err) {
    console.error("[Cron] Error processing restaurant deletions:", err);
    return fail("Internal Server Error", 500);
  }
}
