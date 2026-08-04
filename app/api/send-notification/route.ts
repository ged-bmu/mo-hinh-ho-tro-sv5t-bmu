import { NextResponse } from "next/server";
import { app } from "@/lib/firebase-admin";
import { getMessaging } from "firebase-admin/messaging";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const title = body.title || "🔔 SV5T BMU";
    const message = body.message || "Bạn có một thông báo mới.";
    
    const userId = body.userId;

if (!userId) {
  return NextResponse.json(
    {
      error: "Thiếu userId",
    },
    { status: 400 }
  );
}

const { data, error } = await supabase
  .from("notification_tokens")
  .select("token")
  .eq("user_id", userId);

    if (error) {
      console.error("Lỗi lấy token:", error);

      return NextResponse.json(
        {
          error: "Không thể lấy danh sách token",
        },
        { status: 500 }
      );
    }

    const tokens = data?.map((item) => item.token).filter(Boolean) || [];

    if (tokens.length === 0) {
      return NextResponse.json({
        message: "Không có thiết bị nào đăng ký nhận thông báo.",
        count: 0,
      });
    }

    // Gửi thông báo
    const response = await getMessaging(app).sendEachForMulticast({
      tokens,

      notification: {
        title,
        body: message,
      },

      webpush: {
        notification: {
          title,
          body: message,
          icon: "/icon-192.png",
        },

        fcmOptions: {
          link: "/",
        },
      },
    });

    // Những token không còn hợp lệ
    const invalidTokens: string[] = [];

    response.responses.forEach((result, index) => {
      if (!result.success) {
        const errorCode = result.error?.code;

        if (
          errorCode === "messaging/registration-token-not-registered" ||
          errorCode === "messaging/invalid-registration-token"
        ) {
          invalidTokens.push(tokens[index]);
        }

        console.error(
          `Lỗi gửi token ${tokens[index]}:`,
          result.error
        );
      }
    });

    // Xóa token hết hạn khỏi Supabase
    if (invalidTokens.length > 0) {
      await supabase
        .from("notification_tokens")
        .delete()
        .in("token", invalidTokens);
    }

    return NextResponse.json({
      success: true,
      message: "Đã gửi thông báo",
      total: tokens.length,
      successCount: response.successCount,
      failureCount: response.failureCount,
      removedTokens: invalidTokens.length,
    });
  } catch (error) {
    console.error("Lỗi gửi thông báo:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể gửi thông báo",
      },
      { status: 500 }
    );
  }
}