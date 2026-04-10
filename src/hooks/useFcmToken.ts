"use client";

import { useEffect, useState, useCallback } from "react";
import { getToken, onMessage, MessagePayload } from "firebase/messaging";
import { messaging, VAPID_KEY } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { useOrderStore } from "@/store/useOrderStore";
import { useOwnerStore } from "@/store/useOwnerStore";
import { useAdminStore } from "@/store/useAdminStore";

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
        if (!("serviceWorker" in navigator)) return;

        await navigator.serviceWorker.register("/firebase-messaging-sw.js");

        // Wait for an active service worker before calling getToken.
        // Without this, getToken throws an AbortError because the SW
        // is still in the "installing" state when subscribe() is called.
        const registration = await navigator.serviceWorker.ready;

        const getAndRegisterToken = async () => {
          const currentToken = await getToken(messaging!, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration,
          });
          if (currentToken) {
            setToken(currentToken);
            registerToken(currentToken);
          }
        };

        if (Notification.permission === "granted") {
          await getAndRegisterToken();
        } else if (Notification.permission !== "denied") {
          const permission = await Notification.requestPermission();
          setNotificationPermissionStatus(permission);
          if (permission === "granted") {
            await getAndRegisterToken();
          }
        }
      } catch (error) {
        console.error("Error retrieving FCM token:", error);
      }
    };

    retrieveToken();

    const unsubscribe = onMessage(messaging!, (payload: MessagePayload) => {
      const isOrder = payload.data?.type === "ORDER";
      const isNewOrder = isOrder && (payload.data?.status === "PENDING_CONFIRMATION" || !payload.data?.status);

      // Play premium sound for all kitchen updates
      if (isOrder) {
        // playNotificationSound();
      }

      toast.success(payload.notification?.title || "New Kitchen Alert", {
        description: payload.notification?.body || "A live order update was received.",
        icon: isNewOrder ? "🔥" : "🔔",
        duration: isNewOrder ? 8000 : 4000,
      });

      if (isOrder) {
        const orderId = payload.data?.orderId;
        const status = payload.data?.status;

        if (orderId) {
          useOrderStore.getState().updateSingleOrder({ id: orderId, status });
          useOwnerStore.getState().updateSingleOrder({ id: orderId, status });
          useAdminStore.getState().updateSingleOrder({ id: orderId, status });
        } else {
          useOrderStore.getState().refreshOrders();
          useOwnerStore.getState().refreshOrders();
          useAdminStore.getState().refreshOrders();
        }
      }
    });

    return () => unsubscribe();
  }, [userId, registerToken]);

  return { token, notificationPermissionStatus };
};
