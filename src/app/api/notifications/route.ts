import { ok, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/notifications
 * Fetches the 15 most recent notifications for the currently logged-in user.
 */
export async function GET(req: Request) {
  return withAuth(req, async (user) => {
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(15);

    return ok({ notifications: userNotifications });
  });
}
