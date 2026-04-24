import { messaging } from "@/lib/firebase-admin";
import { db } from "@/lib/db";
import { notifications, users, type notificationTypeEnum, type notificationChannelEnum } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import sgMail from "@sendgrid/mail";
// Require twilio; gracefully handle if not installed
let twilioClient: any = null;
try {
  const twilio = require("twilio");
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  if (twilioAccountSid && twilioAuthToken) {
    twilioClient = twilio(twilioAccountSid, twilioAuthToken);
  }
} catch (e) {
  console.warn("[NotificationService] Twilio package not found. WhatsApp notifications will not be sent.");
}

const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * notification.service.ts - Handles sending FCM notifications and tracking their status.
 */

export class NotificationService {
  /**
   * Processes a pending notification and sends it via FCM.
   */
  static async sendFCM(notificationId: string) {
    try {
      // 1. Fetch notification and recipient details in a single JOIN
      const [result] = await db
        .select({
          notification: notifications,
          user: {
            fcmToken: users.fcmToken
          }
        })
        .from(notifications)
        .innerJoin(users, eq(notifications.recipientId, users.id))
        .where(eq(notifications.id, notificationId))
        .limit(1);

      if (!result) {
        console.error(`[NotificationService] Notification or User for ${notificationId} not found.`);
        return;
      }

      const { notification, user } = result;

      if (notification.channel !== "FCM") {
        console.log(`[NotificationService] Notification ${notificationId} is not for FCM channel.`);
        return;
      }

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
   * Processes a pending notification and sends it via WhatsApp.
   */
  static async sendWhatsApp(notificationId: string) {
    try {
      const [result] = await db
        .select({
          notification: notifications,
          user: {
            phone: users.phone
          }
        })
        .from(notifications)
        .innerJoin(users, eq(notifications.recipientId, users.id))
        .where(eq(notifications.id, notificationId))
        .limit(1);

      if (!result) {
        console.error(`[NotificationService] Notification or User for ${notificationId} not found.`);
        return;
      }

      const { notification, user } = result;

      if (notification.channel !== "WHATSAPP") {
        console.log(`[NotificationService] Notification ${notificationId} is not for WHATSAPP channel.`);
        return;
      }

      if (!user?.phone) {
        console.warn(`[NotificationService] No phone number found for user ${notification.recipientId}. WhatsApp skipped.`);
        await db
          .update(notifications)
          .set({ status: "FAILED" })
          .where(eq(notifications.id, notificationId));
        return;
      }

      // Normalize phone: remove non-digits, ensure + prefix.
      const cleaned = user.phone.replace(/\D/g, "");
      const toPhone = user.phone.startsWith("+") ? `+${cleaned}` : `+${cleaned}`;

      if (!twilioClient || !twilioWhatsAppNumber) {
        console.error("[NotificationService] Twilio is not configured properly (missing client or number env vars).");
        await db
          .update(notifications)
          .set({ status: "FAILED" })
          .where(eq(notifications.id, notificationId));
        return;
      }

      const messageBody = `*${notification.subject}*\n\n${notification.body}`;
      console.log(`[NotificationService] Sending WhatsApp to ${toPhone}. Body:\n${messageBody}`);

      await twilioClient.messages.create({
        from: `whatsapp:${twilioWhatsAppNumber}`,
        to: `whatsapp:${toPhone}`,
        body: messageBody,
      });

      await db
        .update(notifications)
        .set({ status: "SENT" })
        .where(eq(notifications.id, notificationId));

      console.log(`[NotificationService] WhatsApp sent successfully for notification ${notificationId}`);
    } catch (error) {
      console.error(`[NotificationService] Error sending WhatsApp for ${notificationId}:`, error);
      
      await db
        .update(notifications)
        .set({ status: "FAILED" })
        .where(eq(notifications.id, notificationId));
    }
  }

  /**
   * Processes a pending notification and sends it via SendGrid Email.
   */
  static async sendEmail(notificationId: string) {
    try {
      const [result] = await db
        .select({
          notification: notifications,
          user: {
            email: users.email
          }
        })
        .from(notifications)
        .innerJoin(users, eq(notifications.recipientId, users.id))
        .where(eq(notifications.id, notificationId))
        .limit(1);

      if (!result) {
        console.error(`[NotificationService] Notification or User for ${notificationId} not found.`);
        return;
      }

      const { notification, user } = result;

      if (notification.channel !== "EMAIL") {
        console.log(`[NotificationService] Notification ${notificationId} is not for EMAIL channel.`);
        return;
      }

      if (!user?.email) {
        console.warn(`[NotificationService] No email found for user ${notification.recipientId}. EMAIL skipped.`);
        await db
          .update(notifications)
          .set({ status: "FAILED" })
          .where(eq(notifications.id, notificationId));
        return;
      }

      const fromEmail = process.env.SENDGRID_FROM_EMAIL;
      if (!fromEmail) {
        console.error("[NotificationService] SENDGRID_FROM_EMAIL is not configured.");
        await db
          .update(notifications)
          .set({ status: "FAILED" })
          .where(eq(notifications.id, notificationId));
        return;
      }

      console.log(`[NotificationService] Sending Email to ${user.email}. Subject: ${notification.subject}`);

      const msg = {
        to: user.email,
        from: fromEmail,
        subject: notification.subject,
        text: notification.body,
        html: notification.body.replace(/\n/g, "<br/>"), // Simple text to HTML fallback
      };

      const [response] = await sgMail.send(msg);
      console.log(`[NotificationService] SendGrid response: ${response.statusCode}`);

      await db
        .update(notifications)
        .set({ status: "SENT" })
        .where(eq(notifications.id, notificationId));

      console.log(`[NotificationService] Email sent successfully for notification ${notificationId}`);
    } catch (error) {
      console.error(`[NotificationService] Error sending Email for ${notificationId}:`, error);
      
      await db
        .update(notifications)
        .set({ status: "FAILED" })
        .where(eq(notifications.id, notificationId));
    }
  }

  /**
   * Central helper to dispatch notifications across multiple channels.
   * Ensures consistency and reduces boilerplate in API routes.
   */
  static async dispatchOrderNotifications(params: {
    userId: string;
    type: (typeof notificationTypeEnum)[number];
    subject: string;
    body: string;
    metadata?: any;
    channels?: (typeof notificationChannelEnum)[number][];
  }) {
    const { userId, type, subject, body, metadata, channels = ["FCM", "WHATSAPP"] } = params;

    console.log(`[NotificationService] Dispatching ${channels.length} notifications to user ${userId} (Type: ${type})`);

    const results = [];
    for (const channel of channels) {
      try {
        const [notif] = await db.insert(notifications).values({
          recipientId: userId,
          type,
          subject,
          body,
          channel,
          status: "PENDING",
          metadata,
        }).returning();

        if (notif) {
          this.trigger(notif.id);
          results.push(notif.id);
        }
      } catch (err) {
        console.error(`[NotificationService] Failed to insert ${channel} notification:`, err);
      }
    }
    return results;
  }

  /**
   * Helper to trigger a new notification send.
   * Can be called after inserting a notification row.
   */
  static trigger(notificationId: string) {
    const run = async () => {
      const [notif] = await db
        .select({ channel: notifications.channel })
        .from(notifications)
        .where(eq(notifications.id, notificationId))
        .limit(1);

      if (!notif) {
        console.warn(`[NotificationService] Trigger failed: Notification ${notificationId} not found.`);
        return;
      }

      console.log(`[NotificationService] Triggering channel ${notif.channel} for notification ${notificationId}`);

      if (notif.channel === "FCM") {
        await this.sendFCM(notificationId);
      } else if (notif.channel === "WHATSAPP") {
        await this.sendWhatsApp(notificationId);
      } else if (notif.channel === "EMAIL") {
        await this.sendEmail(notificationId);
      }
    };

    run().catch(err => {
      console.error("[NotificationService] Background trigger failed:", err);
    });
  }
}
