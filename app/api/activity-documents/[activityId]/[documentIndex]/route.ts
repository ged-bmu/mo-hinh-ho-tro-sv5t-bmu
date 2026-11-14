import { supabaseAdmin } from "@/lib/supabase-admin";

function getStoragePath(value: string): string | null {
  try {
    const url = new URL(value);
    const marker = "/storage/v1/object/public/documents/";
    const signedMarker = "/storage/v1/object/sign/documents/";
    const markerIndex = url.pathname.indexOf(marker);
    const signedIndex = url.pathname.indexOf(signedMarker);
    const index = markerIndex >= 0 ? markerIndex + marker.length
      : signedIndex >= 0 ? signedIndex + signedMarker.length
      : -1;

    if (index < 0) return null;
    const path = decodeURIComponent(url.pathname.slice(index));
    if (!path || path.split("/").some((part) => part === "..")) return null;
    return path;
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ activityId: string; documentIndex: string }> }
) {
  const { activityId, documentIndex: rawIndex } = await params;
  const index = Number(rawIndex);

  if (!Number.isInteger(index) || index < 0) {
    return new Response("Vị trí văn bản không hợp lệ.", { status: 400 });
  }

  const { data: activity, error } = await supabaseAdmin
    .from("activities")
    .select("document, documents")
    .eq("id", activityId)
    .maybeSingle();

  if (error || !activity) {
    return new Response("Không tìm thấy hoạt động.", { status: 404 });
  }

  const documents = Array.isArray(activity.documents) && activity.documents.length
    ? activity.documents
    : activity.document
    ? [activity.document]
    : [];
  const documentUrl = documents[index];
  const storagePath = typeof documentUrl === "string"
    ? getStoragePath(documentUrl)
    : null;

  if (!storagePath) {
    return new Response("Không tìm thấy văn bản đính kèm.", { status: 404 });
  }

  const { data: file, error: downloadError } = await supabaseAdmin.storage
    .from("documents")
    .download(storagePath);

  if (downloadError || !file) {
    console.error("Không tải được văn bản hoạt động:", downloadError);
    return new Response("Không tải được văn bản đính kèm.", { status: 502 });
  }

  const fileName = storagePath.split("/").pop() || "van-ban-dinh-kem";
  const encodedFileName = encodeURIComponent(fileName);

  return new Response(file, {
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "Content-Length": String(file.size),
      "Content-Disposition": `attachment; filename="${fileName.replace(/[\"\\]/g, "_")}"; filename*=UTF-8''${encodedFileName}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
