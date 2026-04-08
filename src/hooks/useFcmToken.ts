"use client";

import { useEffect, useState, useCallback } from "react";
import { getToken, onMessage, MessagePayload } from "firebase/messaging";
import { messaging, VAPID_KEY } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

export const useFcmToken = (userId: string | undefined) => {
  const [token, setToken] = useState<string | null>(null);
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<NotificationPermission>("default");
  const { session } = useAuthStore();

  const registerToken = useCallback(async (fcmToken: string) => {
    const currentSession = useAuthStore.getState().session;
    if (!currentSession) return;

    try {
      const response = await fetch("/api/user/fcm-token", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentSession.access_token}`
        },
        body: JSON.stringify({ token: fcmToken }),
      });
      if (!response.ok) throw new Error("Failed to register FCM token");
    } catch (err) {
      console.error("Error registering FCM token:", err);
    }
  }, []);

  useEffect(() => {
    if (!userId || typeof window === "undefined" || !messaging) return;

    const retrieveToken = async () => {
      try {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

          if (Notification.permission === "granted") {
            const currentToken = await getToken(messaging!, { 
              vapidKey: VAPID_KEY,
              serviceWorkerRegistration: registration 
            });
            if (currentToken) {
              setToken(currentToken);
              registerToken(currentToken);
            }
          } else if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            setNotificationPermissionStatus(permission);
            if (permission === "granted") {
              const currentToken = await getToken(messaging!, { 
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: registration
              });
              if (currentToken) {
                setToken(currentToken);
                registerToken(currentToken);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error retrieving FCM token:", error);
      }
    };

    retrieveToken();

    const unsubscribe = onMessage(messaging, (payload: MessagePayload) => {
      toast.info(payload.notification?.title || "New Notification", {
        description: payload.notification?.body,
        icon: "🔔",
      });

      if (payload.data?.type === "ORDER") {
        window.dispatchEvent(new CustomEvent("REFRESH_ORDERS"));
      }
    });

    return () => unsubscribe();
  }, [userId, registerToken]);

  return { token, notificationPermissionStatus };
};
