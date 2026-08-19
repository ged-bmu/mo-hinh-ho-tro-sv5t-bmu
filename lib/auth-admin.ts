import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function requireUser(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Chưa đăng nhập" },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.replace("Bearer ", "");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Phiên đăng nhập không hợp lệ" },
        { status: 401 }
      ),
    };
  }

  return {
    user,
    error: null,
  };
}

export async function requireAdmin(request: Request) {
  const result = await requireUser(request);

  if (result.error || !result.user) {
    return result;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", result.user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Không có quyền quản trị" },
        { status: 403 }
      ),
    };
  }

  return {
    user: result.user,
    error: null,
  };
}

export async function requireAdminOrSelf(
  request: Request,
  resourceUserId: string
) {
  const result = await requireUser(request);

  if (result.error || !result.user) {
    return result;
  }

  if (result.user.id === resourceUserId) {
    return result;
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", result.user.id)
    .single();

  if (profile?.role !== "admin") {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Không có quyền quản trị" },
        { status: 403 }
      ),
    };
  }

  return result;
}