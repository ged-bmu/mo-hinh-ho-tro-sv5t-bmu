
import { NextResponse } from "next/server";
import { getMessaging } from "firebase-admin/messaging";
import { app } from "@/lib/firebase-admin";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth-admin";

export async function POST(req: Request) {
  try {
    const { error: authError } = await requireAdmin(req);

    if (authError) return authError;

    const { activityId, title, body, url, userIds } = await req.json();

    if (
      !activityId ||
      !title ||
      !body ||
      !Array.isArray(userIds) ||
      userIds.length === 0
    ) {
      return NextResponse.json(
        { error: "Thiếu thông tin hoặc chưa chọn người nhận." },
        { status: 400 }
      );
    }

    // Lọc ID trùng và ID không hợp lệ
    const selectedIds = [
      ...new Set(
        userIds.filter(
          (id: unknown): id is string =>
            typeof id === "string" && id.trim() !== ""
        )
      ),
    ];

    if (selectedIds.length === 0) {
      return NextResponse.json(
        { error: "Danh sách người nhận không hợp lệ." },
        { status: 400 }
      );
    }

    // Chỉ lấy tài khoản sinh viên hợp lệ
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("role", "student")
      .in("id", selectedIds);

    if (profileError) throw profileError;

    const validUserIds = (profiles || []).map((item) => item.id);

    if (validUserIds.length === 0) {
      return NextResponse.json(
        { error: "Không tìm thấy tài khoản sinh viên hợp lệ." },
        { status: 400 }
      );
    }

    // Chỉ lấy tài khoản có token thông báo điện thoại
    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from("notification_tokens")
      .select("user_id, token")
      .in("user_id", validUserIds);

    if (tokenError) throw tokenError;

    const validTokenRows = (tokens || []).filter(
      (item) => item.token && item.token.trim() !== ""
    );

    const eligibleUserIds = [
      ...new Set(validTokenRows.map((item) => item.user_id)),
    ];

    const fcmTokens = [
      ...new Set(validTokenRows.map((item) => item.token)),
    ];

    // Không có token thì không tạo thông báo và không gửi FCM
    if (eligibleUserIds.length === 0 || fcmTokens.length === 0) {
      return NextResponse.json({
        success: true,
        selected: selectedIds.length,
        eligibleStudents: 0,
        tokens: 0,
        sent: 0,
        failed: 0,
        message: "Không có tài khoản nào bật thông báo điện thoại.",
      });
    }

    // Tạo thông báo trong hệ thống cho đúng tài khoản có token
    const notificationRows = eligibleUserIds.map((userId) => ({
      user_id: userId,
      type: "activity",
      title,
      content: body,
      target_url: url || "/hoat-dong",
      is_read: false,
    }));

    const { error: notificationError } = await supabaseAdmin
      .from("notifications")
      .insert(notificationRows);

    if (notificationError) throw notificationError;

    // Gửi thông báo điện thoại
    const messaging = getMessaging(app);

    let sent = 0;
    let failed = 0;
    const invalidTokens: string[] = [];

    for (let i = 0; i < fcmTokens.length; i += 500) {
      const batch = fcmTokens.slice(i, i + 500);

      const result = await messaging.sendEachForMulticast({
  tokens: batch,
  data: {
    title: String(title),
    body: String(body),
    type: "activity",
    url: url || "/hoat-dong",
    activityId: String(activityId),
  },
});

      sent += result.successCount;
      failed += result.failureCount;

      result.responses.forEach((item, index) => {
        if (
          !item.success &&
          (
            item.error?.code === "messaging/invalid-registration-token" ||
            item.error?.code === "messaging/registration-token-not-registered"
          )
        ) {
          invalidTokens.push(batch[index]);
        }
      });
    }

    // Xóa token không còn hợp lệ
    if (invalidTokens.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from("notification_tokens")
        .delete()
        .in("token", invalidTokens);

      if (deleteError) {
        console.error("Lỗi xóa token không hợp lệ:", deleteError);
      }
    }

    return NextResponse.json({
      success: true,
      selected: selectedIds.length,
      eligibleStudents: eligibleUserIds.length,
      tokens: fcmTokens.length,
      sent,
      failed,
      message: "Đã xử lý gửi thông báo.",
    });
  } catch (error) {
    console.error("ACTIVITY NOTIFICATION ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Không thể gửi thông báo.",
      },
      { status: 500 }
    );
  }
}
