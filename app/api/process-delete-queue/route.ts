
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { google } from "googleapis";
import * as cheerio from "cheerio";

export const dynamic = "force-dynamic";

function normalizeText(text: string) {
  return text
    .replace(/^\s*\d+\.\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getPlainText(html: string) {
  const $ = cheerio.load(html || "");
  return $("body").text().replace(/\s+/g, " ").trim();
}

function buildReport(
  originalReport: string,
  remainingFiles: any[],
  deletedReportContent: string
) {
  const $ = cheerio.load(originalReport || "");

  // Chuẩn hóa nội dung để nhận diện các đoạn minh chứng
  const normalize = (text: string) =>
    text.replace(/^\s*\d+\.\s*/, "").replace(/\s+/g, " ").trim();

  const evidenceContents = [
    deletedReportContent,
    ...remainingFiles.map((file) => file.report_content || ""),
  ]
    .map((content) => normalize(getPlainText(content)))
    .filter(Boolean);

  // Loại bỏ các đoạn báo cáo minh chứng đã biết
  $("p").each((_, paragraph) => {
    const paragraphText = normalize($(paragraph).text());

    if (evidenceContents.some((content) => content === paragraphText)) {
      $(paragraph).remove();
    }
  });

  // Loại bỏ đoạn đánh số nhưng không có nội dung
  $("p").each((_, paragraph) => {
    if (/^\s*\d+\.\s*$/.test($(paragraph).text())) {
      $(paragraph).remove();
    }
  });

  // Giữ lại nội dung viết tay còn lại
  const manualContent = $("body").html()?.trim() || "";

  // Sắp xếp file còn lại
  const sortedFiles = [...remainingFiles].sort(
    (a, b) => (a.sort_order ?? 999999) - (b.sort_order ?? 999999)
  );

  // Tạo lại các đoạn báo cáo minh chứng
  const numberedReports = sortedFiles
    .filter((file) => file.report_content?.trim())
    .map((file, index) => {
      const contentDoc = cheerio.load(file.report_content || "");

      const content = contentDoc("body")
        .html()
        ?.replace(/<p\b[^>]*>/gi, "")
        .replace(/<\/p>/gi, "<br>")
        .replace(/(<br>\s*)+$/gi, "")
        .trim();

      return `<p>${index + 2}. ${content}</p>`;
    });

  return [manualContent, ...numberedReports]
    .filter(Boolean)
    .join("\n");
}

async function processJob(job: any) {
  // Kiểm tra thông tin nhận diện job
  if (
    !job.id ||
    !job.user_id ||
    !job.storage_name ||
    !job.folder ||
    job.academic_year_id == null
  ) {
    throw new Error("Job thiếu thông tin nhận diện file");
  }

  // 1. Kiểm tra file hiện tại trong Supabase
  const { data: currentFile, error: checkError } = await supabaseAdmin
    .from("uploaded_files")
    .select("id, drive_file_id")
    .eq("user_id", job.user_id)
    .eq("storage_name", job.storage_name)
    .eq("folder", job.folder)
    .eq("academic_year_id", job.academic_year_id)
    .maybeSingle();

  if (checkError) throw checkError;

  // Kiểm tra ID Drive nếu file còn trong DB
  if (currentFile) {
    if (currentFile.drive_file_id !== job.drive_file_id) {
      throw new Error("ID Google Drive không khớp với job");
    }
  }

  // 2. Đưa file Google Drive vào thùng rác
  if (job.drive_file_id) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });

    try {
      await drive.files.update({
        fileId: job.drive_file_id,
        requestBody: { trashed: true },
      });
    } catch (error: any) {
      // File không còn tồn tại thì coi như đã hoàn tất bước Drive
      if (error?.code !== 404) {
        throw error;
      }
    }
  }

  // 3. Xóa bản ghi Supabase nếu còn tồn tại
  if (currentFile) {
    const { error: deleteError } = await supabaseAdmin
      .from("uploaded_files")
      .delete()
      .eq("id", currentFile.id)
      .eq("user_id", job.user_id);

    if (deleteError) throw deleteError;
  }

  // 4. Lấy danh sách file còn lại
  const { data: remainingFiles, error: filesError } = await supabaseAdmin
    .from("uploaded_files")
    .select(
      "id, user_id, folder, storage_name, display_name, storage_type, drive_file_id, drive_url, sort_order, report_content, academic_year_id"
    )
    .eq("user_id", job.user_id)
    .eq("folder", job.folder)
    .eq("academic_year_id", job.academic_year_id)
    .order("sort_order", { ascending: true });

  if (filesError) throw filesError;

  const files = remainingFiles || [];

  // 5. Đánh lại thứ tự file
  for (let i = 0; i < files.length; i++) {
    const { error: orderError } = await supabaseAdmin
      .from("uploaded_files")
      .update({ sort_order: i })
      .eq("id", files[i].id);

    if (orderError) throw orderError;
  }

  // 6. Đồng bộ báo cáo
  const { data: report, error: reportError } = await supabaseAdmin
    .from("reports")
    .select("content")
    .eq("user_id", job.user_id)
    .eq("criteria", job.folder)
    .eq("academic_year_id", job.academic_year_id)
    .maybeSingle();

  if (reportError) throw reportError;

  if (report) {
    const newContent = buildReport(
      report.content || "",
      files,
      job.report_content || ""
    );

    const { error: saveReportError } = await supabaseAdmin
      .from("reports")
      .upsert(
        {
          user_id: job.user_id,
          criteria: job.folder,
          academic_year_id: job.academic_year_id,
          content: newContent,
        },
        {
          onConflict: "user_id,criteria,academic_year_id",
        }
      );

    if (saveReportError) throw saveReportError;
  }

  // 7. Ghi nhật ký hoạt động, chống ghi trùng
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("ho_ten, lop")
    .eq("id", job.user_id)
    .maybeSingle();

  const { error: logError } = await supabaseAdmin
    .from("activity_logs")
    .insert({
      delete_queue_job_id: job.id,
      user_id: job.user_id,
      ho_ten: profile?.ho_ten || "",
      lop: profile?.lop || "",
      action_type: "Xóa",
      target_folder: job.folder,
      target_file: job.display_name || job.storage_name,
      created_at: new Date().toISOString(),
      is_read: false,
    });

  // Nếu nhật ký đã tồn tại, bỏ qua lỗi trùng
  if (logError && logError.code !== "23505") {
    throw logError;
  }
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "Máy chủ chưa cấu hình CRON_SECRET" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: "Không có quyền truy cập" },
      { status: 401 }
    );
  }

  // 1. Nhận một job
  const { data: jobs, error: claimError } = await supabaseAdmin.rpc(
    "claim_file_delete_job"
  );

  if (claimError) {
    console.error("Claim job error:", claimError);

    return NextResponse.json(
      { error: "Không thể nhận job" },
      { status: 500 }
    );
  }

  const job = jobs?.[0];

  if (!job) {
    return NextResponse.json({
      success: true,
      message: "Không có công việc đang chờ",
    });
  }

  try {
    // 2. Xử lý job
    await processJob(job);

    // 3. Đánh dấu hoàn tất
    const { error: completeError } = await supabaseAdmin
      .from("file_delete_queue")
      .update({
        status: "completed",
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        locked_at: null,
        error_message: null,
      })
      .eq("id", job.id);

    if (completeError) throw completeError;

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: "completed",
    });
  } catch (error: any) {
    console.error("Process delete job error:", error);

    const finalStatus = job.attempts >= 5 ? "failed" : "pending";

    const { error: updateError } = await supabaseAdmin
      .from("file_delete_queue")
      .update({
        status: finalStatus,
        error_message: String(error?.message || error).slice(0, 1000),
        updated_at: new Date().toISOString(),
        locked_at: null,
      })
      .eq("id", job.id);

    if (updateError) {
      console.error("Update job status error:", updateError);
    }

    return NextResponse.json({
      success: false,
      jobId: job.id,
      status: finalStatus,
      error: "Xử lý xóa file chưa hoàn tất",
    });
  }
}
