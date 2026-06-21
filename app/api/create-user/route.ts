import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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

    const { error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .insert({
          id: userId,
          ho_ten: hoTen,
          lop: lop,
          mssv: mssv,
          role: role,
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