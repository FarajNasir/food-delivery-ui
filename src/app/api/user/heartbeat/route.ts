import { ok, fail, withAuth } from "@/lib/proxy";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  return withAuth(req, async (user) => {
    try {
      // 1. Fetch current lastActive to check if we need to update
      const [currentUser] = await db
        .select({ lastActive: users.lastActive })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

      // 2. Only update if lastActive is older than 1 minute
      if (!currentUser?.lastActive || currentUser.lastActive < oneMinuteAgo) {
        await db
          .update(users)
          .set({ lastActive: now })
          .where(eq(users.id, user.id));
        
        return ok({ success: true, updated: true });
      }

      return ok({ success: true, updated: false });
    } catch (err) {
      console.error("Heartbeat error:", err);
      return fail("Internal Server Error", 500);
    }
  });
}
