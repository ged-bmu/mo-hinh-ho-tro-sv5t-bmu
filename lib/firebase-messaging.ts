"use client";

import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { firebaseApp } from "./firebase";
import { supabase } from "./supabase";

export async function registerFCMToken() {
  try {
    // Trình duyệt có hỗ trợ Firebase Messaging không?
    const supported = await isSupported();

    if (!supported) {
      console.log("Trình duyệt không hỗ trợ Firebase Messaging");
      return null;
    }

    // Kiểm tra đăng nhập
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("Chưa đăng nhập");
      return null;
    }

    // Xin quyền thông báo
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Người dùng không cho phép thông báo");
      return null;
    }

    const messaging = getMessaging(firebaseApp);

    // Lấy FCM token
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration:
        await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js"
        ),
    });

    if (!token) {
      console.log("Không lấy được FCM token");
      return null;
    }

    console.log("FCM TOKEN:", token);

    // Lưu token vào Supabase
const { error } = await supabase.rpc(
  "save_notification_token",
  {
    p_token: token,
  }
);

if (error) {
  console.error(
    "Lỗi lưu notification token:",
    JSON.stringify(error, null, 2)
  );
}

    console.log("User hiện tại:", user?.id);
    console.log("FCM token:", token);
    console.log("Đã lưu FCM token");

    return token;
  } catch (error) {
    console.error(
      "Lỗi đăng ký FCM:",
      error
    );

    return null;
  }
}