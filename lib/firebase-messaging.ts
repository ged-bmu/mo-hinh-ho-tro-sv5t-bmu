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
    // ==========================================
    // 1. KIỂM TRA FIREBASE MESSAGING
    // ==========================================

    const supported = await isSupported();

    if (!supported) {
      console.log(
        "❌ Trình duyệt không hỗ trợ Firebase Messaging"
      );

      return null;
    }

    // ==========================================
    // 2. KIỂM TRA USER
    // ==========================================

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("❌ Chưa đăng nhập");
      return null;
    }

    console.log("👤 USER ID:", user.id);

    // ==========================================
    // 3. QUYỀN THÔNG BÁO
    // ==========================================

    const permission =
      await Notification.requestPermission();

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
    // 4. FIREBASE MESSAGING
    // ==========================================

    const messaging =
      getMessaging(firebaseApp);

    // ==========================================
    // 5. ĐĂNG KÝ ĐÍCH DANH SERVICE WORKER
    // ==========================================

    const registration =
      await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );

    console.log(
      "✅ Firebase Service Worker:",
      registration.scope
    );

    // Chờ SW active
    await navigator.serviceWorker.ready;

    console.log(
      "🚀 Service Worker active:",
      registration.active?.scriptURL
    );

    // ==========================================
    // 6. LẤY FCM TOKEN
    // ==========================================

    const token = await getToken(messaging, {
      vapidKey:
        process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,

      serviceWorkerRegistration:
        registration,
    });

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
    // 7. LƯU TOKEN
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
    // 8. HOÀN TẤT
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