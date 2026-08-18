importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);

// ==========================================
// FIREBASE
// ==========================================

firebase.initializeApp({
  apiKey: "AIzaSyAwX9ZwnsgIuaomtvqGECh8kGjVstQkuoE",
  authDomain: "he-thong-ho-tro-sv5t-bmu.firebaseapp.com",
  projectId: "he-thong-ho-tro-sv5t-bmu",
  storageBucket: "he-thong-ho-tro-sv5t-bmu.firebasestorage.app",
  messagingSenderId: "268560960575",
  appId: "1:268560960575:web:afdbbc354ce650933ebc8a",
});

const messaging = firebase.messaging();

// ==========================================
// INSTALL
// ==========================================

self.addEventListener("install", (event) => {
  console.log("📦 Firebase Service Worker installed");
  self.skipWaiting();
});

// ==========================================
// ACTIVATE
// ==========================================

self.addEventListener("activate", (event) => {
  console.log("🚀 Firebase Service Worker activated");

  event.waitUntil(
    self.clients.claim()
  );
});

// ==========================================
// FIREBASE BACKGROUND MESSAGE
// ==========================================

messaging.onBackgroundMessage((payload) => {
  console.log("🔥🔥🔥 TEST SERVICE WORKER 123");
  console.log("📩 FCM FULL PAYLOAD:", payload);

  self.registration.showNotification(
    "🧪 TEST PWA",
    {
      body: "ĐÂY LÀ SERVICE WORKER MỚI",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
    }
  );
});

// ==========================================
// CLICK NOTIFICATION
// ==========================================

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url =
    event.notification?.data?.url ||
    "/";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {

      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});