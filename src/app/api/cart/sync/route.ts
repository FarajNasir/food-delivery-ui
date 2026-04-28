import { ok, fail, parseBody, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { cartItems, menuItems } from "@/lib/db/schema";
import { sql, and, eq } from "drizzle-orm";
import { z } from "zod";

const SyncSchema = z.object({
  items: z.array(z.object({
    menuItemId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })),
});

/**
 * POST /api/cart/sync
 * Merges a guest's localStorage cart into the logged-in user's DB cart.
 * Called automatically after login when guest cart items exist.
 */
export async function POST(req: Request) {
  return withAuth(req, async (user) => {
    try {
      const body = await parseBody(req, SyncSchema);
      if ("error" in body) return body.error;

      const { items } = body.data;
      let syncedCount = 0;

      for (const item of items) {
        /* 1. Verify item exists and is available */
        const [menuItem] = await db
          .select({ status: menuItems.status })
          .from(menuItems)
          .where(eq(menuItems.id, item.menuItemId))
          .limit(1);

        if (!menuItem || menuItem.status !== "available") {
          console.warn(`[cart/sync] Skipping unavailable/missing item: ${item.menuItemId}`);
          continue;
        }

        // Manual upsert: try update, then insert if not found.
        const [updated] = await db
          .update(cartItems)
          .set({
            quantity: sql`${cartItems.quantity} + ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(cartItems.userId, user.id),
              eq(cartItems.menuItemId, item.menuItemId)
            )
          )
          .returning();

        if (!updated) {
          await db.insert(cartItems).values({
            userId: user.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
          });
        }
        syncedCount++;
      }

      return ok({ message: `Synced ${syncedCount} guest cart items` });
    } catch (err) {
      console.error("[api/cart/sync POST]", err);
      return fail("Failed to sync cart.", 500);
    }
  });
}
