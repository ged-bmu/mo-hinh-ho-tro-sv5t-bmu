import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: Request
) {
  try {
    const { error: authError } = await requireAdmin(req);

    if (authError) return authError;

    const { uid } = await req.json();

    if (typeof uid !== "string" || !isUuid(uid)) {
      return NextResponse.json(
        { error: "uid không hợp lệ" },
        { status: 400 }
      );
    }

    // 1. Lấy danh sách file để xóa khỏi Storage
    const { data: files, error: filesError } = await supabaseAdmin
      .from("uploaded_files")
      .select("folder, storage_name")
      .eq("user_id", uid);

    if (filesError) {
      return NextResponse.json(
        { error: "Không thể lấy danh sách file của người dùng" },
        { status: 500 }
      );
    }

    // 2. Xóa file trong Storage
    if (files.length > 0) {
      const paths = files.map(
        (file) => `${uid}/${file.folder}/${file.storage_name}`
      );

      const { error: storageError } = await supabaseAdmin.storage
        .from("Ho so SV5T")
        .remove(paths);

      if (storageError) {
        return NextResponse.json(
          { error: "Không thể xóa file trong Storage" },
          { status: 500 }
        );
      }
    }

    // 3. Xóa metadata file
    const { error: filesDeleteError } = await supabaseAdmin
      .from("uploaded_files")
      .delete()
      .eq("user_id", uid);

    if (filesDeleteError) {
      return NextResponse.json(
        { error: "Không thể xóa dữ liệu file của người dùng" },
        { status: 500 }
      );
    }

    // 4. Xóa profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", uid);

    if (profileError) {
      return NextResponse.json(
        { error: "Không thể xóa hồ sơ người dùng" },
        { status: 500 }
      );
    }

    // 5. Chỉ xóa Auth user sau khi các bước cleanup đã thành công
    const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message,
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Lỗi server",
      },
      {
        status: 500,
      }
    );
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}