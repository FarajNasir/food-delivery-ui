import { NextResponse } from "next/server";

export async function GET() {
  try {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

    const sw = `importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp(${JSON.stringify(firebaseConfig)});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw] Received background message:", payload);
  
  // Extract from data since we use data-only messages for foreground reliability
  const notificationTitle = payload?.data?.title || payload?.notification?.title || "New Update";
  const notificationOptions = {
    body: payload?.data?.body || payload?.notification?.body || "You have a new update.",
    icon: "/icons/icon-192x192.png",
    data: payload.data, // pass data for click handling
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});`;

    return new NextResponse(sw, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store",
        "Service-Worker-Allowed": "/",
      },
    });
  } catch (error) {
    console.error("[firebase-messaging-sw] Failed to generate service worker:", error);
    return new NextResponse("/* Failed to generate firebase messaging service worker */", {
      status: 500,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
