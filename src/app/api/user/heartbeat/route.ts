import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  return withAuth(req, async (user) => {
    try {
      await db
        .update(users)
        .set({ lastActive: new Date() })
        .where(eq(users.id, user.id));

      return ok({ success: true });
    } catch (err) {
      console.error("Heartbeat error:", err);
      return fail("Internal Server Error", 500);
    }
  });
}
