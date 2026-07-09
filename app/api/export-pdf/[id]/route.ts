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
      .select("ho_ten, lop, mssv, email, avatar")
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
<html lang="vi">

<head>

<meta charset="UTF-8"/>

<style>

@page{
    size:A4 landscape;
    margin:12mm;
}

body{
    font-family:"Times New Roman";
    font-size:13pt;
    color:#000;
}

h2,h3{
    margin:0;
    text-align:center;
}

.title{
    margin-bottom:18px;
}

.title h2{
    font-size:22pt;
}

.title h3{
    font-size:16pt;
    margin-top:6px;
}

table{
    width:100%;
    border-collapse:collapse;
    table-layout:fixed;
}

th,
td{
    border:1px solid #000;
    padding:8px;
    vertical-align:top;
}

th{
    background:#f2f2f2;
    text-align:center;
    font-size:13pt;
}

.student{
    width:28%;
}

.criteria{
    width:12%;
}

.info{
    line-height:1.7;
    word-break:break-word;
}

.student-box{
    display:flex;
    gap:14px;
    align-items:flex-start;
}

.student-photo{
    width:90px;
    flex-shrink:0;
}

.student-photo img{
    width:90px;
    height:120px;
    object-fit:cover;
    border:1px solid #000;
}

.student-photo .empty{
    width:90px;
    height:120px;
    border:1px solid #000;
    display:flex;
    justify-content:center;
    align-items:center;
    font-size:11px;
}

.student-info{
    flex:1;
}

.student-info div{
    margin-bottom:6px;
    line-height:1.6;
}

.student-info b{
    display:inline-block;
    width:120px;
}

</style>

</head>

<body>

<div class="title">

<h2>BÁO CÁO THÀNH TÍCH</h2>

<h3>ĐỀ NGHỊ CÔNG NHẬN DANH HIỆU SINH VIÊN 5 TỐT CẤP TRƯỜNG</h3>

<h3>NĂM HỌC 2025 - 2026</h3>

</div>

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

<div class="student-box">

<div class="student-photo">

${
  profile?.avatar
    ? `<img src="${profile.avatar}" />`
    : `<div class="empty">Ảnh 3×4</div>`
}

</div>

<div class="student-info">
<div>
<b>Họ và tên:</b>
<span>${profile?.ho_ten ?? ""}</span>
</div>

<div>
<b>MSSV:</b>
<span>${profile?.mssv ?? ""}</span>
</div>

<div>
<b>Nam/Nữ:</b>
<span></span>
</div>

<div>
<b>Năm sinh:</b>
<span></span>
</div>

<div>
<b>Dân tộc:</b>
<span></span>
</div>

<div>
<b>Sinh viên năm thứ:</b>
<span></span>
</div>

<div>
<b>Lớp:</b>
<span>${profile?.lop ?? ""}, Trường Đại học Y Dược Buôn Ma Thuột</span>
</div>

<div>
<b>Chức vụ Đoàn - Hội:</b>
<span></span>
</div>

<div>
<b>Đảng viên/Đoàn viên:</b>
<span></span>
</div>

<div>
<b>Số điện thoại:</b>
<span></span>
</div>

<div>
<b>Email:</b>
<span>${profile?.email ?? ""}</span>
</div>

</div>

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
const browser = await puppeteer.launch({
  args: chromium.args,
  executablePath: await chromium.executablePath(),
  headless: true,
});

const page = await browser.newPage();

await page.setViewport({
  width: 1600,
  height: 900,
  deviceScaleFactor: 2,
});

await page.setContent(reportHTML, {
   waitUntil: "load",
});

// Chờ ảnh tải xong
await page.evaluate(async () => {
  const images = Array.from(document.images);

  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();

      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    })
  );
});

const pdf = await page.pdf({
  format: "A4",
  landscape: true,
  printBackground: true,
  preferCSSPageSize: true,
});

await browser.close();

return new NextResponse(Buffer.from(pdf), {
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="Bao-cao-SV5T-${
      profile?.ho_ten ?? "SinhVien"
    }.pdf`,
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