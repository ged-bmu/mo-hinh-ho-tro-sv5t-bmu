import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const {
      hoTen,
      lop,
      mssv,
      email,
      password,
      role,
    } = await req.json();

    if (role !== "student") {
      const { error: authError } = await requireAdmin(req);

      if (authError) return authError;
    }

    const { data, error } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    const userId = data.user.id;

    const profileRole = role === "student" ? "student" : role;

    const { error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .insert({
          id: userId,
          ho_ten: hoTen,
          lop: lop,
          mssv: mssv,
          email: email,
          role: profileRole,
          roles: profileRole === "student" ? ["student"] : [profileRole],
        });

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      uid: userId,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Lỗi server" },
      { status: 500 }
    );
  }
}