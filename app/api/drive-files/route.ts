import { google } from "googleapis";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { error: authError } = await requireUser(request);

    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const requestedFolderId = searchParams.get("folderId");

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const folderId = process.env.GOOGLE_TEMPLATE_DRIVE_FOLDER_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !refreshToken || (!folderId && !requestedFolderId)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Thiếu cấu hình Google Drive hoặc folderId",
        },
        { status: 500 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });
const about = await drive.about.get({
  fields: "user(displayName,emailAddress)",
});

console.log("GOOGLE ACCOUNT:", about.data.user);

const search = await drive.files.list({
  q: "name = 'Hồ sơ mẫu' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
  fields: "files(id,name,mimeType,parents)",
  pageSize: 10,
});

console.log("TEMPLATE SEARCH:", search.data.files);

const response = await drive.files.list({
  q: `'${requestedFolderId || folderId}' in parents and trashed = false`,
  fields:
    "files(id,name,mimeType,webViewLink,webContentLink,createdTime)",
  orderBy: "createdTime desc",
  includeItemsFromAllDrives: true,
  supportsAllDrives: true,
});

console.log("DRIVE FILES:", response.data.files);

    return NextResponse.json({
      success: true,
      files: response.data.files || [],
    });
  } catch (error: any) {
    console.error("Google Drive list error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.response?.data?.error?.message ||
          error?.message ||
          "Không thể lấy danh sách Google Drive",
      },
      { status: 500 }
    );
  }
}