import { messaging } from "@/lib/firebase-admin";
import { db } from "@/lib/db";
import { notifications, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * notification.service.ts - Handles sending FCM notifications and tracking their status.
 */

export class NotificationService {
  /**
   * Processes a pending notification and sends it via FCM.
   */
  static async sendFCM(notificationId: string) {
    try {
      // 1. Fetch notification details
      const [notification] = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, notificationId))
        .limit(1);

      if (!notification) {
        console.error(`[NotificationService] Notification ${notificationId} not found.`);
        return;
      }

      if (notification.channel !== "FCM") {
        console.log(`[NotificationService] Notification ${notificationId} is not for FCM channel.`);
        return;
      }

      // 2. Fetch recipient's FCM token
      const [user] = await db
        .select({ fcmToken: users.fcmToken })
        .from(users)
        .where(eq(users.id, notification.recipientId))
        .limit(1);

      if (!user?.fcmToken) {
        console.warn(`[NotificationService] No FCM token found for user ${notification.recipientId}.`);
        await db
          .update(notifications)
          .set({ status: "FAILED" })
          .where(eq(notifications.id, notificationId));
        return;
      }

      if (!messaging) {
        console.error("[NotificationService] Firebase Messaging is not initialized.");
        return;
      }

      // 3. Send via FCM
      console.log(`[NotificationService] Sending FCM to token: ${user.fcmToken.slice(0, 10)}...`);
      
      const rawMetadata = (notification.metadata as Record<string, unknown>) || {};
      // FCM requires ALL data values to be strings — stringify everything
      const stringifiedMetadata: Record<string, string> = {};
      for (const [key, val] of Object.entries(rawMetadata)) {
        if (val !== null && val !== undefined) {
          stringifiedMetadata[key] = String(val);
        }
      }

      // Use the actual order status from metadata so clients update correctly.
      // e.g. payment notification → PAID, new order notification → PENDING_CONFIRMATION
      const orderStatus = stringifiedMetadata.orderStatus || "PENDING_CONFIRMATION";

      const message = {
        token: user.fcmToken,
        notification: {
          title: notification.subject,
          body: notification.body,
        },
        data: {
          type: notification.type,  // "ORDER"
          status: orderStatus,       // actual status from metadata
          ...stringifiedMetadata,    // orderId, orderStatus, etc. — all strings
        },
        webpush: {
          notification: {
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-192x192.png",
          },
        },
      };

      await messaging.send(message);

      // 4. Update status to SENT
      await db
        .update(notifications)
        .set({ status: "SENT" })
        .where(eq(notifications.id, notificationId));

      console.log(`[NotificationService] FCM sent successfully for notification ${notificationId}`);
    } catch (error) {
      console.error(`[NotificationService] Error sending FCM for ${notificationId}:`, error);
      
      // Update status to FAILED
      await db
        .update(notifications)
        .set({ status: "FAILED" })
        .where(eq(notifications.id, notificationId));
    }
  }

  /**
   * Helper to trigger a new notification send.
   * Can be called after inserting a notification row.
   */
  static trigger(notificationId: string) {
    // We run this without awaiting to not block the main request
    this.sendFCM(notificationId).catch(err => {
      console.error("[NotificationService] Background trigger failed:", err);
    });
  }
}
