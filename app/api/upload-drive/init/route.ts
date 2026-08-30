import { NextResponse } from "next/server";
import { google } from "googleapis";
import { requireUser } from "@/lib/auth-admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const allowedCriteria = new Set([
  "dao-duc",
  "hoc-tap",
  "the-luc",
  "tinh-nguyen",
  "hoi-nhap",
  "uu-tien",
]);

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
]);

export async function POST(request: Request) {
  try {
    // ==============================
    // 1. XÁC THỰC USER
    // ==============================
    const { user, error: authError } = await requireUser(request);

    if (authError || !user) {
      return authError;
    }

    // ==============================
    // 2. NHẬN METADATA
    // ==============================
    const body = await request.json();

    const {
      fileName,
      fileSize,
      mimeType,
      mssv,
      ho_ten,
      criteria,
    } = body;

    // ==============================
    // 3. KIỂM TRA FILE
    // ==============================
    if (
      typeof fileName !== "string" ||
      fileName.trim().length === 0 ||
      fileName.trim().length > 255
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Tên file không hợp lệ",
        },
        { status: 400 }
      );
    }

    if (
      typeof fileSize !== "number" ||
      fileSize <= 0 ||
      fileSize > MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "File phải lớn hơn 0 và không vượt quá 25 MB",
        },
        { status: 413 }
      );
    }

    if (
      typeof mimeType !== "string" ||
      !allowedMimeTypes.has(mimeType)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Loại file không được hỗ trợ",
        },
        { status: 415 }
      );
    }

    // ==============================
    // 4. KIỂM TRA MSSV
    // ==============================
    if (
      typeof mssv !== "string" ||
      !/^[a-zA-Z0-9_-]{1,50}$/.test(mssv.trim())
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "MSSV không hợp lệ",
        },
        { status: 400 }
      );
    }

    // ==============================
    // 5. KIỂM TRA HỌ TÊN
    // ==============================
    if (
      typeof ho_ten !== "string" ||
      ho_ten.trim().length === 0 ||
      ho_ten.trim().length > 200
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Họ tên không hợp lệ",
        },
        { status: 400 }
      );
    }

    // ==============================
    // 6. KIỂM TRA TIÊU CHÍ
    // ==============================
    if (
      typeof criteria !== "string" ||
      !allowedCriteria.has(criteria)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Tiêu chí không hợp lệ",
        },
        { status: 400 }
      );
    }

    // ==============================
    // 7. KIỂM TRA PROFILE
    // ==============================
    const { data: profile, error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .select("ho_ten, mssv")
        .eq("id", user.id)
        .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Không tìm thấy hồ sơ người dùng",
        },
        { status: 403 }
      );
    }

    if (profile.mssv !== mssv.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "MSSV không thuộc tài khoản hiện tại",
        },
        { status: 403 }
      );
    }

    // ==============================
    // 8. GOOGLE OAUTH
    // ==============================
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
          error: "Thiếu cấu hình Google Drive",
        },
        { status: 500 }
      );
    }

    // ==============================
    // 9. GOOGLE AUTH
    // ==============================
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    // Lấy access token
    const accessTokenResponse =
      await oauth2Client.getAccessToken();

    const accessToken = accessTokenResponse.token;

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Không lấy được Google access token",
        },
        { status: 500 }
      );
    }

    // ==============================
    // 10. TÊN FILE
    // ==============================
    const safeFileName = fileName.trim();

    const driveFileName =
      `${profile.mssv} - ${profile.ho_ten} - ${criteria} - ${safeFileName}`;

    // ==============================
    // 11. TẠO RESUMABLE UPLOAD SESSION
    // ==============================
    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Type": mimeType,
          "X-Upload-Content-Length": String(fileSize),
        },
        body: JSON.stringify({
          name: driveFileName,
          parents: [folderId],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "Google resumable init error:",
        response.status,
        errorText
      );

      return NextResponse.json(
        {
          success: false,
          error: "Không thể tạo phiên upload Google Drive",
        },
        { status: 500 }
      );
    }

    const uploadUrl = response.headers.get("location");

    if (!uploadUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Google Drive không trả về upload URL",
        },
        { status: 500 }
      );
    }

    // ==============================
    // 12. TRẢ URL CHO FRONTEND
    // ==============================
    return NextResponse.json({
      success: true,
      uploadUrl,
      fileName: driveFileName,
    });
  } catch (error: any) {
    console.error(
      "Google Drive init upload error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Không thể khởi tạo upload Google Drive",
      },
      { status: 500 }
    );
  }
}