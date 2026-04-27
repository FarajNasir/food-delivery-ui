import { ok, fail, parseBody, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { cartItems } from "@/lib/db/schema";
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

      for (const item of items) {
        // Manual upsert: try update, then insert if not found.
        // This is safer if the unique constraint hasn't been migrated to the DB yet.
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
      }

      return ok({ message: `Synced ${items.length} guest cart items` });
    } catch (err) {
      console.error("[api/cart/sync POST]", err);
      return fail("Failed to sync cart.", 500);
    }
  });
}
