import { db } from "@/lib/db";
import { users, notifications, cartItems, orders, reviews } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ok, fail, withAuth } from "@/lib/proxy";
import { invalidateUserCache } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * DELETE /api/customer/account
 * Instant account deletion for the logged-in customer.
 * Manually nullifies userId in orders/reviews before deleting user row
 * to preserve historical data as "Anonymous User".
 */
export async function DELETE(req: Request) {
  return withAuth(req, async (user) => {
    const userId = user.id;

    try {
      // 1. Nullify userId in orders (preserves the order, shows as anonymous)
      await db.update(orders).set({ userId: null }).where(eq(orders.userId, userId));

      // 2. Nullify userId in reviews (preserves the review, shows as anonymous)
      await db.update(reviews).set({ userId: null }).where(eq(reviews.userId, userId));

      // 3. Delete notifications (no formal FK with cascade)
      await db.delete(notifications).where(eq(notifications.recipientId, userId));

      // 4. Delete cart items explicitly
      await db.delete(cartItems).where(eq(cartItems.userId, userId));

      // 5. Delete the user from the database
      const [deletedUser] = await db
        .delete(users)
        .where(eq(users.id, userId))
        .returning();

      if (!deletedUser) {
        return fail("User record not found in database.", 404);
      }

      // 6. Delete from Supabase Auth
      const adminClient = createAdminClient();
      const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
      
      if (authError) {
        console.error("[Account Deletion] Supabase Auth deletion failed:", authError);
        // We continue anyway since the DB record is gone, but log it.
      }

      // 7. Invalidate cache
      invalidateUserCache(userId);

      return ok({ message: "Account deleted successfully." });
    } catch (err) {
      console.error("[Account Deletion] Error:", err);
      return fail("Failed to delete account. Please try again later.", 500);
    }
  }, ["customer", "admin", "driver", "owner"]);
}
