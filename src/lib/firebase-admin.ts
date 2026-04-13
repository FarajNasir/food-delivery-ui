import * as admin from "firebase-admin";

/**
 * firebase-admin.ts - Server-side Firebase Admin SDK initialization.
 * Use this for sending FCM notifications, verifying tokens, etc.
 */

if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      console.warn("Firebase Admin environment variables are missing. Notifications will not be sent.");
    } else {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("Firebase Admin initialized successfully.");
    }
  } catch (error) {
    console.error("Firebase admin initialization error", error);
  }
}

export const messaging = admin.apps.length > 0 ? admin.messaging() : null;
export { admin };
