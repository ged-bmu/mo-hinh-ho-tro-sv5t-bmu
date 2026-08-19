import { NextResponse } from "next/server";
import { getMessaging } from "firebase-admin/messaging";
import { app } from "@/lib/firebase-admin";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth-admin";

export async function POST(req: Request) {
  try {
    const { error: authError } = await requireAdmin(req);

    if (authError) return authError;

    const { activityId, title, body, url } = await req.json();

    if (!activityId || !title || !body) {
      return NextResponse.json(
        { error: "Thiếu dữ liệu thông báo" },
        { status: 400 }
      );
    }

    // 1. Lấy tất cả sinh viên
    const { data: profiles, error: profilesError } = await supabaseAdmin
  .from("profiles")
  .select("id")
  .eq("role", "student");

    if (profilesError) {
      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      );
    }

    const userIds = profiles?.map((p) => p.id) || [];

    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        students: 0,
        sent: 0,
      });
    }

    // 2. Lấy FCM token của các sinh viên
   const { data: tokens, error: tokenError } = await supabaseAdmin
  .from("notification_tokens")
  .select("user_id, token")
  .in("user_id", userIds);
  
    if (tokenError) {
      return NextResponse.json(
        { error: tokenError.message },
        { status: 500 }
      );
    }

    const fcmTokens = [...new Set(
      (tokens || [])
        .map((item) => item.token)
        .filter(Boolean)
    )];

    if (fcmTokens.length === 0) {
      return NextResponse.json({
        success: true,
        students: userIds.length,
        tokens: 0,
        sent: 0,
      });
    }

    // 3. Gửi FCM theo batch, mỗi batch tối đa 500 token
    const messaging = getMessaging(app);
    const batchSize = 500;
    const invalidTokens: string[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (let offset = 0; offset < fcmTokens.length; offset += batchSize) {
      const tokenBatch = fcmTokens.slice(offset, offset + batchSize);
      const response = await messaging.sendEachForMulticast({
        tokens: tokenBatch,
        data: {
          type: "activity",
          title: String(title),
          body: String(body),
          url: String(url || `/activities/${activityId}`),
          activityId: String(activityId),
          notificationId: "",
        },
      });

      successCount += response.successCount;
      failureCount += response.failureCount;

      response.responses.forEach((result, index) => {
        const errorCode = result.error?.code;

        if (
          !result.success &&
          (errorCode === "messaging/registration-token-not-registered" ||
            errorCode === "messaging/invalid-registration-token")
        ) {
          invalidTokens.push(tokenBatch[index]);
        }
      });
    }

    if (invalidTokens.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from("notification_tokens")
        .delete()
        .in("token", invalidTokens);

      if (deleteError) {
        console.error("❌ Không thể xóa FCM token hết hạn:", deleteError);
      }
    }

    return NextResponse.json({
      success: true,
      students: userIds.length,
      tokens: fcmTokens.length,
      sent: successCount,
      failed: failureCount,
      removedTokens: invalidTokens.length,
    });
  } catch (error: any) {
    console.error("❌ ACTIVITY FCM ERROR:", error);

    return NextResponse.json(
      {
        error: error?.message || "Lỗi gửi notification",
      },
      { status: 500 }
    );
  }
}