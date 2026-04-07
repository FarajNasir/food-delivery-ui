import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { cartItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/* ── POST /api/cart/clear ── */
export async function POST(req: Request) {
  return withAuth(req, async (user) => {
    try {
      await db
        .delete(cartItems)
        .where(eq(cartItems.userId, user.id));

      return ok({ message: "Cart cleared" });
    } catch (err) {
      console.error("[api/cart/clear POST]", err);
      return fail("Failed to clear cart.", 500);
    }
  });
}
