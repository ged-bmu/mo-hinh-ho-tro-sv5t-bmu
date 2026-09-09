import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";
import puppeteer from "puppeteer";
import chromium from "@sparticuz/chromium";
import { google } from "googleapis";
import { escapeHtml } from "@/lib/escapeHtml";
import { requireAdmin } from "@/lib/auth-admin";

export const runtime = "nodejs";

// ======================================================
// GOOGLE DRIVE CLIENT
// ======================================================

function createGoogleDriveClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Thiếu cấu hình Google Drive: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN"
    );
  }

  console.log("🔐 GOOGLE DRIVE CONFIG:", {
    hasClientId: !!clientId,
    clientIdLength: clientId.length,
    hasClientSecret: !!clientSecret,
    clientSecretLength: clientSecret.length,
    hasRefreshToken: !!refreshToken,
    refreshTokenLength: refreshToken.length,
    hasRedirectUri: !!redirectUri,
  });

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return google.drive({
    version: "v3",
    auth: oauth2Client,
  });
}

// ======================================================
// DOWNLOAD FILE
// ======================================================

async function downloadFileBuffer(
  supabase: any,
  drive: any,
  file: any,
  userId: string
): Promise<{
  buffer: Buffer | null;
  type: "drive" | "storage" | "failed";
}> {
  // ====================================================
  // XÁC ĐỊNH DRIVE FILE ID
  // ====================================================

const fileId =
  file?.drive_file_id ||
  file?.drive_url?.match(
    /\/file\/d\/([^/]+)/
  )?.[1] ||
  file?.drive_url?.match(
    /[?&]id=([^&]+)/
  )?.[1];

  // ====================================================
  // XÁC ĐỊNH STORAGE PATH
  // ====================================================

  const hasStorage =
    !!file?.storage_name;

  const storagePath = hasStorage
    ? `${userId}/${file.folder}/${file.storage_name}`
    : null;

  // ====================================================
  // THỬ GOOGLE DRIVE
  // ====================================================

  if (fileId && drive) {
    console.log(
      "⬇️ THỬ DOWNLOAD DRIVE:",
      {
        userId,
        fileId,
        name:
          file?.display_name ||
          file?.storage_name ||
          "file",
        folder: file?.folder,
      }
    );

    try {
      const response =
        await drive.files.get(
          {
            fileId,
            alt: "media",
          },
          {
            responseType:
              "arraybuffer",
          }
        );

      const raw =
        response.data as
          | ArrayBuffer
          | Buffer
          | string
          | undefined;

      if (raw) {
        const buffer =
          Buffer.isBuffer(raw)
            ? raw
            : Buffer.from(
                raw as ArrayBuffer
              );

        console.log(
          "✅ DRIVE DOWNLOADED:",
          {
            fileId,
            size: buffer.length,
          }
        );

        return {
          buffer,
          type: "drive",
        };
      }

      console.warn(
        "⚠️ DRIVE KHÔNG CÓ DATA:",
        fileId
      );
    } catch (error: any) {
      console.error(
        "❌ DRIVE DOWNLOAD FAILED:",
        {
          fileId,
          name:
            file?.display_name ||
            file?.storage_name ||
            "file",

          message:
            error?.message ||
            String(error),

          code:
            error?.code,

          status:
            error?.response?.status,

          response:
            error?.response?.data,
        }
      );

      // QUAN TRỌNG:
      // Không return ở đây.
      // Vẫn tiếp tục thử Supabase.
    }
  }

  // ====================================================
  // THỬ SUPABASE STORAGE
  // ====================================================

  if (storagePath) {
    console.log(
      "⬇️ THỬ DOWNLOAD STORAGE:",
      storagePath
    );

    try {
      const {
        data: fileBlob,
        error: downloadError,
      } =
        await supabase.storage
          .from("Ho so SV5T")
          .download(
            storagePath
          );

      if (
        !downloadError &&
        fileBlob
      ) {
        const buffer =
          Buffer.from(
            await fileBlob.arrayBuffer()
          );

        console.log(
          "✅ STORAGE DOWNLOADED:",
          {
            storagePath,
            size: buffer.length,
          }
        );

        return {
          buffer,
          type: "storage",
        };
      }

      console.warn(
        "❌ STORAGE DOWNLOAD FAILED:",
        {
          storagePath,
          error:
            downloadError?.message,
        }
      );
    } catch (error: any) {
      console.error(
        "❌ STORAGE DOWNLOAD ERROR:",
        {
          storagePath,
          error:
            error?.message ||
            String(error),
        }
      );
    }
  }

  // ====================================================
  // CẢ 2 NGUỒN ĐỀU THẤT BẠI
  // ====================================================

  console.error(
    "❌ KHÔNG TẢI ĐƯỢC MINH CHỨNG TỪ CẢ 2 NGUỒN:",
    {
      userId,
      fileId,
      storagePath,
      displayName:
        file?.display_name,
      folder:
        file?.folder,
    }
  );

  return {
    buffer: null,
    type: "failed",
  };
}

