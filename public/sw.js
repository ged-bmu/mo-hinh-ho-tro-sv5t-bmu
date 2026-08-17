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
// PWA INSTALL / ACTIVATE
// ==========================================

self.addEventListener("install", (event) => {
  console.log("📦 Service Worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("🚀 Service Worker activated");

  event.waitUntil(
    self.clients.claim()
  );
});

// ==========================================
// FIREBASE BACKGROUND MESSAGE
// ==========================================

messaging.onBackgroundMessage((payload) => {
  console.log("📩 BACKGROUND MESSAGE:", payload);

  const title =
    payload.notification?.title ||
    "🔔 SV5T BMU";

  const body =
    payload.notification?.body ||
    "Bạn có thông báo mới.";

  self.registration.showNotification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: `sv5t-${Date.now()}`,
    renotify: true,
    data: {
      url: "/",
    },
  });
});

// ==========================================
// CLICK NOTIFICATION
// ==========================================

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});

// ==========================================
// FETCH
// ==========================================

self.addEventListener("fetch", () => {});