import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // ==========================================
    // XÁC THỰC NGƯỜI ĐANG GỌI API
    // ==========================================

    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Chưa đăng nhập." },
        { status: 401 }
      );
    }

    const accessToken = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Phiên đăng nhập không hợp lệ." },
        { status: 401 }
      );
    }

    // ==========================================
    // KIỂM TRA PHẢI LÀ CHỦ TỊCH HSV
    // ==========================================

    const { data: requester, error: requesterError } =
      await supabaseAdmin
        .from("profiles")
        .select("role, roles")
        .eq("id", user.id)
        .single();

    if (requesterError || !requester) {
      return NextResponse.json(
        { error: "Không tìm thấy thông tin tài khoản." },
        { status: 403 }
      );
    }

    const isChairman =
      requester.roles?.includes("chu_tich_hsv");

    if (!isChairman) {
      return NextResponse.json(
        { error: "Bạn không có quyền tạo tài khoản." },
        { status: 403 }
      );
    }

    // ==========================================
    // NHẬN DỮ LIỆU
    // ==========================================

    const body = await req.json();

    const {
      email,
      password,
      ho_ten,
      roles,
    } = body;

    if (!email || !password || !ho_ten) {
      return NextResponse.json(
        {
          error: "Vui lòng nhập đầy đủ thông tin.",
        },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(roles) ||
      roles.length === 0
    ) {
      return NextResponse.json(
        {
          error: "Vui lòng chọn ít nhất một vai trò.",
        },
        { status: 400 }
      );
    }

    const allowedRoles = [
      "chu_tich_hsv",
      "bch_hsv",
    ];

    const invalidRole = roles.some(
      (role: string) =>
        !allowedRoles.includes(role)
    );

    if (invalidRole) {
      return NextResponse.json(
        {
          error: "Vai trò không hợp lệ.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // KIỂM TRA EMAIL
    // ==========================================

    const { data: existingProfiles } =
      await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", email)
        .limit(1);

    if (
      existingProfiles &&
      existingProfiles.length > 0
    ) {
      return NextResponse.json(
        {
          error: "Email này đã tồn tại.",
        },
        { status: 409 }
      );
    }

    // ==========================================
    // TẠO AUTH USER
    // ==========================================

    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      return NextResponse.json(
        {
          error: authError.message,
        },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        {
          error: "Không tạo được tài khoản.",
        },
        { status: 500 }
      );
    }

    // ==========================================
    // TẠO PROFILE
    // ==========================================

    const { error: insertError } =
      await supabaseAdmin
        .from("profiles")
.insert({
  id: authData.user.id,
  mssv: `HSV-${Date.now()}`,
  email,
  ho_ten,
  role: "admin",
  roles,
});

    if (insertError) {
      await supabaseAdmin.auth.admin.deleteUser(
        authData.user.id
      );

      return NextResponse.json(
        {
          error:
            "Tạo tài khoản thất bại: " +
            insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tạo tài khoản thành công.",
    });
  } catch (error) {
    console.error("CREATE ACCOUNT ERROR:", error);

    return NextResponse.json(
      {
        error: "Đã xảy ra lỗi máy chủ.",
      },
      { status: 500 }
    );
  }
}