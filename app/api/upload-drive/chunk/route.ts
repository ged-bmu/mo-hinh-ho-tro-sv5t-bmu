import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { user, error: authError } = await requireUser(request);

    if (authError || !user) {
      return authError;
    }

    const uploadUrl = request.headers.get("x-upload-url");

    if (!uploadUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu upload URL",
        },
        { status: 400 }
      );
    }

    const contentRange = request.headers.get("content-range");

    if (!contentRange) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu Content-Range",
        },
        { status: 400 }
      );
    }

    const body = await request.arrayBuffer();

    if (body.byteLength === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Chunk rỗng",
        },
        { status: 400 }
      );
    }

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Length": String(body.byteLength),
        "Content-Range": contentRange,
      },
      body,
    });

    const text = await response.text();

    if (response.status === 200 || response.status === 201) {
      return NextResponse.json({
        success: true,
        completed: true,
        file: JSON.parse(text),
      });
    }

    if (response.status === 308) {
      return NextResponse.json({
        success: true,
        completed: false,
        range: response.headers.get("range"),
      });
    }

    console.error(
      "Google Drive chunk upload error:",
      response.status,
      text
    );

    return NextResponse.json(
      {
        success: false,
        error: "Google Drive từ chối chunk upload",
      },
      { status: response.status }
    );
  } catch (error: any) {
    console.error("Chunk upload error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Upload chunk thất bại",
      },
      { status: 500 }
    );
  }
}