import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkChairman(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("roles")
    .eq("id", user.id)
    .single();

  if (!profile?.roles?.includes("chu_tich_hsv")) {
    return null;
  }

  return user;
}

// ===============================
// SỬA TÀI KHOẢN BCH
// ===============================

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const requester = await checkChairman(req);

    if (!requester) {
      return NextResponse.json(
        { error: "Bạn không có quyền thực hiện thao tác này." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const body = await req.json();

    const {
      ho_ten,
      email,
      password,
    } = body;

    // Kiểm tra tài khoản cần sửa
    const { data: account, error: accountError } =
      await supabaseAdmin
        .from("profiles")
        .select("id, roles")
        .eq("id", id)
        .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: "Không tìm thấy tài khoản." },
        { status: 404 }
      );
    }

    // Chỉ cho sửa BCH
    if (!account.roles?.includes("bch_hsv")) {
      return NextResponse.json(
        { error: "Chỉ được sửa tài khoản BCH." },
        { status: 403 }
      );
    }

    // Không cho sửa chính mình
    if (id === requester.id) {
      return NextResponse.json(
        { error: "Không thể sửa tài khoản đang đăng nhập." },
        { status: 400 }
      );
    }

    // ===============================
    // CẬP NHẬT AUTH
    // ===============================

    const authUpdate: any = {};

    if (email?.trim()) {
      authUpdate.email = email.trim();
      authUpdate.email_confirm = true;
    }

    if (password?.trim()) {
      authUpdate.password = password.trim();
    }

    if (Object.keys(authUpdate).length > 0) {
      const { error: authError } =
        await supabaseAdmin.auth.admin.updateUserById(
          id,
          authUpdate
        );

      if (authError) {
        return NextResponse.json(
          { error: authError.message },
          { status: 400 }
        );
      }
    }

    // ===============================
    // CẬP NHẬT PROFILE
    // ===============================

    const profileUpdate: any = {};

    if (ho_ten?.trim()) {
      profileUpdate.ho_ten = ho_ten.trim();
    }

    if (email?.trim()) {
      profileUpdate.email = email.trim();
    }

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } =
        await supabaseAdmin
          .from("profiles")
          .update(profileUpdate)
          .eq("id", id);

      if (profileError) {
        return NextResponse.json(
          { error: profileError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Cập nhật tài khoản thành công.",
    });
  } catch (error) {
    console.error("UPDATE ACCOUNT ERROR:", error);

    return NextResponse.json(
      { error: "Đã xảy ra lỗi máy chủ." },
      { status: 500 }
    );
  }
}

// ===============================
// XÓA TÀI KHOẢN BCH
// ===============================

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const requester = await checkChairman(req);

    if (!requester) {
      return NextResponse.json(
        { error: "Bạn không có quyền thực hiện thao tác này." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (id === requester.id) {
      return NextResponse.json(
        { error: "Không thể xóa tài khoản đang đăng nhập." },
        { status: 400 }
      );
    }

    // Kiểm tra tài khoản
    const { data: account, error: accountError } =
      await supabaseAdmin
        .from("profiles")
        .select("id, roles")
        .eq("id", id)
        .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: "Không tìm thấy tài khoản." },
        { status: 404 }
      );
    }

    // Chỉ được xóa BCH
    if (!account.roles?.includes("bch_hsv")) {
      return NextResponse.json(
        { error: "Chỉ được xóa tài khoản BCH." },
        { status: 403 }
      );
    }
    // Bỏ liên kết người duyệt trước khi xóa tài khoản BCH
const { error: clearApproverError } = await supabaseAdmin
  .from("profiles")
  .update({ nguoi_duyet_id: null })
  .eq("nguoi_duyet_id", id);

if (clearApproverError) {
  return NextResponse.json(
    { error: clearApproverError.message },
    { status: 500 }
  );
}
    // Xóa Auth trước
    const { error: deleteAuthError } =
      await supabaseAdmin.auth.admin.deleteUser(id);

    if (deleteAuthError) {
      return NextResponse.json(
        { error: deleteAuthError.message },
        { status: 400 }
      );
    }

    // Xóa profile
    const { error: deleteProfileError } =
      await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", id);

    if (deleteProfileError) {
      return NextResponse.json(
        { error: deleteProfileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Đã xóa tài khoản BCH.",
    });
  } catch (error) {
    console.error("DELETE ACCOUNT ERROR:", error);

    return NextResponse.json(
      { error: "Đã xảy ra lỗi máy chủ." },
      { status: 500 }
    );
  }
}