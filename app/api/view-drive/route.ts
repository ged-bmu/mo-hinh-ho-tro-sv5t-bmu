import { google } from "googleapis";
import { requireAdminOrSelf } from "@/lib/auth-admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    console.log("🔍 VIEW DRIVE FILE:", fileId);

    if (!fileId) {
      return new Response("Thiếu fileId", { status: 400 });
    }

    // ==========================================
    // KIỂM TRA FILE TRONG SUPABASE
    // ==========================================

    const { data: fileRecord, error: fileError } =
      await supabaseAdmin
        .from("uploaded_files")
        .select("user_id, drive_file_id, drive_url, display_name")
        .eq("drive_file_id", fileId)
        .single();

    if (fileError || !fileRecord) {
      console.error("❌ Không tìm thấy file:", fileError);

      return new Response("Không tìm thấy file", {
        status: 404,
      });
    }

    // ==========================================
    // KIỂM TRA QUYỀN
    // ==========================================

    const { error: authError } = await requireAdminOrSelf(
      request,
      fileRecord.user_id
    );

    if (authError) {
      console.error("❌ Auth error:", authError);
      return authError;
    }

    // ==========================================
    // GOOGLE CONFIG
    // ==========================================

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      console.error("❌ Thiếu Google OAuth config");

      return new Response(
        "Thiếu cấu hình Google Drive",
        { status: 500 }
      );
    }

    // ==========================================
    // GOOGLE AUTH
    // ==========================================

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

    // ==========================================
    // LẤY METADATA
    // ==========================================

    console.log("📋 Đang lấy metadata...");

    const metadata = await drive.files.get({
      fileId,
      fields: "id,name,mimeType,size",
    });

    console.log("✅ Metadata:", {
      name: metadata.data.name,
      mimeType: metadata.data.mimeType,
      size: metadata.data.size,
    });

    // ==========================================
    // LẤY FILE
    // ==========================================

    console.log("⬇️ Đang tải file từ Google Drive...");

    const response = await drive.files.get(
      {
        fileId,
        alt: "media",
      },
      {
        responseType: "arraybuffer",
      }
    );

    console.log("✅ Google Drive đã trả file");

    const data = response.data;

    if (!data) {
      throw new Error("Google Drive không trả về dữ liệu file");
    }

    const buffer = Buffer.isBuffer(data)
      ? data
      : Buffer.from(data as ArrayBuffer);

    console.log("📦 File size:", buffer.length);

    if (!buffer.length) {
      throw new Error("File tải về có dung lượng 0 byte");
    }

    // ==========================================
    // TRẢ FILE VỀ BROWSER
    // ==========================================

    const mimeType =
      metadata.data.mimeType ||
      "application/octet-stream";

    const fileName =
      metadata.data.name ||
      fileRecord.display_name ||
      "file";

    return new Response(new Uint8Array(buffer), {
      status: 200,

      headers: {
        "Content-Type": mimeType,

        "Content-Disposition": `inline; filename="${encodeURIComponent(
          fileName
        )}"`,

        "Content-Length": buffer.length.toString(),

        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("❌ View Google Drive error:", error);

    return Response.json(
      {
        error: "Không thể xem file",
        detail: error?.message || String(error),
      },
      {
        status: 500,
      }
    );
  }
}