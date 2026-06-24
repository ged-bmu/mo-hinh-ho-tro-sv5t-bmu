import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  const { data } =
    await supabaseAdmin
      .from("activity_logs")
      .select("id")
      .order("created_at", {
        ascending: false,
      });
      

  if (!data) {
    return NextResponse.json({
      success: false,
    });
  }

  if (data.length <= 500) {
    return NextResponse.json({
      success: true,
    });
  }

  const idsToDelete =
    data
      .slice(500)
      .map((x) => x.id);

  await supabaseAdmin
    .from("activity_logs")
    .delete()
    .in("id", idsToDelete);

  return NextResponse.json({
    success: true,
  });
}