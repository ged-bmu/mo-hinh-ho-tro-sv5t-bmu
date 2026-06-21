import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: Request
) {
  try {
    const { uid } =
      await req.json();

    await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", uid);

    const { error } =
      await supabaseAdmin.auth.admin.deleteUser(
        uid
      );

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message,
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          err.message,
      },
      {
        status: 500,
      }
    );
  }
}