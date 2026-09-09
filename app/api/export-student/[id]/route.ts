import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";
import puppeteer from "puppeteer";
import chromium from "@sparticuz/chromium";
import { google } from "googleapis";
import { escapeHtml } from "@/lib/escapeHtml";
import { requireAdminOrSelf } from "@/lib/auth-admin";

async function downloadFileBuffer(
  supabase: any,
  file: any,
  userId: string
): Promise<Buffer | null> {
  const safeFileName = (file?.display_name || file?.storage_name || file?.file_name || "file")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\\/:*?"<>|]/g, "_");

  if (file?.storage_type === "google_drive") {
    const fileId = file?.drive_file_id || file?.drive_url?.match(/\/file\/d\/([^/]+)/)?.[1];

    if (!fileId) {
      console.warn("Google Drive export skipped: missing fileId", { file, userId, safeFileName });
      return null;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error("Thiếu cấu hình Google Drive để xuất file");
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({ refresh_token: refreshToken });
try {
  const accessToken = await oauth2Client.getAccessToken();

  console.log("🔑 GOOGLE ACCESS TOKEN TEST:", {
    hasToken: !!accessToken.token,
    tokenLength: accessToken.token?.length,
  });
} catch (error: any) {
  console.error("❌ GOOGLE OAUTH TEST FAILED:", {
    message: error?.message,
    code: error?.code,
    response: error?.response?.data,
  });
}
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const response = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "arraybuffer" }
    );

    const raw = response.data as ArrayBuffer | Buffer | string | undefined;
    if (!raw) return null;

    return Buffer.isBuffer(raw) ? raw : Buffer.from(raw as ArrayBuffer);
  }

  if (!file?.storage_name) {
    return null;
  }

  const storagePath = `${userId}/${file.folder}/${file.storage_name}`;
  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from("Ho so SV5T")
    .download(storagePath);

  if (downloadError || !fileBlob) {
    console.warn("Storage export skipped:", { storagePath, error: downloadError?.message });
    return null;
  }

  const buffer = Buffer.from(await fileBlob.arrayBuffer());
  return buffer;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error: authError } = await requireAdminOrSelf(request, id);

    if (authError) return authError;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // =========================
    // GET FILES
    // =========================
    const { data: files, error } = await supabase
      .from("uploaded_files")
      .select("*")
      .eq("user_id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error },
        { status: 500 }
      );
    }

    const zip = new JSZip();

    // =========================
    // FOLDER MAP
    // =========================
    const folderNames: Record<string, string> = {
      "dao-duc": "Đạo đức tốt",
      "hoc-tap": "Học tập tốt",
      "the-luc": "Thể lực tốt",
      "tinh-nguyen": "Tình nguyện tốt",
      "hoi-nhap": "Hội nhập tốt",
      "uu-tien": "Thành tích khác",
    };

    Object.values(folderNames).forEach((name) => {
      zip.folder(name);
    });

    // =========================
// GET DATA REPORT
// =========================

const { data: reports } = await supabase
  .from("reports")
  .select("*")
  .eq("user_id", id);

const { data: profile } = await supabase
  .from("profiles")
  .select("ho_ten, lop, mssv, email")
  .eq("id", id)
  .single();

const getContent = (key: string) => {
  const rawContent =
    reports?.find((r) => r.criteria === key)?.content || "";

  if (!rawContent.trim()) {
    return `<span class="empty">—</span>`;
  }

  return escapeHtml(rawContent)
    .split(/\r?\n/)
    .map((line: string) => line.trim())
    .filter(Boolean)
    .join("<br>");
};
    // =========================
    // REPORT HTML (A4 LANDSCAPE)
    // =========================
const reportHTML = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

<style>

@page {
  size: A4 landscape;
  margin: 12mm;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}

body {
  font-family: "Times New Roman", serif;
  font-size: 11pt;
  color: #000;
  line-height: 1.25;
}

/* =========================
   TIÊU ĐỀ
========================= */

.title {
  text-align: center;
  margin: 0 0 4pt 0;
  font-size: 16pt;
  font-weight: bold;
  line-height: 1.2;
}

.subtitle {
  text-align: center;
  margin: 0 0 3pt 0;
  font-size: 13pt;
  font-weight: bold;
  line-height: 1.2;
}

.school-year {
  text-align: center;
  margin: 0 0 12pt 0;
  font-size: 13pt;
  font-weight: bold;
  line-height: 1.2;
}

/* =========================
   BẢNG
========================= */

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

th,
td {
  border: 1px solid #000;
  vertical-align: top;
}

th {
  text-align: center;
  font-weight: bold;
  font-size: 11pt;
  padding: 6px 5px;
  line-height: 1.15;
  background: #f2f2f2;
}

td {
  padding: 6px 6px;
  font-size: 10.5pt;
  line-height: 1.25;
  overflow-wrap: break-word;
  word-break: normal;
}

/* =========================
   CHIỀU RỘNG CỘT
========================= */

.student {
  width: 21%;
}

.criteria {
  width: 13.166%;
}

/* =========================
   THÔNG TIN SINH VIÊN
========================= */

.student-info {
  line-height: 1.25;
}

.student-info div {
  margin: 0 0 4pt 0;
}

.student-info div:last-child {
  margin-bottom: 0;
}

/* =========================
   NỘI DUNG TIÊU CHÍ
========================= */

