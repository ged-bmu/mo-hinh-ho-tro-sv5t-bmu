import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(request: Request) {
  try {
    const { fileId } = await request.json();

    if (!fileId) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu fileId",
        },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        {
          success: false,
          error:
            "Thiếu cấu hình Google Drive",
        },
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

    await drive.files.delete({
      fileId,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Google Drive delete error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Không thể xóa file Google Drive",
      },
      { status: 500 }
    );
  }
}