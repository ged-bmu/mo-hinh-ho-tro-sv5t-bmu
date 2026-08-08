import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import puppeteer from "puppeteer";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const runtime = "nodejs";
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("ho_ten, lop, mssv, email")
      .eq("id", id)
      .single();

    const { data: reports } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", id);

   const getContent = (key: string) => {
  const content = String(
    reports?.find((r) => r.criteria === key)?.content || "—"
  );

  return content
    .split(/\n+/)
    .map(
      (line: string) =>
        `<p class="content-line">${line.trim()}</p>`
    )
    .join("");
};

const reportHTML = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

<style>

@page {
  size: A4 landscape;
  margin-top: 30mm;
  margin-right: 20mm;
  margin-bottom: 20mm;
  margin-left: 20mm;
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

  /* Giãn dòng 1.15 */
  line-height: 1.15;
}

/* Tất cả nội dung dạng đoạn */
p,
div,
td,
th {
  line-height: 1.15;
}

/* Khoảng cách đoạn: trước 0pt, sau 6pt */
p {
  margin-top: 0;
  margin-bottom: 6pt;
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
  padding: 8px;
  vertical-align: top;

  font-size: 12pt;
  line-height: 1.15;

  word-wrap: break-word;
}

th {
  background: #f2f2f2;
  text-align: center;
}

.info {
  line-height: 1.15;
}

.student {
  width: 22%;
  line-height: 1.15;
}

.criteria {
  width: 13%;
}

/* Các dòng thông tin sinh viên */
.student div {
  margin-top: 0;
  margin-bottom: 6pt;
  line-height: 1.15;
}
  .content-line {
  margin-top: 0;
  margin-bottom: 6pt;
  line-height: 1.15;
}
.info {
  line-height: 1.15;
}

.info p {
  margin-top: 0;
  margin-bottom: 6pt;
  line-height: 1.15;
}
</style>

</head>

<body>

<h2>BÁO CÁO THÀNH TÍCH</h2>

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
<b>Họ và tên:</b> ${profile?.ho_ten ?? ""}
</div>

<div>
<b>MSSV:</b> ${profile?.mssv ?? ""}
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
<b>Lớp:</b> ${profile?.lop ?? ""},
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
<b>Email:</b> ${profile?.email ?? ""}
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

const isVercel = !!process.env.VERCEL;

let browser;

if (isVercel) {
  const executablePath = await chromium.executablePath();

  console.log("Chromium path:", executablePath);

  browser = await puppeteerCore.launch({
    args: chromium.args,
    executablePath,
    headless: true,
  });
} else {
  browser = await puppeteer.launch({
    headless: true,
  });
}
    const page = await browser.newPage();

    await page.setContent(reportHTML, {
  waitUntil: "load",
});

const pdf = await page.pdf({
  format: "A4",
  landscape: true,
  printBackground: true,
  preferCSSPageSize: true,
});
await browser.close();

const buffer = Buffer.from(pdf);

const fileName = `${profile?.lop ?? ""} - ${profile?.ho_ten ?? ""} (${id}) - Báo cáo thành tích Sinh viên 5 tốt cấp trường.pdf`;

return new NextResponse(buffer, {
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
  },
});
} catch (err) {
  console.error("EXPORT PDF ERROR:", err);

  return NextResponse.json(
      {
        success: false,
        error: String(err),
      },
      {
        status: 500,
      }
    );
  }
}