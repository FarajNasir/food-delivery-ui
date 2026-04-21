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
      const role = useAuthStore.getState().role;
      const incomingTitle = payload.notification?.title || "";
      const incomingBody = payload.notification?.body || "";

      const ownerAdminToast = (() => {
        if (!isOrder) {
          return {
            title: incomingTitle || "Notification",
            description: incomingBody || "A new update is available.",
          };
        }

        if (isNewOrder) {
          return {
            title: "New order received",
            description: "A customer placed a new order.",
          };
        }

        const orderStatus = payload.data?.status;
        if (orderStatus === "PAID") {
          return {
            title: "Payment received",
            description: "An order payment was confirmed.",
          };
        }

        return {
          title: "Order update",
          description: "An order status was updated.",
        };
      })();

      toast.success(role === "owner" || role === "admin" ? ownerAdminToast.title : (incomingTitle || "New Kitchen Alert"), {
        description: role === "owner" || role === "admin"
          ? ownerAdminToast.description
          : (incomingBody || "A live order update was received."),
        duration: 3000,
      });

      if (isOrder) {
        const orderId = payload.data?.orderId;
        const status = payload.data?.status;
        // Role already resolved above — only dispatch to relevant stores to avoid 403 errors

        if (orderId) {
          // Customer order store — always update (customer tracks their own orders)
          useOrderStore.getState().updateSingleOrder({ id: orderId, status });

          // Owner store — only if the user is an owner or admin
          if (role === "owner" || role === "admin") {
            useOwnerStore.getState().updateSingleOrder({ id: orderId, status });
          }

          // Admin store — only if the user is an admin (avoids 403 for owners)
          if (role === "admin") {
            useAdminStore.getState().updateSingleOrder({ id: orderId, status });
          }
        } else {
          useOrderStore.getState().refreshOrders();
          if (role === "owner" || role === "admin") {
            useOwnerStore.getState().refreshOrders();
          }
          if (role === "admin") {
            useAdminStore.getState().refreshOrders();
          }
        }
      }
    });

    return () => unsubscribe();
  }, [userId, registerToken]);

  return { token, notificationPermissionStatus };
};
