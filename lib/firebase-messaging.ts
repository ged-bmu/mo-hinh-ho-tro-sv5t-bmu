import {
  getMessaging,
  getToken,
  isSupported,
} from "firebase/messaging";

import { firebaseApp } from "./firebase";
import { supabase } from "./supabase";

export async function registerFCMToken() {
  try {
    // ==========================================
    // 1. KIỂM TRA TRÌNH DUYỆT
    // ==========================================

    const supported = await isSupported();

    if (!supported) {
      console.log(
        "❌ Trình duyệt không hỗ trợ Firebase Messaging"
      );

      return null;
    }

    // ==========================================
    // 2. XIN QUYỀN NGAY TỪ HÀNH ĐỘNG CLICK
    // ==========================================

    let permission: NotificationPermission;

    if (Notification.permission === "granted") {
      permission = "granted";
    } else {
      console.log(
        "📱 ĐANG XIN QUYỀN THÔNG BÁO..."
      );

      permission =
        await Notification.requestPermission();
    }

    console.log(
      "📱 NOTIFICATION PERMISSION:",
      permission
    );

    if (permission !== "granted") {
      console.log(
        "❌ Người dùng không cho phép thông báo"
      );

      return null;
    }

    // ==========================================
    // 3. KIỂM TRA USER
    // ==========================================

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("❌ Chưa đăng nhập");
      return null;
    }

    console.log(
      "👤 USER ID:",
      user.id
    );

    // ==========================================
    // 4. FIREBASE MESSAGING
    // ==========================================

    const messaging =
      getMessaging(firebaseApp);

    // ==========================================
    // 5. LẤY / ĐĂNG KÝ SERVICE WORKER
    // ==========================================

    let registration =
      await navigator.serviceWorker.getRegistration(
        "/"
      );

    if (!registration) {
      console.log(
        "📦 Chưa có Service Worker → đăng ký..."
      );

      registration =
        await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
          {
            scope: "/",
          }
        );
    } else {
      console.log(
        "♻️ Đã có Firebase Service Worker"
      );
    }

    console.log(
      "✅ Firebase Service Worker:",
      registration.scope
    );

    // ==========================================
    // 6. CHỜ SERVICE WORKER ACTIVE
    // ==========================================

    await navigator.serviceWorker.ready;

    console.log(
      "🚀 Service Worker active:",
      registration.active?.scriptURL
    );

    // ==========================================
    // 7. LẤY FCM TOKEN
    // ==========================================

    const vapidKey =
      process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    if (!vapidKey) {
      console.error(
        "❌ Thiếu NEXT_PUBLIC_FIREBASE_VAPID_KEY"
      );

      return null;
    }

    const token = await getToken(
      messaging,
      {
        vapidKey,
        serviceWorkerRegistration:
          registration,
      }
    );

    if (!token) {
      console.log(
        "❌ Không lấy được FCM token"
      );

      return null;
    }

    console.log(
      "📱 FCM TOKEN:",
      token
    );

    // ==========================================
    // 8. LƯU TOKEN SUPABASE
    // ==========================================

    const { error } =
      await supabase.rpc(
        "save_notification_token",
        {
          p_token: token,
        }
      );

    if (error) {
      console.error(
        "❌ Lỗi lưu notification token:",
        JSON.stringify(
          error,
          null,
          2
        )
      );

      return null;
    }

    // ==========================================
    // 9. HOÀN TẤT
    // ==========================================

    console.log(
      "✅ Đã lưu FCM token cho user:",
      user.id
    );

    return token;

  } catch (error) {
    console.error(
      "❌ Lỗi đăng ký FCM:",
      error
    );

    return null;
  }
}