import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";
import puppeteer from "puppeteer";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
      "uu-tien": "Tiêu chuẩn ưu tiên",
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

    // =========================
    // REPORT HTML (A4 LANDSCAPE)
    // =========================
    const reportHTML = `
<html>
<head>
  <meta charset="utf-8"/>

  <style>
    @page {
      size: A4 landscape;
      margin: 12mm;
    }

    body {
      font-family: "Times New Roman", serif;
      font-size: 13pt;
      color: #000;
    }

    .title {
      text-align: center;
      font-weight: bold;
      font-size: 20pt;
      margin-bottom: 6px;
    }

    .subtitle {
      text-align: center;
      font-weight: bold;
      font-size: 13pt;
      margin-bottom: 4px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin-top: 14px;
    }

    th, td {
      border: 1px solid #000;
      padding: 8px;
      font-size: 12pt;
      vertical-align: top;
      word-wrap: break-word;
    }

    th {
      background: #f2f2f2;
      text-align: center;
    }

    .info {
      line-height: 1.6;
      white-space: pre-line;
    }

    /* FIX KHỐI THÔNG TIN SINH VIÊN */
    .student-box {
      line-height: 1.8;
    }

    .student-box div {
      margin: 2px 0;
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

  <div class="subtitle">
    NĂM HỌC 2025 - 2026
  </div>

  <table>
  <colgroup>
    <col style="width: 22%;" />
    <col style="width: 13%;" />
    <col style="width: 13%;" />
    <col style="width: 13%;" />
    <col style="width: 13%;" />
    <col style="width: 13%;" />
    <col style="width: 13%;" />
  </colgroup>
    <tr>
      <th>Thông tin sinh viên</th>
      <th>Đạo đức tốt</th>
      <th>Học tập tốt</th>
      <th>Thể lực tốt</th>
      <th>Tình nguyện tốt</th>
      <th>Hội nhập tốt</th>
      <th>Ưu tiên</th>
    </tr>

    <tr>

      <!-- =========================
           FIX KHỐI THÔNG TIN SINH VIÊN
      ========================== -->
      <td class="student-box">

        <div><b>Họ và tên:</b> ${profile?.ho_ten || ""}</div>
        <div><b>MSSV:</b> ${profile?.mssv || ""}</div>

        <div><b>Nam/Nữ:</b></div>
        <div><b>Năm sinh:</b></div>
        <div><b>Dân tộc:</b></div>
        <div><b>Sinh viên năm thứ:</b></div>

        <div><b>Lớp:</b> ${profile?.lop || ""}, Trường Đại học Y Dược Buôn Ma Thuột</div>

        <div><b>Chức vụ Đoàn - Hội:</b></div>
        <div><b>Đảng viên/Đoàn viên:</b></div>
        <div><b>Số điện thoại:</b></div>

        <div><b>Email:</b> ${profile?.email || ""}</div>

      </td>

      ${[
        "dao-duc",
        "hoc-tap",
        "the-luc",
        "tinh-nguyen",
        "hoi-nhap",
        "uu-tien",
      ]
        .map((key) => {
          const r = reports?.find((x) => x.criteria === key);
          return `<td class="info">${r?.content || "—"}</td>`;
        })
        .join("")}

    </tr>
  </table>

</body>
</html>
`;

    // =========================
    // HTML -> PDF (PUPEETER)
    // =========================
const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
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
      const path = `${id}/${file.folder}/${file.storage_name}`;

      const { data: fileBlob, error: downloadError } =
        await supabase.storage
          .from("Ho so SV5T")
          .download(path);

      if (downloadError || !fileBlob) {
        console.log("DOWNLOAD FAILED:", path);
        continue;
      }

      const buffer = await fileBlob.arrayBuffer();

      const folderName =
        folderNames[file.folder] || file.folder;

      zip
        .folder(folderName)
        ?.file(
          file.display_name || file.storage_name,
          buffer
        );
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