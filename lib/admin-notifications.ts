
"use client";

import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { firebaseApp } from "./firebase";
import { supabase } from "./supabase";

async function getAdminToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

async function getFCMToken() {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window)) return null;
  if (!(await isSupported())) return null;

  if (Notification.permission !== "granted") return null;

  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js"
  );

  const messaging = getMessaging(firebaseApp);

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

  if (!vapidKey) throw new Error("Thiếu VAPID key");

  return await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
}

async function callAdminNotificationAPI(
  method: string,
  token: string
) {
  const accessToken = await getAdminToken();

  if (!accessToken) throw new Error("Bạn chưa đăng nhập");

  const url =
  method === "GET"
    ? `/api/admin/device-notifications?token=${encodeURIComponent(token)}`
    : "/api/admin/device-notifications";

const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body:
      method === "GET"
        ? undefined
        : JSON.stringify({ token, deviceName: navigator.userAgent }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Không thể cập nhật thông báo");
  }

  return data;
}

// Kiểm tra trạng thái thiết bị hiện tại
export async function checkAdminNotificationStatus() {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return false;
  }

  const token = await getFCMToken();

  if (!token) return false;

  const data = await callAdminNotificationAPI("GET", token);

  return !!data.enabled;
}

// Bật thông báo cho thiết bị hiện tại
export async function enableAdminNotifications() {
  if (typeof window === "undefined") {
    throw new Error("Không thể thực hiện trên thiết bị này");
  }

  if (!("Notification" in window)) {
    throw new Error("Trình duyệt không hỗ trợ thông báo");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Bạn chưa cấp quyền thông báo");
  }

  const token = await getFCMToken();

  if (!token) throw new Error("Không lấy được FCM token");

  await callAdminNotificationAPI("POST", token);

  return true;
}

// Tắt thông báo cho thiết bị hiện tại
export async function disableAdminNotifications() {
  const token = await getFCMToken();

  if (!token) return true;

  await callAdminNotificationAPI("DELETE", token);

  return true;
}
