import { NextRequest, NextResponse } from "next/server";
import { app } from "@/lib/firebase-admin";
import { getMessaging } from "firebase-admin/messaging";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    // 1. Xác thực người gửi
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Không có token xác thực" },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Không xác thực được người gửi" },
        { status: 401 }
      );
    }

    // 2. Nhận ID tin nhắn
    const { messageId } = await req.json();

    if (!messageId) {
      return NextResponse.json(
        { error: "Thiếu messageId" },
        { status: 400 }
      );
    }

    // 3. Kiểm tra tin nhắn thuộc người đang đăng nhập
    const { data: message, error: messageError } =
      await supabaseAdmin
        .from("messages")
        .select("id, conversation_id, sender_id, sender_role, content, file_name")
        .eq("id", messageId)
        .single();

    if (
      messageError ||
      !message ||
      message.sender_id !== user.id ||
      message.sender_role !== "user"
    ) {
      return NextResponse.json(
        { error: "Tin nhắn không hợp lệ" },
        { status: 403 }
      );
    }

    // 4. Lấy thông tin sinh viên
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("ho_ten, lop")
      .eq("id", user.id)
      .maybeSingle();

    const studentName = profile?.ho_ten || "Sinh viên";
    const studentClass = profile?.lop || "";

    // 5. Lấy các thiết bị Admin đã bật thông báo
    const { data: tokens, error: tokenError } =
      await supabaseAdmin
        .from("admin_notification_tokens")
        .select("token");

    if (tokenError) {
      throw tokenError;
    }

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Không có thiết bị Admin đăng ký",
      });
    }

    const content =
      message.content?.trim() ||
      (message.file_name
        ? `Đã gửi tệp: ${message.file_name}`
        : "Đã gửi tin nhắn");

    // 6. Gửi thông báo đến các thiết bị Admin
    const messaging = getMessaging(app);

    const notificationTitle = `Tin nhắn mới từ ${studentName}`;

const notificationBody = `${studentClass ? studentClass + " • " : ""}${content.slice(0, 150)}`;

const result = await messaging.sendEachForMulticast({
  tokens: tokens.map((item) => item.token),

  data: {
    type: "admin_chat",
    title: notificationTitle,
    body: notificationBody,
    content: notificationBody,
    conversationId: String(message.conversation_id),
    messageId: String(message.id),
    url: "/trao-doi",
  },
});

    // 7. Xóa token không còn hợp lệ
    const invalidTokens = result.responses
      .map((response, index) => {
        if (
          !response.success &&
          (
            response.error?.code ===
              "messaging/invalid-registration-token" ||
            response.error?.code ===
              "messaging/registration-token-not-registered"
          )
        ) {
          return tokens[index].token;
        }

        return null;
      })
      .filter((token): token is string => !!token);

    if (invalidTokens.length > 0) {
      await supabaseAdmin
        .from("admin_notification_tokens")
        .delete()
        .in("token", invalidTokens);
    }

    return NextResponse.json({
      success: true,
      sent: result.successCount,
      failed: result.failureCount,
    });
  } catch (error: any) {
    console.error("Lỗi gửi thông báo chat Admin:", error);

    return NextResponse.json(
      { error: error?.message || "Gửi thông báo thất bại" },
      { status: 500 }
    );
  }
}