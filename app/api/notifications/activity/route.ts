import { NextResponse } from "next/server";
import { getMessaging } from "firebase-admin/messaging";
import { app } from "@/lib/firebase-admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
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

    // 3. Gửi FCM
    const messaging = getMessaging(app);

    const response = await messaging.sendEachForMulticast({
      tokens: fcmTokens,

      data: {
        type: "activity",
        title,
        body,
        url: url || `/activities/${activityId}`,
        activityId: String(activityId),
        notificationId: "",
      },
    });

    console.log("📱 ACTIVITY FCM:", {
      total: fcmTokens.length,
      success: response.successCount,
      failed: response.failureCount,
    });

    return NextResponse.json({
      success: true,
      students: userIds.length,
      tokens: fcmTokens.length,
      sent: response.successCount,
      failed: response.failureCount,
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