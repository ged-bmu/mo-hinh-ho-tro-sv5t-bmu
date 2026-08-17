import { NextResponse } from "next/server";
import { app } from "@/lib/firebase-admin";
import { getMessaging } from "firebase-admin/messaging";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const title = body.title || "🔔 SV5T BMU";
    const message = body.message || "Bạn có một thông báo mới.";
    const userId = body.userId;

    // ==========================================
    // 1. KIỂM TRA USER ID
    // ==========================================
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu userId",
        },
        { status: 400 }
      );
    }

    console.log("📱 API USER ID:", userId);

    // ==========================================
    // 2. LẤY FCM TOKEN CỦA USER
    // ==========================================
    const { data, error } = await supabaseAdmin
      .from("notification_tokens")
      .select("token")
      .eq("user_id", userId);

    console.log("📱 TOKEN DATA:", data);
    console.log("📱 TOKEN ERROR:", error);

    if (error) {
      console.error("❌ Lỗi lấy token:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Không thể lấy danh sách token",
        },
        { status: 500 }
      );
    }

    // ==========================================
    // 3. LỌC TOKEN
    // ==========================================
    const tokens =
      data
        ?.map((item) => item.token)
        .filter(Boolean) || [];

    console.log("📱 TOKEN COUNT:", tokens.length);

    // ==========================================
    // 4. KHÔNG CÓ TOKEN
    // ==========================================
    if (tokens.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Không có thiết bị nào đăng ký nhận thông báo.",
        count: 0,
      });
    }

    // ==========================================
    // 5. GỬI FCM
    // ==========================================
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

    console.log("📱 FCM SUCCESS:", response.successCount);
    console.log("📱 FCM FAILURE:", response.failureCount);

    // ==========================================
    // 6. TÌM TOKEN KHÔNG CÒN HỢP LỆ
    // ==========================================
    const invalidTokens: string[] = [];

    response.responses.forEach((result, index) => {
      if (!result.success) {
        const errorCode = result.error?.code;

        console.error(
          `❌ Lỗi gửi token ${tokens[index]}:`,
          result.error
        );

        if (
          errorCode ===
            "messaging/registration-token-not-registered" ||
          errorCode === "messaging/invalid-registration-token"
        ) {
          invalidTokens.push(tokens[index]);
        }
      }
    });

    // ==========================================
    // 7. XÓA TOKEN KHÔNG CÒN HỢP LỆ
    // ==========================================
    if (invalidTokens.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from("notification_tokens")
        .delete()
        .in("token", invalidTokens);

      if (deleteError) {
        console.error(
          "❌ Lỗi xóa token hết hạn:",
          deleteError
        );
      } else {
        console.log(
          "🗑️ Đã xóa token hết hạn:",
          invalidTokens.length
        );
      }
    }

    // ==========================================
    // 8. TRẢ KẾT QUẢ
    // ==========================================
    return NextResponse.json({
      success: true,
      message: "Đã gửi thông báo",
      total: tokens.length,
      successCount: response.successCount,
      failureCount: response.failureCount,
      removedTokens: invalidTokens.length,
    });
  } catch (error) {
    console.error("❌ Lỗi gửi thông báo:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể gửi thông báo",
      },
      { status: 500 }
    );
  }
}