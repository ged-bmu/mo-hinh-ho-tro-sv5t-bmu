import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const mssv = formData.get("mssv") as string;
    const ho_ten = formData.get("ho_ten") as string;
    const criteria = formData.get("criteria") as string;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "Không có file",
        },
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

    // ==============================
    // FILE BUFFER
    // ==============================

    const buffer = Buffer.from(
      await file.arrayBuffer()
    );

    const stream = Readable.from(buffer);

    // ==============================
    // UPLOAD
    // ==============================

    const driveFile = await drive.files.create({
      requestBody: {
        name: `${mssv} - ${ho_ten} - ${criteria} - ${file.name}`,
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