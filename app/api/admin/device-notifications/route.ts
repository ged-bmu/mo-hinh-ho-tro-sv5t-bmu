import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth-admin";

async function getAdminUserId(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const accessToken = authHeader?.replace("Bearer ", "");

  if (!accessToken) return null;

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !user) return null;

  return user.id;
}

// ==========================================
// KIỂM TRA THIẾT BỊ ĐÃ BẬT THÔNG BÁO
// ==========================================
export async function GET(req: Request) {
  try {
    const { error: authError } = await requireAdmin(req);
    if (authError) return authError;

    const adminUserId = await getAdminUserId(req);
    if (!adminUserId) {
      return NextResponse.json(
        { success: false, error: "Không xác định được Admin" },
        { status: 401 }
      );
    }

    const token = new URL(req.url).searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Thiếu token thiết bị" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("admin_notification_tokens")
      .select("token")
      .eq("admin_user_id", adminUserId)
      .eq("token", token)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      enabled: !!data,
    });
  } catch (error) {
    console.error("Lỗi kiểm tra thông báo Admin:", error);

    return NextResponse.json(
      { success: false, error: "Lỗi máy chủ" },
      { status: 500 }
    );
  }
}

// ==========================================
// BẬT THÔNG BÁO TRÊN THIẾT BỊ
// ==========================================
export async function POST(req: Request) {
  try {
    const { error: authError } = await requireAdmin(req);
    if (authError) return authError;

    const adminUserId = await getAdminUserId(req);
    if (!adminUserId) {
      return NextResponse.json(
        { success: false, error: "Không xác định được Admin" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const token = body.token;
    const deviceName = body.deviceName || "Unknown Device";

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Thiếu token thiết bị" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("admin_notification_tokens")
      .upsert(
        {
          token,
          admin_user_id: adminUserId,
          device_name: deviceName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "token" }
      );

    if (error) {
      console.error("Lỗi lưu token Admin:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      enabled: true,
    });
  } catch (error) {
    console.error("Lỗi đăng ký thông báo Admin:", error);

    return NextResponse.json(
      { success: false, error: "Lỗi máy chủ" },
      { status: 500 }
    );
  }
}

// ==========================================
// TẮT THÔNG BÁO TRÊN THIẾT BỊ
// ==========================================
export async function DELETE(req: Request) {
  try {
    const { error: authError } = await requireAdmin(req);
    if (authError) return authError;

    const adminUserId = await getAdminUserId(req);
    if (!adminUserId) {
      return NextResponse.json(
        { success: false, error: "Không xác định được Admin" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const token = body.token;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Thiếu token thiết bị" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("admin_notification_tokens")
      .delete()
      .eq("admin_user_id", adminUserId)
      .eq("token", token);

    if (error) {
      console.error("Lỗi xóa token Admin:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      enabled: false,
    });
  } catch (error) {
    console.error("Lỗi tắt thông báo Admin:", error);

    return NextResponse.json(
      { success: false, error: "Lỗi máy chủ" },
      { status: 500 }
    );
  }
}