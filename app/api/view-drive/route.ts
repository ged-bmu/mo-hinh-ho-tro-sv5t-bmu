import { google } from "googleapis";
import { requireAdminOrSelf } from "@/lib/auth-admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const fileId =
      searchParams.get("fileId");

    if (!fileId) {
      return new Response(
        "Thiếu fileId",
        { status: 400 }
      );
    }

    const { data: fileRecord, error: fileError } = await supabaseAdmin
      .from("uploaded_files")
      .select("user_id")
      .eq("drive_file_id", fileId)
      .single();

    if (fileError || !fileRecord) {
      return new Response("Không tìm thấy file", { status: 404 });
    }

    const { error: authError } = await requireAdminOrSelf(
      request,
      fileRecord.user_id
    );

    if (authError) return authError;

    const clientId =
      process.env.GOOGLE_CLIENT_ID;

    const clientSecret =
      process.env.GOOGLE_CLIENT_SECRET;

    const refreshToken =
      process.env.GOOGLE_REFRESH_TOKEN;

    if (
      !clientId ||
      !clientSecret ||
      !refreshToken
    ) {
      return new Response(
        "Thiếu cấu hình Google Drive",
        { status: 500 }
      );
    }

    const oauth2Client =
      new google.auth.OAuth2(
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

    // Lấy metadata
    const metadata =
      await drive.files.get({
        fileId,
        fields:
          "id,name,mimeType,size",
      });

    // Lấy nội dung file
    const response =
      await drive.files.get(
        {
          fileId,
          alt: "media",
        },
        {
          responseType: "arraybuffer",
        }
      );

    const data = response.data as
      | ArrayBuffer
      | Buffer;

    const buffer = Buffer.isBuffer(data)
  ? data
  : Buffer.from(data);

const body = new Uint8Array(buffer);

return new Response(body, {
      status: 200,
      headers: {
        "Content-Type":
          metadata.data.mimeType ||
          "application/octet-stream",

        "Content-Disposition": `inline; filename="${encodeURIComponent(
          metadata.data.name || "file"
        )}"`,

        "Content-Length":
          buffer.length.toString(),

        "Cache-Control":
          "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error(
      "View Google Drive error:",
      error
    );

    return new Response(
      "Không thể xem file",
      { status: 500 }
    );
  }
}