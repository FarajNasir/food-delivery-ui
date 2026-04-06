import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAOjpFFYZVudCpBt37eVD29vKjDWIWqVoc",
  authDomain: "food-delivery-a8c30.firebaseapp.com",
  projectId: "food-delivery-a8c30",
  storageBucket: "food-delivery-a8c30.firebasestorage.app",
  messagingSenderId: "255628944215",
  appId: "1:255628944215:web:db465fc52b5d13b39cd412",
  measurementId: "G-PQ7Y0CD7VP"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let messaging: Messaging | null = null;
if (typeof window !== "undefined") {
  messaging = getMessaging(app);
}

export { app, messaging };
export const VAPID_KEY = "BIfzvbzB2AN0y52qYDkHHBYVVvKDIoAGGYS-nMOLQ706Z5BeMOe6Nm0TPdm8lFMtgbLU_RmQ5SLY55V3fXi17Uw";
