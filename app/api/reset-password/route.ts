import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth-admin";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { error: authError } = await requireAdmin(req);

    if (authError) return authError;

    const { userId, password } = await req.json();

    if (typeof userId !== "string" || !isUuid(userId)) {
      return NextResponse.json(
        { error: "userId không hợp lệ" },
        { status: 400 }
      );
    }

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      return NextResponse.json(
        {
          error:
            "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường và chữ số",
        },
        { status: 400 }
      );
    }

    const { error } =
      await admin.auth.admin.updateUserById(
        userId,
        {
          password,
        }
      );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Lỗi server" },
      { status: 500 }
    );
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}