import { firebaseApp } from "./firebase";
import { supabase } from "./supabase";

export async function requestNotificationPermission() {
  try {
    // ==========================================
    // CHỈ CHẠY TRÊN TRÌNH DUYỆT
    // ==========================================
    if (typeof window === "undefined") {
      console.log(
        "Notification chỉ chạy trên trình duyệt"
      );
      return null;
    }

    console.log("1. Bắt đầu đăng ký thông báo");

    // ==========================================
    // IMPORT FIREBASE MESSAGING SAU KHI ĐÃ Ở CLIENT
    // ==========================================
    const {
      getMessaging,
      getToken,
      isSupported,
    } = await import("firebase/messaging");

    // ==========================================
    // KIỂM TRA HỖ TRỢ
    // ==========================================
    const supported = await isSupported();

    console.log(
      "2. Firebase Messaging supported:",
      supported
    );

    if (!supported) {
      console.log(
        "Trình duyệt không hỗ trợ thông báo"
      );
      return null;
    }

    // ==========================================
    // KIỂM TRA ĐĂNG NHẬP
    // ==========================================
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("3. User:", user?.id);

    if (!user) {
      console.log("Chưa đăng nhập");
      return null;
    }

    // ==========================================
    // XIN QUYỀN THÔNG BÁO
    // ==========================================
    console.log(
      "4. Đang xin quyền thông báo"
    );

    const permission =
      await Notification.requestPermission();

    console.log(
      "5. Permission:",
      permission
    );

    if (permission !== "granted") {
      console.log(
        "Chưa cấp quyền thông báo"
      );
      return null;
    }

    // ==========================================
    // SERVICE WORKER
    // ==========================================
    console.log(
      "6. Đăng ký Service Worker"
    );

    const registration =
      await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );

    console.log(
      "7. Service Worker đã đăng ký:",
      registration
    );

    // ==========================================
    // LẤY FCM TOKEN
    // ==========================================
    console.log(
      "8. Đang lấy FCM token"
    );

    const messaging =
      getMessaging(firebaseApp);

    const token = await getToken(
      messaging,
      {
        vapidKey:
          process.env
            .NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration:
          registration,
      }
    );

    console.log(
      "9. FCM TOKEN:",
      token
    );

    if (!token) {
      console.log(
        "Không lấy được FCM token"
      );
      return null;
    }

    // ==========================================
    // LƯU TOKEN SUPABASE
    // ==========================================
    console.log(
      "10. Đang lưu token vào Supabase"
    );

    const { error } = await supabase
      .from("notification_tokens")
      .upsert(
        {
          user_id: user.id,
          token,
          device: navigator.userAgent,
        },
        {
          onConflict: "token",
        }
      );

    if (error) {
      console.error(
        "Lỗi lưu token Supabase:",
        JSON.stringify(
          error,
          null,
          2
        ),
        error
      );

      return null;
    }

    console.log(
      "11. Đã lưu token Supabase ✅"
    );

    return token;
  } catch (error) {
    console.error(
      "Lỗi đăng ký thông báo:",
      error
    );

    throw error;
  }
}