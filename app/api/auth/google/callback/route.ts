import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        {
          error: "Không nhận được authorization code từ Google",
        },
        { status: 400 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (
      !clientId ||
      !clientSecret ||
      !redirectUri
    ) {
      return NextResponse.json(
        {
          error:
            "Thiếu GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET hoặc GOOGLE_REDIRECT_URI",
        },
        { status: 500 }
      );
    }

    const oauth2Client =
      new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );

    const { tokens } = await oauth2Client.getToken(code);

console.log("GOOGLE_REFRESH_TOKEN =", tokens.refresh_token);

return NextResponse.json({
  success: true,
  message: "Google Drive đã kết nối thành công!",
  hasRefreshToken: !!tokens.refresh_token,
});

  } catch (error) {
    console.error(
      "Google OAuth callback error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Google OAuth thất bại",
      },
      { status: 500 }
    );
  }
}