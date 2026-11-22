import { NextResponse } from "next/server";
import { google } from "googleapis";
import { requireAdminOrSelf } from "@/lib/auth-admin";

export async function POST(request: Request) {
  try {
    const { fileId, userId } = await request.json();

    if (!fileId || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu fileId hoặc userId",
        },
        { status: 400 }
      );
    }

    // 1. Xác thực người dùng
    const { error: authError } = await requireAdminOrSelf(
      request,
      userId
    );

    if (authError) return authError;

    // 2. Kiểm tra cấu hình Google
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu cấu hình Google Drive",
        },
        { status: 500 }
      );
    }

    // 3. Khởi tạo OAuth
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

    // 4. Khôi phục file khỏi thùng rác
    await drive.files.update({
      fileId,
      requestBody: {
        trashed: false,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Google Drive restore error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Không thể khôi phục file Google Drive",
      },
      { status: 500 }
    );
  }
}