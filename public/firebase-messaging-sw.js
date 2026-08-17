importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyAwX9ZwnsgIuaomtvqGECh8kGjVstQkuoE",
  authDomain: "he-thong-ho-tro-sv5t-bmu.firebaseapp.com",
  projectId: "he-thong-ho-tro-sv5t-bmu",
  storageBucket: "he-thong-ho-tro-sv5t-bmu.firebasestorage.app",
  messagingSenderId: "268560960575",
  appId: "1:268560960575:web:afdbbc354ce650933ebc8a",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("📩 BACKGROUND MESSAGE:", payload);

  const title =
    payload.notification?.title || "🔔 SV5T BMU";

  const body =
    payload.notification?.body || "Bạn có thông báo mới.";

  self.registration.showNotification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",

    // Mỗi notification là một notification riêng
    tag: `sv5t-${Date.now()}`,

    renotify: true,

    data: {
      url: "/",
    },
  });
});