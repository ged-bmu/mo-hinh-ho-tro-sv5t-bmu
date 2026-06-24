import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: Request
) {
  try {
    const { uid } =
      await req.json();

    // 1. Lấy toàn bộ file của user

const { data: files } =
  await supabaseAdmin
    .from("uploaded_files")
    .select("*")
    .eq("user_id", uid);

// 2. Xóa file trong Storage

if (files && files.length > 0) {
  const paths = files.map(
    (file) =>
      `${uid}/${file.folder}/${file.storage_name}`
  );

  await supabaseAdmin.storage
    .from("Ho so SV5T")
    .remove(paths);
}

// 3. Xóa dữ liệu uploaded_files

await supabaseAdmin
  .from("uploaded_files")
  .delete()
  .eq("user_id", uid);

// 4. Xóa profile

await supabaseAdmin
  .from("profiles")
  .delete()
  .eq("id", uid);

// 5. Xóa Auth User

const { error } =
  await supabaseAdmin.auth.admin.deleteUser(uid);

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
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          err.message,
      },
      {
        status: 500,
      }
    );
  }
}