import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "FCM token required" }, { status: 400 });
    }

    const userId = session.user.id;

    await db
      .update(users)
      .set({ fcmToken: token, lastActive: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("FCM Token Storage error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
