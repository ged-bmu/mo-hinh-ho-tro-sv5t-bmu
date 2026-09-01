import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
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

    const { data: requester, error: requesterError } =
      await supabaseAdmin
        .from("profiles")
        .select("roles")
        .eq("id", user.id)
        .single();

    if (requesterError || !requester) {
      return NextResponse.json(
        { error: "Không tìm thấy thông tin tài khoản." },
        { status: 403 }
      );
    }

    if (!requester.roles?.includes("chu_tich_hsv")) {
      return NextResponse.json(
        { error: "Bạn không có quyền." },
        { status: 403 }
      );
    }

    const { data: accounts, error } =
      await supabaseAdmin
        .from("profiles")
        .select(
          "id, mssv, ho_ten, email, role, roles, created_at"
        )
        .or(
          "roles.cs.{chu_tich_hsv},roles.cs.{bch_hsv}"
        )
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.error("GET ACCOUNTS ERROR:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      accounts: accounts || [],
    });
  } catch (error) {
    console.error("GET ACCOUNTS ERROR:", error);

    return NextResponse.json(
      { error: "Đã xảy ra lỗi máy chủ." },
      { status: 500 }
    );
  }
}