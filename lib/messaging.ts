import { getMessaging, getToken } from "firebase/messaging";
import { firebaseApp } from "./firebase";
import { supabase } from "./supabase";


export async function requestNotificationPermission() {

  const permission =
    await Notification.requestPermission();


  if (permission !== "granted") {
    console.log("Chưa cấp quyền thông báo");
    return null;
  }


  const {
    data: {
      user
    }
  } = await supabase.auth.getUser();


  if (!user) {
    console.log("Chưa đăng nhập");
    return null;
  }


  const messaging =
    getMessaging(firebaseApp);


  const token =
    await getToken(
      messaging,
      {
        vapidKey:
          process.env
          .NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      }
    );


  if (!token) {
    console.log("Không lấy được FCM token");
    return null;
  }


  console.log(
    "FCM TOKEN:",
    token
  );


  // lưu token vào Supabase
  const { error } =
    await supabase
      .from("notification_tokens")
      .upsert(
        {
          user_id: user.id,
          token: token,
          device:
            navigator.userAgent,
        },
        {
          onConflict: "token",
        }
      );


  if (error) {
    console.log(
      "Lỗi lưu token:",
      error
    );
  } else {
    console.log(
      "Đã lưu token Supabase ✅"
    );
  }


  return token;
}
