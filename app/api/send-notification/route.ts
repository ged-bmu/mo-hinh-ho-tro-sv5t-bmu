import { NextResponse } from "next/server";
import { app } from "@/lib/firebase-admin";
import { getMessaging } from "firebase-admin/messaging";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth-admin";

export async function POST(req: Request) {
  try {
    const { error: authError } = await requireAdmin(req);

    if (authError) return authError;

    const body = await req.json();

    // ==========================================
    // THÔNG TIN THÔNG BÁO
    // ==========================================

    const type = body.type || "system";

    const title =
      body.title ||
      "🔔 SV5T BMU";

    const message =
      body.message ||
      "Bạn có một thông báo mới.";

    const url =
      body.url ||
      "/";

    const userId = body.userId;

    // Dữ liệu bổ sung cho từng loại thông báo
    const conversationId =
      body.conversationId || null;

    const messageId =
      body.messageId || null;

    const senderId =
      body.senderId || null;

    const activityId =
      body.activityId || null;

    const notificationId =
      body.notificationId || null;

    // ==========================================
    // KIỂM TRA USER ID
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


    // ==========================================
    // LẤY FCM TOKEN
    // ==========================================

    const { data, error } = await supabaseAdmin
      .from("notification_tokens")
      .select("token")
      .eq("user_id", userId);

    if (error) {
      console.error(
        "❌ Lỗi lấy token:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: "Không thể lấy danh sách token",
        },
        { status: 500 }
      );
    }

    // ==========================================
    // LỌC TOKEN
    // ==========================================

    const tokens =
      data
        ?.map((item) => item.token)
        .filter(Boolean) || [];

    // ==========================================
    // KHÔNG CÓ TOKEN
    // ==========================================

    if (tokens.length === 0) {
      return NextResponse.json({
        success: true,
        message:
          "Không có thiết bị nào đăng ký nhận thông báo.",
        count: 0,
      });
    }

    // ==========================================
    // DATA GỬI XUỐNG FCM
    // ==========================================

    const notificationData = {
      type: String(type),

      title: String(title),

      body: String(message),

      url: String(url),

      conversationId:
        conversationId
          ? String(conversationId)
          : "",

      messageId:
        messageId
          ? String(messageId)
          : "",

      senderId:
        senderId
          ? String(senderId)
          : "",

      activityId:
        activityId
          ? String(activityId)
          : "",

      notificationId:
        notificationId
          ? String(notificationId)
          : "",
    };

    console.log(
      "📤 FCM DATA:",
      notificationData
    );

    // ==========================================
    // GỬI FCM
    // ==========================================

    const response =
      await getMessaging(app).sendEachForMulticast({
        tokens,

        // CHỈ GỬI DATA
        data: notificationData,
      });

    // ==========================================
    // TÌM TOKEN KHÔNG CÒN HỢP LỆ
    // ==========================================

    const invalidTokens: string[] = [];

    response.responses.forEach(
      (result, index) => {
        if (!result.success) {
          const errorCode =
            result.error?.code;

          console.error(
            `❌ Lỗi gửi token ${tokens[index]}:`,
            result.error
          );

          if (
            errorCode ===
              "messaging/registration-token-not-registered" ||
            errorCode ===
              "messaging/invalid-registration-token"
          ) {
            invalidTokens.push(
              tokens[index]
            );
          }
        }
      }
    );

    // ==========================================
    // XÓA TOKEN KHÔNG HỢP LỆ
    // ==========================================

    if (
      invalidTokens.length > 0
    ) {
      const { error: deleteError } =
        await supabaseAdmin
          .from("notification_tokens")
          .delete()
          .in(
            "token",
            invalidTokens
          );

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
    // KẾT QUẢ
    // ==========================================

    return NextResponse.json({
      success: true,

      message:
        "Đã gửi thông báo",

      type,

      total:
        tokens.length,

      successCount:
        response.successCount,

      failureCount:
        response.failureCount,

      removedTokens:
        invalidTokens.length,
    });

  } catch (error) {
    console.error(
      "❌ Lỗi gửi thông báo:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Không thể gửi thông báo",
      },
      { status: 500 }
    );
  }
}