import { NextResponse } from "next/server";
import { messaging } from "@/lib/firebase-admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/debug/fcm-test?userId=<UUID>
 * Tests the full FCM chain: Admin SDK init → token lookup → send.
 * REMOVE this route before going to production.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const report: Record<string, unknown> = {};

  // 1. Check Admin SDK
  report.adminSdkInitialized = messaging !== null;
  if (!messaging) {
    return NextResponse.json({ 
      ok: false, 
      report, 
      error: "Firebase Admin SDK not initialized. Check FIREBASE_PRIVATE_KEY in .env" 
    });
  }

  // 2. Check token in DB
  if (userId) {
    const [user] = await db
      .select({ fcmToken: users.fcmToken, lastActive: users.lastActive })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    report.userFound = !!user;
    report.hasFcmToken = !!user?.fcmToken;
    report.fcmTokenPrefix = user?.fcmToken?.slice(0, 20) + "...";
    report.lastActive = user?.lastActive;

    if (!user?.fcmToken) {
      return NextResponse.json({ 
        ok: false, 
        report, 
        error: "No FCM token found for this user. Make sure the browser has granted notification permission." 
      });
    }

    // 3. Send a real test message
    try {
      const messageId = await messaging.send({
        token: user.fcmToken,
        notification: {
          title: "🔥 FCM Test — It Works!",
          body: "Your live order notifications are now active.",
        },
        data: {
          type: "ORDER",
          status: "PENDING_CONFIRMATION",
          orderId: "test-order-123",
        },
      });
      report.messageSent = true;
      report.messageId = messageId;
    } catch (err: any) {
      report.messageSent = false;
      report.sendError = err.message;
    }
  }

  return NextResponse.json({ ok: true, report });
}