// ======================================================
// SAFE FILE NAME
// ======================================================

function safeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\\/:*?"<>|]/g, "_")
    .trim();
}

// ======================================================
// CREATE PDF
// ======================================================

async function createStudentReportPDF(
  supabase: any,
  student: any
): Promise<Buffer> {
  const {
    data: reports,
    error: reportsError,
  } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", student.id);

  if (reportsError) {
    throw reportsError;
  }

  const getContent = (key: string) => {
    const rawContent =
      reports?.find(
        (r: any) =>
          r.criteria === key
      )?.content || "";

    if (!rawContent.trim()) {
      return `<span class="empty">—</span>`;
    }

    return escapeHtml(rawContent)
      .split(/\r?\n/)
      .map(
        (line: string) =>
          line.trim()
      )
      .filter(Boolean)
      .join("<br>");
  };

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
  font-size: 13pt;
  color: #000;
  line-height: 1.15;
}

p,
div,
td,
th {
  line-height: 1.15;
}

h2,
h3 {
  text-align: center;
  margin-top: 0;
  margin-bottom: 6pt;
  line-height: 1.15;
}

h2 {
  font-size: 16pt;
}

h3 {
  font-size: 14pt;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  margin-top: 15px;
}

th,
td {
  border: 1px solid #000;
  padding: 7px;
  vertical-align: top;
  font-size: 12pt;
  line-height: 1.15;
  word-wrap: break-word;
  overflow-wrap: anywhere;
}

th {
  background: #f2f2f2;
  text-align: center;
}

.info {
  line-height: 1.25;
}

.student {
  width: 21%;
  line-height: 1.15;
}

.criteria {
  width: 13.166%;
}

.student div {
  margin-top: 0;
  margin-bottom: 5pt;
  line-height: 1.15;
}

.empty {
  color: #555;
}

</style>

</head>

<body>

<h2>
BÁO CÁO THÀNH TÍCH
</h2>

<h3>
ĐỀ NGHỊ CÔNG NHẬN DANH HIỆU SINH VIÊN 5 TỐT CẤP TRƯỜNG
</h3>

<h3>
NĂM HỌC 2025 - 2026
</h3>

<table>

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

<tr>

<td class="student">

<div>
<b>Họ và tên:</b>
${escapeHtml(student?.ho_ten || "")}
</div>

<div>
<b>MSSV:</b>
${escapeHtml(student?.mssv || "")}
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
${escapeHtml(student?.lop || "")},
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
${escapeHtml(student?.email || "")}
</div>

</td>

<td class="info">
${getContent("dao-duc")}
</td>

<td class="info">
${getContent("hoc-tap")}
</td>

<td class="info">
${getContent("the-luc")}
</td>

<td class="info">
${getContent("tinh-nguyen")}
</td>

<td class="info">
${getContent("hoi-nhap")}
</td>

<td class="info">
${getContent("uu-tien")}
</td>

</tr>

</table>

