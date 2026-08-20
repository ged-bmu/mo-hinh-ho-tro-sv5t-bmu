import { NextResponse } from "next/server";
import { google } from "googleapis";

const GOOGLE_OAUTH_STATE_COOKIE = "google_oauth_state";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const expectedState = request.headers
      .get("cookie")
      ?.split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${GOOGLE_OAUTH_STATE_COOKIE}=`))
      ?.slice(GOOGLE_OAUTH_STATE_COOKIE.length + 1);

    if (!code) {
      return NextResponse.json(
        {
          error: "Không nhận được authorization code từ Google",
        },
        { status: 400 }
      );
    }
    console.log("STATE:", state, expectedState);
    if (!state || !expectedState || state !== expectedState) {
      return NextResponse.json(
        { error: "Google OAuth state không hợp lệ hoặc đã hết hạn" },
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
    console.log("TEMPLATE REFRESH TOKEN:", tokens.refresh_token);

    const response = NextResponse.json({
      success: true,
      message: "Google Drive đã kết nối thành công!",
      hasRefreshToken: !!tokens.refresh_token,
    });
    response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);

    return response;

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