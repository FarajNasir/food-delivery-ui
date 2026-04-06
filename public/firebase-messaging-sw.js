importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAOjpFFYZVudCpBt37eVD29vKjDWIWqVoc",
  authDomain: "food-delivery-a8c30.firebaseapp.com",
  projectId: "food-delivery-a8c30",
  storageBucket: "food-delivery-a8c30.firebasestorage.app",
  messagingSenderId: "255628944215",
  appId: "1:255628944215:web:db465fc52b5d13b39cd412",
  measurementId: "G-PQ7Y0CD7VP"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);
  // Customize notification here if needed
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icons/icon-192x192.png" // Replace with actual path
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
