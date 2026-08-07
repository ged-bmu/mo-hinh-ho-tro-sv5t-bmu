import { NextRequest, NextResponse } from "next/server";

const ROOT_FOLDER_ID = "15ombdT7_XGemlGQA53Vr8Emm_Lp__3v8";

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Chưa có GOOGLE_DRIVE_API_KEY" },
        { status: 500 }
      );
    }

    // Nếu không truyền folderId thì lấy thư mục gốc
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId") || ROOT_FOLDER_ID;

    const url =
      `https://www.googleapis.com/drive/v3/files` +
      `?q=${encodeURIComponent(
        `'${folderId}' in parents and trashed = false`
      )}` +
      `&key=${apiKey}` +
      `&fields=files(id,name,mimeType,webViewLink,thumbnailLink,size)` +
      `&orderBy=name`;

    const response = await fetch(url);

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data.error?.message || "Không lấy được danh sách Drive",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data.files || []);
  } catch (error) {
    console.error("Drive API error:", error);

    return NextResponse.json(
      { error: "Lỗi khi lấy danh sách hồ sơ mẫu" },
      { status: 500 }
    );
  }
}