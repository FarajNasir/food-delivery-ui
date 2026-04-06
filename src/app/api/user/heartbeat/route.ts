import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    await db
      .update(users)
      .set({ lastActive: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Heartbeat error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
