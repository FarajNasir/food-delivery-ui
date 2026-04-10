import { ok, fail, parseBody, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { cartItems } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
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
        // Atomic upsert avoids race conditions when sync is triggered concurrently.
        await db
          .insert(cartItems)
          .values({
            userId: user.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
          })
          .onConflictDoUpdate({
            target: [cartItems.userId, cartItems.menuItemId],
            set: {
              quantity: sql`${cartItems.quantity} + ${item.quantity}`,
              updatedAt: new Date(),
            },
          });
      }

      return ok({ message: `Synced ${items.length} guest cart items` });
    } catch (err) {
      console.error("[api/cart/sync POST]", err);
      return fail("Failed to sync cart.", 500);
    }
  });
}
