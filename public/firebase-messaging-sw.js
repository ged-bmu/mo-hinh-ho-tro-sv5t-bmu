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

  // Không tự showNotification ở đây.
  // Payload hiện tại đã có notification:
  //
  // notification: {
  //   title,
  //   body
  // }
  //
  // Firebase sẽ tự hiển thị notification khi PWA ở background.
});