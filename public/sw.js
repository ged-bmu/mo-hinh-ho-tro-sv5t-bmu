// ==========================================
// PWA SERVICE WORKER
// ==========================================

self.addEventListener("install", (event) => {
  console.log("📦 PWA Service Worker installed");

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("🚀 PWA Service Worker activated");

  event.waitUntil(
    self.clients.claim()
  );
});

// ==========================================
// FETCH
// ==========================================

self.addEventListener("fetch", (event) => {
  // Để trình duyệt xử lý request bình thường.
});