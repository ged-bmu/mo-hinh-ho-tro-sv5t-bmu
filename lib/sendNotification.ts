import { getMessaging } from "firebase-admin/messaging";
import { app } from "@/lib/firebase-admin";

const messaging = getMessaging(app);

export async function sendNotification(
  title: string,
  body: string,
  token: string
) {
  try {
    await messaging.send({
      token,

      data: {
        title,
        body,
        url: "https://sv5t.bmu.edu.vn",
      },

      webpush: {
        fcmOptions: {
          link: "https://sv5t.bmu.edu.vn",
        },
      },
    });

    console.log("Đã gửi notification ✅");
  } catch (error) {
    console.error(
      "Lỗi gửi notification:",
      error
    );
  }
}