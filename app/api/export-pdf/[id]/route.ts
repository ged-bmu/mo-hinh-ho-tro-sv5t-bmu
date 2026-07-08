import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import puppeteer from "puppeteer-core";
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

    const getContent = (key: string) =>
      reports?.find((r) => r.criteria === key)?.content || "—";

    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

<style>
@page{
    size:A4 landscape;
    margin:12mm;
}

body{
    font-family:"Times New Roman";
    font-size:13pt;
}

h2,h3{
    text-align:center;
    margin:0;
}

table{
    width:100%;
    border-collapse:collapse;
    table-layout:fixed;
    margin-top:15px;
}

th,td{
    border:1px solid #000;
    padding:8px;
    vertical-align:top;
    font-size:12pt;
}

th{
    background:#f2f2f2;
}

.info{
    line-height:1.7;
}

.student{
    width:22%;
    line-height:1.8;
}

.criteria{
    width:13%;
}
</style>

</head>

<body>

<h2>BÁO CÁO THÀNH TÍCH</h2>

<h3>ĐỀ NGHỊ CÔNG NHẬN DANH HIỆU SINH VIÊN 5 TỐT CẤP TRƯỜNG</h3>

<h3>NĂM HỌC 2025 - 2026</h3>

<table>

<tr>

<th class="student">
Thông tin sinh viên
</th>

<th class="criteria">Đạo đức tốt</th>

<th class="criteria">Học tập tốt</th>

<th class="criteria">Thể lực tốt</th>

<th class="criteria">Tình nguyện tốt</th>

<th class="criteria">Hội nhập tốt</th>

<th class="criteria">Thành tích khác</th>

</tr>

<tr>

<td class="student">

<div><b>Họ và tên:</b> ${profile?.ho_ten ?? ""}</div>

<div><b>MSSV:</b> ${profile?.mssv ?? ""}</div>

<div><b>Nam/Nữ:</b></div>

<div><b>Năm sinh:</b></div>

<div><b>Dân tộc:</b></div>

<div><b>Sinh viên năm thứ:</b></div>

<div><b>Lớp:</b> ${profile?.lop ?? ""}, Trường Đại học Y Dược Buôn Ma Thuột</div>

<div><b>Chức vụ Đoàn - Hội:</b></div>

<div><b>Đảng viên/Đoàn viên:</b></div>

<div><b>Số điện thoại:</b></div>

<div><b>Email:</b></div>

</td>

<td class="info">${getContent("dao-duc")}</td>

<td class="info">${getContent("hoc-tap")}</td>

<td class="info">${getContent("the-luc")}</td>

<td class="info">${getContent("tinh-nguyen")}</td>

<td class="info">${getContent("hoi-nhap")}</td>

<td class="info">${getContent("uu-tien")}</td>

</tr>

</table>

</body>
</html>
`;

 const browser = await puppeteer.launch({
  args: chromium.args,
  executablePath: await chromium.executablePath(),
  headless: true,
});
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

return new NextResponse(buffer, {
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": 'attachment; filename="Bao-cao-SV5T.pdf"',
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