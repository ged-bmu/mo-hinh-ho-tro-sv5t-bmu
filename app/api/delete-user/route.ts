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

    const results = {
      authDeleted: false,
      profileDeleted: false,
      filesDeleted: false,
      storageDeleted: false,
      errors: [] as string[],
    };

    // ================================================
    // 1. XÓA AUTH USER TRƯỚC TIÊN (critical step)
    // ================================================
    try {
      const { error: authErr } =
        await supabaseAdmin.auth.admin.deleteUser(uid);
      if (authErr) {
        throw new Error(
          `Auth delete failed: ${authErr.message}`
        );
      }
      results.authDeleted = true;
      console.log(`✓ Auth user deleted: ${uid}`);
    } catch (authErr) {
      const msg =
        authErr instanceof Error
          ? authErr.message
          : "Unknown error";
      results.errors.push(`Auth deletion failed: ${msg}`);
      console.error("Auth deletion failed:", authErr);
      throw new Error(
        `Không thể xóa tài khoản auth: ${msg}`
      );
    }

    // ================================================
    // 2. XÓA PROFILE
    // ================================================
    try {
      const { error: profileError } =
        await supabaseAdmin
          .from("profiles")
          .delete()
          .eq("id", uid);

      if (profileError) {
        throw new Error(profileError.message);
      }
      results.profileDeleted = true;
      console.log(`✓ Profile deleted: ${uid}`);
    } catch (profileErr) {
      const msg =
        profileErr instanceof Error
          ? profileErr.message
          : "Unknown error";
      results.errors.push(`Profile deletion: ${msg}`);
      console.warn("Profile deletion failed:", profileErr);
    }

    // ================================================
    // 3. XÓA FILE METADATA
    // ================================================
    try {
      const { error: filesDeleteError } =
        await supabaseAdmin
          .from("uploaded_files")
          .delete()
          .eq("user_id", uid);

      if (filesDeleteError) {
        throw new Error(filesDeleteError.message);
      }
      results.filesDeleted = true;
      console.log(`✓ File metadata deleted: ${uid}`);
    } catch (filesErr) {
      const msg =
        filesErr instanceof Error
          ? filesErr.message
          : "Unknown error";
      results.errors.push(`File metadata deletion: ${msg}`);
      console.warn(
        "File metadata deletion failed:",
        filesErr
      );
    }

    // ================================================
    // 4. XÓA FILE TRONG STORAGE
    // ================================================
    try {
      const { data: files, error: filesError } =
        await supabaseAdmin
          .from("uploaded_files")
          .select("folder, storage_name")
          .eq("user_id", uid);

      if (filesError) {
        throw new Error(filesError.message);
      }

      if ((files || []).length > 0) {
        const paths = (files || []).map(
          (file: any) =>
            `${uid}/${file.folder}/${file.storage_name}`
        );

        const { error: storageError } =
          await supabaseAdmin.storage
            .from("Ho so SV5T")
            .remove(paths);

        if (storageError) {
          throw new Error(storageError.message);
        }
      }
      results.storageDeleted = true;
      console.log(`✓ Storage files deleted: ${uid}`);
    } catch (storageErr) {
      const msg =
        storageErr instanceof Error
          ? storageErr.message
          : "Unknown error";
      results.errors.push(`Storage deletion: ${msg}`);
      console.warn("Storage deletion failed:", storageErr);
    }

    // ================================================
    // 5. RETURN RESULTS
    // ================================================
    if (!results.authDeleted) {
      return NextResponse.json(
        {
          success: false,
          error: results.errors[0] || "User deletion failed",
          details: results,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
      details: results,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Server error",
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
