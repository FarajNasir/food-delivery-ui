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
      console.log("[useFcmToken] Received message:", payload);
      const isOrder = payload.data?.type === "ORDER";
      const isNewOrder = isOrder && (payload.data?.status === "PENDING_CONFIRMATION" || !payload.data?.status);
      const role = useAuthStore.getState().role;
      const incomingTitle = payload.notification?.title || "";
      const incomingBody = payload.notification?.body || "";
      const targetRole = payload.data?.targetRole; // 'owner' or 'customer'

      // Determine if this is a merchant-specific alert based on metadata or current role fallback
      const isMerchantAlert = targetRole 
        ? (targetRole === "owner" || targetRole === "admin")
        : (role === "owner" || role === "admin");

      const toastContent = (() => {
        // High priority: If we have an explicit targetRole and it's merchant, we might want to standardize
        // generic statuses like PENDING_CONFIRMATION for a cleaner UI, BUT we should still prefer server text.
        if (isMerchantAlert) {
          // Fallback logic for merchant alerts
          if (isNewOrder) {
            return {
              title: incomingTitle || "New order received",
              description: incomingBody || "A customer placed a new order.",
            };
          }
          const orderStatus = payload.data?.status;
          if (orderStatus === "PAID") {
            return {
              title: incomingTitle || "Payment received",
              description: incomingBody || "An order payment was confirmed.",
            };
          }
          return {
            title: incomingTitle || "Order update",
            description: incomingBody || "An order status was updated.",
          };
        }

        // Customer or un-flagged alert: always trust the server's copy entirely
        return {
          title: incomingTitle || "Live Update",
          description: incomingBody || "A live order update was received.",
        };
      })();

      if (!isMerchantAlert) {
        toast.success(toastContent.title, {
          description: toastContent.description,
          duration: 3000,
        });
      }

      if (isOrder) {
        const orderId = payload.data?.orderId;
        const status = payload.data?.status || payload.data?.orderStatus;
        
        console.log(`[useFcmToken] Order update detected. ID: ${orderId}, Status: ${status}, TargetRole: ${targetRole}`);

        if (orderId && status) {
          // Customer order store
          if (targetRole !== "owner" && targetRole !== "admin") {
            console.log(`[useFcmToken] Updating Customer Order Store for ${orderId}`);
            useOrderStore.getState().updateSingleOrder({ id: orderId, status });
          }

          // Owner store — only update if the notification was targeted at the customer,
          // NOT the owner. When the owner changes a status, their own store is already
          // updated via the optimistic update + API response. Applying the FCM echo
          // (which carries the OLD or INTERMEDIATE status) would cause the card to bounce.
          if ((role === "owner" || role === "admin") && targetRole !== "owner" && targetRole !== "admin") {
            useOwnerStore.getState().updateSingleOrder({ id: orderId, status });
          }

          // Admin store — only if the user is an admin (avoids 403 for owners)
          if (role === "admin" && targetRole !== "admin") {
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
