import { NextResponse } from "next/server";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export async function GET() {
  try {
    const firebaseConfig = {
      apiKey: getRequiredEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
      authDomain: getRequiredEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
      projectId: getRequiredEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
      storageBucket: getRequiredEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
      messagingSenderId: getRequiredEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
      appId: getRequiredEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
      measurementId: getRequiredEnv("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID"),
    };

    const sw = `importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp(${JSON.stringify(firebaseConfig)});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload?.notification?.title || "Notification";
  const notificationOptions = {
    body: payload?.notification?.body || "You have a new update.",
    icon: "/icons/icon-192x192.png"
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
