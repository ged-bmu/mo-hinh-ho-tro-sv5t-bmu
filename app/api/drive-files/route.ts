import { google } from "googleapis";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const auth = new google.auth.GoogleAuth({
  credentials: {
    project_id: process.env.GOOGLE_PROJECT_ID,
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({
  version: "v3",
  auth,
});

export async function GET() {
  try {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!folderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Chưa cấu hình GOOGLE_DRIVE_FOLDER_ID",
        },
        { status: 500 }
      );
    }

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
  } catch (error) {
    console.error("Google Drive list error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Không thể lấy danh sách Google Drive",
      },
      { status: 500 }
    );
  }
}