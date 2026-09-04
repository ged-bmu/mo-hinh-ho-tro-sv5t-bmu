import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { requireAdmin } from "@/lib/auth-admin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
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
      driveDeleted: false,
      errors: [] as string[],
    };

    // ================================================
    // 1. LẤY TOÀN BỘ FILE CỦA USER TRƯỚC KHI XÓA
    // ================================================
    const { data: files, error: filesError } =
      await supabaseAdmin
        .from("uploaded_files")
        .select("id, folder, storage_name, drive_file_id")
        .eq("user_id", uid);

    if (filesError) {
      return NextResponse.json(
        {
          success: false,
          error: `Không thể lấy danh sách file: ${filesError.message}`,
        },
        { status: 500 }
      );
    }

    console.log(
      `Tìm thấy ${(files || []).length} file của user ${uid}`
    );

    // ================================================
    // 2. XÓA FILE GOOGLE DRIVE
    // ================================================
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

      if (clientId && clientSecret && refreshToken) {
        const oauth2Client = new google.auth.OAuth2(
          clientId,
          clientSecret,
          process.env.GOOGLE_REDIRECT_URI
        );

        oauth2Client.setCredentials({
          refresh_token: refreshToken,
        });

        const drive = google.drive({
          version: "v3",
          auth: oauth2Client,
        });

        const driveFiles = (files || []).filter(
          (file) => file.drive_file_id
        );

        for (const file of driveFiles) {
          try {
            await drive.files.delete({
              fileId: file.drive_file_id,
            });

            console.log(
              `✓ Đã xóa file Drive: ${file.drive_file_id}`
            );
          } catch (driveFileError) {
            const msg =
              driveFileError instanceof Error
                ? driveFileError.message
                : "Không thể xóa file Drive";

            console.warn(
              `Không thể xóa Drive file ${file.drive_file_id}:`,
              driveFileError
            );

            results.errors.push(
              `Drive ${file.drive_file_id}: ${msg}`
            );
          }
        }

        results.driveDeleted = true;
        console.log(`✓ Đã xử lý file Google Drive của ${uid}`);
      } else {
        results.errors.push(
          "Thiếu cấu hình Google Drive nên không thể xóa file Drive"
        );

        console.warn(
          "Thiếu GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN"
        );
      }
    } catch (driveErr) {
      const msg =
        driveErr instanceof Error
          ? driveErr.message
          : "Unknown error";

      results.errors.push(`Drive deletion: ${msg}`);

      console.error(
        "Google Drive deletion failed:",
        driveErr
      );
    }

    // ================================================
    // 3. XÓA FILE TRONG SUPABASE STORAGE
    // ================================================
    try {
      const storageFiles = (files || []).filter(
        (file) =>
          file.folder &&
          file.storage_name
      );

      if (storageFiles.length > 0) {
        const paths = storageFiles.map(
          (file) =>
            `${uid}/${file.folder}/${file.storage_name}`
        );

        console.log(
          "Đang xóa Storage files:",
          paths
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

      console.log(
        `✓ Đã xóa file Storage của user: ${uid}`
      );
    } catch (storageErr) {
      const msg =
        storageErr instanceof Error
          ? storageErr.message
          : "Unknown error";

      results.errors.push(
        `Storage deletion: ${msg}`
      );

      console.warn(
        "Storage deletion failed:",
        storageErr
      );
    }

    // ================================================
    // 4. XÓA FILE METADATA
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

      console.log(
        `✓ File metadata deleted: ${uid}`
      );
    } catch (filesErr) {
      const msg =
        filesErr instanceof Error
          ? filesErr.message
          : "Unknown error";

      results.errors.push(
        `File metadata deletion: ${msg}`
      );

      console.warn(
        "File metadata deletion failed:",
        filesErr
      );
    }

    // ================================================
    // 5. XÓA NGƯỜI DUYỆT ĐANG THAM CHIẾU USER NÀY
    // ================================================
    try {
      const { error: clearApproverError } =
        await supabaseAdmin
          .from("profiles")
          .update({
            nguoi_duyet_id: null,
          })
          .eq("nguoi_duyet_id", uid);

      if (clearApproverError) {
        throw new Error(
          clearApproverError.message
        );
      }

      console.log(
        `✓ Đã clear nguoi_duyet_id: ${uid}`
      );
    } catch (approverErr) {
      const msg =
        approverErr instanceof Error
          ? approverErr.message
          : "Unknown error";

      results.errors.push(
        `Clear approver: ${msg}`
      );

      console.warn(
        "Clear approver failed:",
        approverErr
      );
    }

    // ================================================
    // 6. XÓA PROFILE
    // ================================================
    try {
      const { error: profileError } =
        await supabaseAdmin
          .from("profiles")
          .delete()
          .eq("id", uid);

      if (profileError) {
        throw new Error(
          profileError.message
        );
      }

      results.profileDeleted = true;

      console.log(
        `✓ Profile deleted: ${uid}`
      );
    } catch (profileErr) {
      const msg =
        profileErr instanceof Error
          ? profileErr.message
          : "Unknown error";

      results.errors.push(
        `Profile deletion: ${msg}`
      );

      console.warn(
        "Profile deletion failed:",
        profileErr
      );
    }

    // ================================================
    // 7. XÓA AUTH USER CUỐI CÙNG
    // ================================================
    try {
      const { error: authErr } =
        await supabaseAdmin.auth.admin.deleteUser(
          uid
        );

      if (authErr) {
        throw new Error(
          `Auth delete failed: ${authErr.message}`
        );
      }

      results.authDeleted = true;

      console.log(
        `✓ Auth user deleted: ${uid}`
      );
    } catch (authErr) {
      const msg =
        authErr instanceof Error
          ? authErr.message
          : "Unknown error";

      results.errors.push(
        `Auth deletion failed: ${msg}`
      );

      console.error(
        "Auth deletion failed:",
        authErr
      );
    }

    // ================================================
    // 8. KẾT QUẢ
    // ================================================
    if (!results.authDeleted) {
      return NextResponse.json(
        {
          success: false,
          error:
            results.errors.find((e) =>
              e.startsWith("Auth")
            ) ||
            "Không thể xóa tài khoản Auth",
          details: results,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Đã xóa tài khoản và xử lý toàn bộ file",
      details: results,
    });
  } catch (err) {
    console.error(
      "Delete user error:",
      err
    );

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