.criteria-content {
  line-height: 1.25;
  white-space: normal;
}

.criteria-content br {
  line-height: 1.25;
}

.empty {
  color: #444;
}

/* =========================
   TRÁNH CẮT DÒNG QUÁ XẤU
========================= */

tr {
  page-break-inside: avoid;
}

td,
th {
  page-break-inside: avoid;
}

</style>

</head>

<body>

<div class="title">
  BÁO CÁO THÀNH TÍCH
</div>

<div class="subtitle">
  ĐỀ NGHỊ CÔNG NHẬN DANH HIỆU SINH VIÊN 5 TỐT CẤP TRƯỜNG
</div>

<div class="school-year">
  NĂM HỌC 2025 - 2026
</div>

<table>

<thead>
<tr>

<th class="student">
  Thông tin sinh viên
</th>

<th class="criteria">
  Đạo đức tốt
</th>

<th class="criteria">
  Học tập tốt
</th>

<th class="criteria">
  Thể lực tốt
</th>

<th class="criteria">
  Tình nguyện tốt
</th>

<th class="criteria">
  Hội nhập tốt
</th>

<th class="criteria">
  Thành tích khác
</th>

</tr>
</thead>

<tbody>

<tr>

<td class="student">

  <div class="student-info">

    <div>
      <b>Họ và tên:</b>
      ${escapeHtml(profile?.ho_ten || "")}
    </div>

    <div>
      <b>MSSV:</b>
      ${escapeHtml(profile?.mssv || "")}
    </div>

    <div>
      <b>Nam/Nữ:</b>
    </div>

    <div>
      <b>Năm sinh:</b>
    </div>

    <div>
      <b>Dân tộc:</b>
    </div>

    <div>
      <b>Sinh viên năm thứ:</b>
    </div>

    <div>
      <b>Lớp:</b>
      ${escapeHtml(profile?.lop || "")},
      Trường Đại học Y Dược Buôn Ma Thuột
    </div>

    <div>
      <b>Chức vụ Đoàn - Hội:</b>
    </div>

    <div>
      <b>Đảng viên/Đoàn viên:</b>
    </div>

    <div>
      <b>Số điện thoại:</b>
    </div>

    <div>
      <b>Email:</b>
      ${escapeHtml(profile?.email || "")}
    </div>

  </div>

</td>

<td>
  <div class="criteria-content">
    ${getContent("dao-duc")}
  </div>
</td>

<td>
  <div class="criteria-content">
    ${getContent("hoc-tap")}
  </div>
</td>

<td>
  <div class="criteria-content">
    ${getContent("the-luc")}
  </div>
</td>

<td>
  <div class="criteria-content">
    ${getContent("tinh-nguyen")}
  </div>
</td>

<td>
  <div class="criteria-content">
    ${getContent("hoi-nhap")}
  </div>
</td>

<td>
  <div class="criteria-content">
    ${getContent("uu-tien")}
  </div>
</td>

</tr>

</tbody>

</table>

</body>
</html>
`;

    // =========================
    // HTML -> PDF (PUPEETER)
    // =========================
const isProduction = process.env.NODE_ENV === "production";

const browser = await puppeteer.launch({
  args: isProduction ? chromium.args : [],
  executablePath: isProduction
    ? await chromium.executablePath()
    : undefined,
  headless: true,
});
const page = await browser.newPage();

await page.setViewport({
  width: 1200,
  height: 800,
  deviceScaleFactor: 2,
});

await page.setContent(reportHTML, {
   waitUntil: "load",
});

const pdfBuffer = await page.pdf({
  format: "A4",
  landscape: true,
  printBackground: true,
  preferCSSPageSize: true,
  margin: {
    top: "15mm",
    bottom: "15mm",
    left: "12mm",
    right: "12mm",
  },
});

    await browser.close();

    zip.file(
      "Báo cáo SV5T cấp Trường.pdf",
      pdfBuffer
    );

    // =========================
    // PROCESS FILES
    // =========================
    for (const file of files || []) {
      try {
        const buffer = await downloadFileBuffer(supabase, file, id);

        if (!buffer) {
          console.log("SKIP EXPORT FILE:", {
            id: file?.id,
            storageType: file?.storage_type,
            folder: file?.folder,
            storageName: file?.storage_name,
            driveFileId: file?.drive_file_id,
          });
          continue;
        }

        const folderName = folderNames[file.folder] || file.folder;
        const safeDisplayName = (file.display_name || file.storage_name || file.file_name || "file")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[\\/:*?"<>|]/g, "_");

        zip
          .folder(folderName)
          ?.file(safeDisplayName, buffer);
      } catch (error: any) {
        console.error("EXPORT FILE FAILED:", {
          fileId: file?.id,
          folder: file?.folder,
          error: error?.message || String(error),
        });
      }
    }

    // =========================
    // GENERATE ZIP
    // =========================
    const zipFile = await zip.generateAsync({
      type: "blob",
    });

    const safeZipName = `${profile?.ho_ten || "SinhVien"}-${
      profile?.lop || ""
    }-${profile?.mssv || id}.zip`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replaceAll(" ", "_");

    return new Response(zipFile, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${safeZipName}"`,
      },
    });
  } catch (err) {
    console.log(err);

    return NextResponse.json(
      {
        success: false,
        error: String(err),
      },
      { status: 500 }
    );
  }
}