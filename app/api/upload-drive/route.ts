import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";
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
    const { user, error: authError } = await requireUser(request);

    if (authError || !user) return authError;

    const formData = await request.formData();

    const file = formData.get("file");
    const mssv = formData.get("mssv");
    const ho_ten = formData.get("ho_ten");
    const criteria = formData.get("criteria");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "Không có file",
        },
        { status: 400 }
      );
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "File phải lớn hơn 0 và không vượt quá 25 MB",
        },
        { status: 413 }
      );
    }

    if (!allowedMimeTypes.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Loại file không được hỗ trợ",
        },
        { status: 415 }
      );
    }

    if (
      typeof mssv !== "string" ||
      !/^[a-zA-Z0-9_-]{1,50}$/.test(mssv.trim())
    ) {
      return NextResponse.json(
        { success: false, error: "MSSV không hợp lệ" },
        { status: 400 }
      );
    }

    if (
      typeof ho_ten !== "string" ||
      ho_ten.trim().length === 0 ||
      ho_ten.trim().length > 200
    ) {
      return NextResponse.json(
        { success: false, error: "Họ tên không hợp lệ" },
        { status: 400 }
      );
    }

    if (typeof criteria !== "string" || !allowedCriteria.has(criteria)) {
      return NextResponse.json(
        { success: false, error: "Tiêu chí không hợp lệ" },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("ho_ten, mssv")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy hồ sơ người dùng" },
        { status: 403 }
      );
    }

    if (profile.mssv !== mssv.trim()) {
      return NextResponse.json(
        { success: false, error: "MSSV không thuộc tài khoản hiện tại" },
        { status: 403 }
      );
    }

    const fileName = file.name.trim();
    if (
      fileName.length === 0 ||
      fileName.length > 255 ||
      fileName === "." ||
      fileName === ".." ||
      /[\\/\0\r\n]/.test(fileName)
    ) {
      return NextResponse.json(
        { success: false, error: "Tên file không hợp lệ" },
        { status: 400 }
      );
    }

    // ==============================
    // GOOGLE OAUTH
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

    // ==============================
    // GOOGLE DRIVE
    // ==============================

    const drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });

    // Dùng stream để không tạo thêm một bản sao lớn của file trong RAM.
    const stream = Readable.from(toNodeChunks(file.stream()));

    // ==============================
    // UPLOAD
    // ==============================

    const driveFile = await drive.files.create({
      requestBody: {
        name: `${profile.mssv} - ${profile.ho_ten} - ${criteria} - ${fileName}`,
        parents: [folderId],
      },
      media: {
        mimeType:
          file.type || "application/octet-stream",
        body: stream,
      },
      fields:
        "id,name,mimeType,webViewLink,webContentLink,createdTime",
    });

    return NextResponse.json({
      success: true,
      file: driveFile.data,
    });
  } catch (error: any) {
    console.error(
      "Google Drive upload error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.response?.data?.error?.message ||
          error?.message ||
          "Upload Google Drive thất bại",
      },
      { status: 500 }
    );
  }
}

async function* toNodeChunks(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;
      if (value) yield value;
    }
  } finally {
    reader.releaseLock();
  }
}