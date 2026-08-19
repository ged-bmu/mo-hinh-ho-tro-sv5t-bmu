"use client";

import {
  getMessaging,
  getToken,
  isSupported,
} from "firebase/messaging";

import { firebaseApp } from "./firebase";
import { supabase } from "./supabase";

export async function registerFCMToken() {
  try {
    // Chỉ chạy ở browser
    if (typeof window === "undefined") {
      return null;
    }

    if (!("Notification" in window)) {
      console.log("❌ Browser không hỗ trợ Notification");
      return null;
    }

    if (!("serviceWorker" in navigator)) {
      console.log("❌ Browser không hỗ trợ Service Worker");
      return null;
    }

    // ==========================================
    // 1. KIỂM TRA FIREBASE MESSAGING
    // ==========================================

    const supported = await isSupported();

    if (!supported) {
      console.log("❌ Firebase Messaging không được hỗ trợ");
      return null;
    }

    // ==========================================
    // 2. USER
    // ==========================================

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("❌ Chưa đăng nhập");
      return null;
    }

    // ==========================================
    // 3. XIN QUYỀN
    // ==========================================

    let permission = Notification.permission;

    if (permission !== "granted") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      console.log("❌ Không được cấp quyền thông báo");
      return null;
    }

    // ==========================================
    // 4. FIREBASE MESSAGING
    // ==========================================

    const messaging = getMessaging(firebaseApp);

    // ==========================================
    // 5. SERVICE WORKER
    // ==========================================

    let registration =
      await navigator.serviceWorker.getRegistration(
        "/firebase-messaging-sw.js"
      );

    if (!registration) {
      registration =
        await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
          {
            scope: "/",
          }
        );
    }

    // Chờ SW sẵn sàng
    registration =
      await navigator.serviceWorker.ready;

    console.log(
      "✅ SW:",
      registration.active?.scriptURL
    );

    // ==========================================
    // 6. VAPID KEY
    // ==========================================

    const vapidKey =
      process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    if (!vapidKey) {
      console.error(
        "❌ Thiếu NEXT_PUBLIC_FIREBASE_VAPID_KEY"
      );
      return null;
    }

    // ==========================================
    // 7. FCM TOKEN
    // ==========================================

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.log("❌ Không lấy được FCM token");
      return null;
    }

    console.log("✅ FCM TOKEN ĐÃ LẤY");

    // ==========================================
    // 8. LƯU SUPABASE
    // ==========================================
    const deviceName =
  (navigator as any).userAgentData?.model ||
  navigator.platform ||
  "Unknown Device";

const { error } = await supabase.rpc(
  "save_notification_token",
  {
    p_token: token,
    p_device_name: deviceName,
  }
);

    if (error) {
      console.error(
        "❌ Lưu FCM token thất bại:",
        error
      );

      return null;
    }

    console.log("✅ FCM TOKEN ĐÃ LƯU");

    return token;

  } catch (error) {
    console.error(
      "❌ registerFCMToken ERROR:",
      error
    );

    return null;
  }
}