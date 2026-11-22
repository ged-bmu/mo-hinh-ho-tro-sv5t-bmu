
import { NextResponse } from "next/server";
import { requireAdminOrSelf } from "@/lib/auth-admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storageName, folder, academicYearId } = body;

    if (!storageName || !folder || academicYearId == null) {
      return NextResponse.json(
        { error: "Thiếu thông tin file cần xóa" },
        { status: 400 }
      );
    }

    // 1. Lấy đầy đủ thông tin file
    const { data: file, error: fileError } = await supabaseAdmin
      .from("uploaded_files")
      .select(
        "id, user_id, storage_name, display_name, report_content, sort_order, storage_type, drive_file_id, folder, academic_year_id"
      )
      .eq("storage_name", storageName)
      .eq("folder", folder)
      .eq("academic_year_id", academicYearId)
      .single();

    if (fileError || !file) {
      return NextResponse.json(
        { error: "Không tìm thấy file cần xóa" },
        { status: 404 }
      );
    }

    // 2. Kiểm tra quyền
    const { error: authError } = await requireAdminOrSelf(
      request,
      file.user_id
    );

    if (authError) return authError;

    // 3. Kiểm tra yêu cầu xóa đang tồn tại
    const { data: existingJob } = await supabaseAdmin
      .from("file_delete_queue")
      .select("id, status")
      .eq("user_id", file.user_id)
      .eq("storage_name", file.storage_name)
      .eq("folder", file.folder)
      .eq("academic_year_id", file.academic_year_id)
      .in("status", ["pending", "processing"])
      .maybeSingle();

    if (existingJob) {
      return NextResponse.json({
        success: true,
        queued: true,
        duplicate: true,
        jobId: existingJob.id,
        status: existingJob.status,
      });
    }

    // 4. Đưa vào hàng đợi, lưu metadata để worker sử dụng
    const { data: job, error: queueError } = await supabaseAdmin
      .from("file_delete_queue")
      .insert({
        user_id: file.user_id,
        storage_name: file.storage_name,
        drive_file_id: file.drive_file_id,
        folder: file.folder,
        academic_year_id: file.academic_year_id,
        display_name: file.display_name,
        report_content: file.report_content,
        sort_order: file.sort_order,
        storage_type: file.storage_type,
        status: "pending",
      })
      .select("id, status")
      .single();

    if (queueError) {
      if (queueError.code === "23505") {
        return NextResponse.json({
          success: true,
          queued: true,
          duplicate: true,
        });
      }

      throw queueError;
    }

    return NextResponse.json({
      success: true,
      queued: true,
      jobId: job.id,
      status: job.status,
    });
  } catch (error) {
    console.error("Queue delete error:", error);

    return NextResponse.json(
      { error: "Không thể đưa yêu cầu xóa vào hàng đợi" },
      { status: 500 }
    );
  }
}
