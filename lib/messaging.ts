import { getMessaging, getToken } from "firebase/messaging";
import { firebaseApp } from "./firebase";


export async function requestNotificationPermission() {

  // Kiểm tra có phải PWA không
  const isPWA =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true;


  if (!isPWA) {
    console.log(
      "Không phải PWA, bỏ qua thông báo"
    );
    return null;
  }


  // Xin quyền thông báo
  const permission =
    await Notification.requestPermission();


  if (permission !== "granted") {
    console.log(
      "Người dùng chưa cho phép thông báo"
    );
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


  console.log(
    "FCM TOKEN:",
    token
  );


  return token;
}