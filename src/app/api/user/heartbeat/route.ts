import { ok, fail } from "@/lib/proxy";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthId } from "@/lib/auth";

export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined;

  const userId = await getAuthId(token);

  if (!userId) {
    return fail("Unauthorized", 401);
  }

  try {
    await db
      .update(users)
      .set({ lastActive: new Date() })
      .where(eq(users.id, userId));

    return ok({ success: true });
  } catch (err) {
    console.error("Heartbeat error:", err);
    return fail("Internal Server Error", 500);
  }
}
