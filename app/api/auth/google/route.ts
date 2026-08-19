import { NextResponse } from "next/server";
import { google } from "googleapis";
import { randomBytes } from "crypto";
import { requireAdmin } from "@/lib/auth-admin";

const GOOGLE_OAUTH_STATE_COOKIE = "google_oauth_state";

export async function GET(request: Request) {
  try {
    const { error: authError } = await requireAdmin(request);

    if (authError) return authError;

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        {
          error:
            "Thiếu GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET hoặc GOOGLE_REDIRECT_URI",
        },
        { status: 500 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    const state = randomBytes(32).toString("hex");
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      state,
      scope: [
        "https://www.googleapis.com/auth/drive",
      ],
    });

    const response = NextResponse.redirect(url);
    response.cookies.set({
      name: GOOGLE_OAUTH_STATE_COOKIE,
      value: state,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Google OAuth error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Google OAuth thất bại",
      },
      { status: 500 }
    );
  }
}