</body>
</html>
`;

  const isProduction =
    process.env.NODE_ENV === "production";

  const browser =
    await puppeteer.launch({
      args: isProduction
        ? chromium.args
        : [],
      executablePath:
        isProduction
          ? await chromium.executablePath()
          : undefined,
      headless: true,
    });

  try {
    const page =
      await browser.newPage();

    await page.setViewport({
      width: 1200,
      height: 800,
      deviceScaleFactor: 2,
    });

    await page.setContent(
      reportHTML,
      {
        waitUntil: "load",
      }
    );

    const pdfBuffer =
      await page.pdf({
        format: "A4",
        landscape: true,
        printBackground: true,
        preferCSSPageSize: true,
      });

    return Buffer.from(
      pdfBuffer
    );
  } finally {
    await browser.close();
  }
}

// ======================================================
// GET
// ======================================================

export async function GET(
  request: Request
) {
  try {
    // ==================================================
    // ADMIN
    // ==================================================

    const {
      error: authError,
    } = await requireAdmin(
      request
    );

    if (authError) {
      return authError;
    }

    // ==================================================
    // SUPABASE ADMIN
    // ==================================================

    const supabase =
      createClient(
        process.env
          .NEXT_PUBLIC_SUPABASE_URL!,
        process.env
          .SUPABASE_SERVICE_ROLE_KEY!
      );

    // ==================================================
    // PARAMS
    // ==================================================

    const {
      searchParams,
    } = new URL(request.url);

    const filter =
      searchParams.get(
        "filter"
      ) || "all";

    const search =
      searchParams.get(
        "search"
      ) || "";

    // ==================================================
    // FOLDER MAP
    // ==================================================

    const folderNames: Record<
      string,
      string
    > = {
      "dao-duc":
        "Đạo đức tốt",

      "hoc-tap":
        "Học tập tốt",

      "the-luc":
        "Thể lực tốt",

      "tinh-nguyen":
        "Tình nguyện tốt",

      "hoi-nhap":
        "Hội nhập tốt",

      "uu-tien":
        "Thành tích khác",
    };

    // ==================================================
    // GET STUDENTS
    // ==================================================

    let query =
      supabase
        .from("profiles")
        .select(`
          id,
          ho_ten,
          lop,
          mssv,
          email,
          "dao-duc",
          "hoc-tap",
          "the-luc",
          "tinh-nguyen",
          "hoi-nhap",
          is_submitted
        `)
        .eq(
          "role",
          "student"
        );

    if (search.trim()) {
      const safeSearch =
        search
          .replace(
            /[.,()]/g,
            " "
          )
          .trim();

      query = query.or(
        `ho_ten.ilike.%${safeSearch}%,mssv.ilike.%${safeSearch}%,lop.ilike.%${safeSearch}%`
      );
    }

    const {
      data: students,
      error,
    } = await query;

    if (error) {
      throw error;
    }

    // ==================================================
    // FILTER
    // ==================================================

    let filteredStudents =
      students || [];

    if (
      filter ===
      "passed"
    ) {
      filteredStudents =
        filteredStudents.filter(
          (student: any) =>
            student[
              "dao-duc"
            ] &&
            student[
              "hoc-tap"
            ] &&
            student[
              "the-luc"
            ] &&
            student[
              "tinh-nguyen"
            ] &&
            student[
              "hoi-nhap"
            ]
        );
    }

    if (
      filter ===
      "failed"
    ) {
      filteredStudents =
        filteredStudents.filter(
          (student: any) =>
            !(
              student[
                "dao-duc"
              ] &&
              student[
                "hoc-tap"
              ] &&
              student[
                "the-luc"
              ] &&
              student[
                "tinh-nguyen"
              ] &&
              student[
                "hoi-nhap"
              ]
            )
        );
    }

    if (
      filter ===
      "submitted"
    ) {
      filteredStudents =
        filteredStudents.filter(
          (student: any) =>
            student.is_submitted ===
            true
        );
    }

    // ==================================================
    // SORT
    // ==================================================

    filteredStudents.sort(
      (a: any, b: any) => {
        const lopCompare =
          (a.lop || "").localeCompare(
            b.lop || "",
            undefined,
            {
              numeric: true,
            }
          );

        if (
          lopCompare !== 0
        ) {
          return lopCompare;
        }

        return (
          a.mssv || ""
        ).localeCompare(
          b.mssv || "",
          undefined,
          {
            numeric: true,
          }
        );
      }
    );

    console.log(
      "👨‍🎓 STUDENTS TO EXPORT:",
      filteredStudents.length
    );

    // ==================================================
    // GOOGLE DRIVE
    // ==================================================

    let drive: any = null;

    try {
      drive =
        createGoogleDriveClient();

      console.log(
        "✅ GOOGLE DRIVE CLIENT READY"
      );
    } catch (error) {
      console.error(
        "❌ GOOGLE DRIVE INIT FAILED:",
        error instanceof Error
          ? error.message
          : String(error)
      );
    }

    // ==================================================
    // ZIP
    // ==================================================

    const zip =
      new JSZip();

    let exportedStudentCount =
      0;

    let driveSuccess =
      0;

    let driveFailed =
      0;

    let storageSuccess =
      0;

    let storageFailed =
      0;

    let pdfSuccess =
      0;

    let pdfFailed =
      0;

    // ==================================================
    // EXPORT STUDENTS
    // ==================================================

    for (
      const student of
        filteredStudents
    ) {
      try {
        // ==============================================
        // CLASS FOLDER
        // ==============================================

        const classFolder =
          zip.folder(
            safeFileName(
              student.lop ||
                "Khac"
            )
          );

        if (!classFolder) {
          continue;
        }

        // ==============================================
        // STUDENT FOLDER
        // ==============================================

        const studentFolderName =
          safeFileName(
            `${
              student.ho_ten ||
              "SinhVien"
            }-${
              student.mssv ||
              student.id
            }`
          );

        const studentFolder =
          classFolder.folder(
            studentFolderName
          );

        if (!studentFolder) {
          continue;
        }

        // ==============================================
        // CREATE CRITERIA FOLDERS
        // ==============================================

        Object.values(
          folderNames
        ).forEach(
          (folderName) => {
            studentFolder.folder(
              folderName
            );
          }
        );

        // ==============================================
        // CREATE PDF
        // ==============================================

        try {
          const pdfBuffer =
            await createStudentReportPDF(
              supabase,
              student
            );

          studentFolder.file(
            "Báo cáo SV5T cấp Trường.pdf",
            pdfBuffer
          );

          pdfSuccess++;
        } catch (error) {
          pdfFailed++;

          console.error(
            "❌ CREATE REPORT PDF FAILED:",
            {
              studentId:
                student.id,
              error:
                error instanceof Error
                  ? error.message
                  : String(error),
            }
          );
        }

        // ==============================================
        // GET FILES
        // ==============================================

        const {
          data: files,
          error:
            filesError,
        } =
          await supabase
            .from(
              "uploaded_files"
            )
            .select(`
              id,
              user_id,
              folder,
              storage_name,
              display_name,
              storage_type,
              drive_file_id,
              drive_url
            `)
            .eq(
              "user_id",
              student.id
            );

        if (filesError) {
          console.error(
            "❌ LẤY MINH CHỨNG THẤT BẠI:",
            {
              studentId:
                student.id,
              error:
                filesError.message,
            }
          );

          continue;
        }

        console.log(
          "📦 MINH CHỨNG:",
          {
            student:
              student.mssv,
            count:
              files?.length ||
              0,
          }
        );

        // ==============================================
        // DOWNLOAD FILES
        // ==============================================

        for (
          const file of
            files || []
        ) {
          try {
            // ------------------------------------------
            // Bỏ file báo cáo nếu có
            // ------------------------------------------

            if (
              file.folder ===
              "bao-cao"
            ) {
              continue;
            }

            const result =
              await downloadFileBuffer(
                supabase,
                drive,
                file,
                student.id
              );

            if (
              result.type ===
              "drive"
            ) {
              driveSuccess++;
            }

            if (
              result.type ===
              "storage"
            ) {
              storageSuccess++;
            }

            if (
              result.type ===
              "failed"
            ) {
              const hasDrive =
                !!(
                  file.drive_file_id ||
                  file.drive_url
                );

              if (hasDrive) {
                driveFailed++;
              } else {
                storageFailed++;
              }

              continue;
            }

            if (
              !result.buffer
            ) {
              continue;
            }

            // ------------------------------------------
            // FOLDER
            // ------------------------------------------

            const folderName =
              folderNames[
                file.folder
              ] ||
              file.folder ||
              "Khác";

            // ------------------------------------------
            // FILE NAME
            // ------------------------------------------

            const displayName =
              file.display_name ||
              file.storage_name ||
              "file";

            const safeName =
              safeFileName(
                displayName
              );

            // ------------------------------------------
            // ADD ZIP
            // ------------------------------------------

            studentFolder
              .folder(
                folderName
              )
              ?.file(
                safeName,
                result.buffer
              );
          } catch (error) {
            console.error(
              "❌ EXPORT FILE FAILED:",
              {
                studentId:
                  student.id,
                fileId:
                  file?.id,
                folder:
                  file?.folder,
                error:
                  error instanceof
                  Error
                    ? error.message
                    : String(
                        error
                      ),
              }
            );
          }
        }

        exportedStudentCount++;

        console.log(
          `✅ EXPORT STUDENT: ${student.mssv} - ${student.ho_ten}`
        );
      } catch (error) {
        console.error(
          "❌ EXPORT STUDENT FAILED:",
          {
            studentId:
              student.id,
            error:
              error instanceof Error
                ? error.message
                : String(error),
          }
        );
      }
    }

    // ==================================================
    // ZIP
    // ==================================================

    console.log(
      "📊 EXPORT SUMMARY:",
      {
        students:
          exportedStudentCount,

        pdfSuccess,
        pdfFailed,

        driveSuccess,
        driveFailed,

        storageSuccess,
        storageFailed,
      }
    );

    const zipFile =
      await zip.generateAsync({
        type: "blob",
        compression:
          "DEFLATE",
        compressionOptions:
          {
            level: 6,
          },
      });

    // ==================================================
    // RESPONSE
    // ==================================================

    return new Response(
      zipFile,
      {
        headers: {
          "Content-Type":
            "application/zip",

          "Content-Disposition":
            'attachment; filename="Ho-So-SV5T.zip"',

          "X-Exported-Students":
            String(
              exportedStudentCount
            ),

          "X-Drive-Success":
            String(
              driveSuccess
            ),

          "X-Drive-Failed":
            String(
              driveFailed
            ),

          "X-Storage-Success":
            String(
              storageSuccess
            ),

          "X-Storage-Failed":
            String(
              storageFailed
            ),

          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (err) {
    console.error(
      "❌ EXPORT ALL ERROR:",
      err
    );

    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : String(err),
      },
      {
        status: 500,
      }
    );
  }
}