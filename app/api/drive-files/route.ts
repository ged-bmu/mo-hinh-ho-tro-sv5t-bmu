import { google } from "googleapis";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (
      !clientId ||
      !clientSecret ||
      !refreshToken ||
      !folderId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Thiếu GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN hoặc GOOGLE_DRIVE_FOLDER_ID",
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

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields:
        "files(id,name,mimeType,webViewLink,webContentLink,createdTime)",
      orderBy: "createdTime desc",
    });

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