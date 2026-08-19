import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  // ==========================================
  // KIỂM TRA QUYỀN ADMIN
  // ==========================================

  const { error } = await requireAdmin(request);

  if (error) {
    return error;
  }

  // Giữ lại 5000 log mới nhất và xóa phần cũ theo từng lô.
  const retentionLimit = 5000;
  const deletionBatchSize = 1000;
  let deleted = 0;

  while (true) {
    const { data, error: selectError } = await supabaseAdmin
      .from("activity_logs")
      .select("id")
      .order("created_at", { ascending: false })
      .range(retentionLimit, retentionLimit + deletionBatchSize - 1);

    if (selectError) {
      return NextResponse.json(
        {
          success: false,
          error: "Không thể đọc activity logs",
        },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      break;
    }

    const idsToDelete = data.map((item) => item.id);
    const { error: deleteError } = await supabaseAdmin
      .from("activity_logs")
      .delete()
      .in("id", idsToDelete);

    if (deleteError) {
      return NextResponse.json(
        {
          success: false,
          error: "Không thể xóa activity logs",
        },
        { status: 500 }
      );
    }

    deleted += idsToDelete.length;

    if (data.length < deletionBatchSize) {
      break;
    }
  }

  return NextResponse.json({
    success: true,
    deleted,
  });
}