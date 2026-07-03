"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Footer from "../components/Footer";
import { supabase } from "@/lib/supabase";


export default function IntroducePage() {
 const [tab, setTab] = useState("home");
 const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 const [criteria, setCriteria] = useState<any[]>([]);

useEffect(() => {
  loadCriteria();
}, []);

async function loadCriteria() {
  const { data, error } = await supabase
    .from("criteria_contents")
    .select("*")
    .order("id");

  if (error) {
    console.error(error);
    return;
  }

  setCriteria(data || []);
}

  
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
{/* Header */}
<div
  className="intro-header"
  style={{
    display: "flex",
    justifyContent: isMobile ? "center" : "space-between",
    alignItems: "center",
    padding: "12px 35px",
    background: "white",
    borderBottom: "1px solid #eee",
    position: "sticky",
    top: 0,
    zIndex: 100,
  }}
>
  {/* Logo + Tên */}
  <div
    style={{
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: "center",
      justifyContent: "center",
      gap: isMobile ? "8px" : "12px",
      flex: isMobile ? 1 : "unset",
    }}
  >
    <img
      className="intro-logo"
      src="/logo-header.png"
      alt="Logo"
      style={{
        height: isMobile ? "42px" : "52px",
        objectFit: "contain",
      }}
    />

    <img
      className="intro-title"
      src="/Tenhethong.png"
      alt="Tên hệ thống"
      style={{
        height: isMobile ? "36px" : "48px",
        objectFit: "contain",
      }}
    />
  </div>

  {/* Nút menu mobile */}
  {isMobile && (
    <button
      className="hamburger-btn"
      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      style={{
        position: "absolute",
        right: "16px",
        top: "30%",
        transform: "translateY(-50%)",
        border: "none",
        background: "transparent",
        fontSize: "22px",
        cursor: "pointer",
      }}
    >
      ☰
    </button>
  )}

  {/* Menu desktop */}
  {!isMobile && (
    <div
      className="intro-header-buttons"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      {[
        { id: "home", label: "Trang chủ" },
        { id: "about", label: "Giới thiệu" },
        { id: "criteria", label: "Tiêu chí" },
      ].map((item) => (
        <button
          key={item.id}
          onClick={() => setTab(item.id)}
          style={{
            padding: "9px 18px",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "15px",
            transition: "0.2s",
            background: tab === item.id ? "#2563eb" : "#f3f4f6",
            color: tab === item.id ? "white" : "#111",
          }}
        >
          {item.label}
        </button>
      ))}

      <Link
        href="/login"
        className="cta-btn"
        style={{
          background: "#f8fafc",
          color: "black",
          textDecoration: "none",
          padding: "9px 18px",
          borderRadius: "10px",
          fontWeight: 600,
          fontSize: "15px",
        }}
      >
        Đăng nhập
      </Link>
    </div>
  )}
</div>
{mobileMenuOpen && (
  <div className="mobile-dropdown">

    <button
  onClick={() => { setTab("home"); setMobileMenuOpen(false); }}
  style={{
    background: tab === "home" ? "#2563eb" : "#f3f4f6",
    color: tab === "home" ? "white" : "#111",
    textAlign: "center"
  }}
>
  Trang chủ
</button>

    <button
  onClick={() => { setTab("about"); setMobileMenuOpen(false); }}
  style={{
    background: tab === "about" ? "#2563eb" : "#f3f4f6",
    color: tab === "about" ? "white" : "#111",
    textAlign: "center"
  }}
>
  Giới thiệu
</button>
    <button
  onClick={() => { setTab("criteria"); setMobileMenuOpen(false); }}
  style={{
    background: tab === "criteria" ? "#2563eb" : "#f3f4f6",
    color: tab === "criteria" ? "white" : "#111",
    textAlign: "center"
  }}
>
  Tiêu chí
</button>

    <Link
  href="/login"
  onClick={() => setMobileMenuOpen(false)}
  style={{
    background: "#f3f4f6",
    color: "#111",
    textAlign: "center"
  }}
>
  Đăng nhập
</Link>

  </div>
)}

      {/* Banner + nội dung */}
      <main
       className="intro-main"
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.7)), url('/banner.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className="intro-box"
          style={{
            background: "rgba(255, 255, 255, 0.72)",
            borderRadius: "28px",
            padding: "25px 55px 70px",
            maxWidth: "1100px",
            width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }}
        >
          
    {tab === "home" && (
  <>
  
{/* HEADER TEXT BLOCK */}
<div
  style={{
    textAlign: "center",
    marginBottom: isMobile ? "18px" : "10px",
    padding: isMobile ? "16px" : "0",
    background: isMobile ? "#ffffff" : "transparent",
    borderRadius: isMobile ? "16px" : "0",
    }}
>

  {!isMobile && (
  <div style={{ textAlign: "center", marginBottom: "10px" }}>
    <h1
      style={{
        fontSize: "20px",
        fontWeight: 600,
        color: "#0f172a",
        marginBottom: "6px",
      }}
    >
      CÂU LẠC BỘ SINH VIÊN 5 TỐT TRƯỜNG ĐẠI HỌC Y DƯỢC BUÔN MA THUỘT
    </h1>

    <p
      style={{
        fontSize: "24px",
        fontWeight: 700,
        color: "#0f65de",
        marginBottom: "10px",
      }}
    >
      Mô hình hỗ trợ sinh viên phấn đấu đạt danh hiệu Sinh viên 5 tốt các cấp
    </p>

  </div>
)}

{isMobile && (
  <div
    style={{
      textAlign: "center",
      marginBottom: "18px",
      }}
  >
    <h1
      style={{
        fontSize: "18px",
        fontWeight: 600,
        color: "#0f172a",
        marginBottom: "6px",
      }}
    >
      CLB SINH VIÊN 5 TỐT BMU
    </h1>

    <p
  style={{
    fontSize: "18px",
    fontWeight: 700,
    color: "#0f65de",
    marginBottom: "0px",
    lineHeight: 1.4,
  }}
>
     Mô hình hỗ trợ sinh viên phấn đấu
      <br />
      đạt danh hiệu Sinh viên 5 tốt các cấp
    </p>

  </div>
)}
</div>
  <p
  style={{
    fontSize:"18px",
    lineHeight: isMobile ? "1.5" : "2",
    textAlign: "justify",
    margin: "0",
  }}
>
      Với mục tiêu tăng cường ứng dụng công nghệ và thúc đẩy chuyển đổi số trong công tác Đoàn – Hội, 
      <b> Hệ thống Hỗ trợ Sinh viên 5 Tốt BMU</b> là nền tảng trực tuyến do
      <b> Câu lạc bộ Sinh viên 5 Tốt Trường Đại học Y Dược Buôn Ma Thuột</b> xây dựng
      nhằm hỗ trợ sinh viên trong quá trình chuẩn bị hồ sơ xét danh hiệu Sinh viên 5 tốt các cấp.
    </p>
     <p
      style={{
        fontSize: "18px",
        lineHeight: "2",
        textAlign: "justify",
        marginTop: "15px",
              }}
    >
      Hệ thống cho phép sinh viên quản lý minh chứng theo từng tiêu chí, 
      theo dõi tiến độ hoàn thiện hồ sơ, tiếp nhận nhận xét từ Ban Chủ nhiệm Câu lạc bộ và xuất hồ sơ 
      phục vụ công tác xét chọn. Việc quản lý minh chứng tập trung giúp nâng cao tính khoa học, 
      giảm thời gian tổng hợp hồ sơ và hạn chế sai sót trong quá trình chuẩn bị.
    </p>
      </>
)}
{tab === "about" && (
  <>
     <h1
      style={{
        textAlign: "center",
        color: "#2563eb",
                marginTop: "10px",
        marginBottom: "20px",
        fontSize: "24px",
      }}
    >
      <b>GIỚI THIỆU</b>
    </h1>
  <div
  style={{
    display: "flex",
    justifyContent: "center",
    padding: "20px 0",
  }}
>
  <img
    src="/gioithieu.avif"
    alt="Gioithieu"
    style={{
      width: "100%",
      maxWidth: "800px",
      height: "auto",
      borderRadius: "8px",
    }}
  />
</div>

    <p style={{ fontSize: 18, lineHeight: 2, textAlign: "justify" }}>
      <b> Hệ thống hỗ trợ Sinh viên 5 tốt BMU</b> là nền tảng trực tuyến được phát triển
      bởi <b>Câu lạc bộ Sinh viên 5 tốt Trường Đại học Y Dược Buôn Ma Thuột </b>
       . Đây là nội dung thuộc<b> Mô hình hỗ trợ Sinh viên phấn đấu đạt danh hiệu Sinh viên 5 tốt các cấp </b>
       nhằm hỗ trợ sinh viên trong quá trình chuẩn bị hồ sơ xét danh hiệu
      <b> Sinh viên 5 tốt</b>.
    </p>

    <p style={{ fontSize: 18, lineHeight: 2, textAlign: "justify" }}>
      Hệ thống được xây dựng với mục tiêu giúp sinh viên quản lý minh chứng một cách khoa học,
       theo dõi tiến độ hoàn thiện hồ sơ, tiếp nhận nhận xét từ Ban Chủ nhiệm Câu lạc bộ
        và xuất hồ sơ phục vụ công tác xét chọn. Việc quản lý minh chứng tập trung
         góp phần giảm thời gian chuẩn bị hồ sơ, hạn chế sai sót và nâng cao hiệu quả trong quá trình xét duyệt.
    </p>
<h3
      style={{
        marginTop: "35px",
        color: "#2563eb",
        fontSize: "24px",
      }}
    >
      🏅 Danh hiệu Sinh viên 5 tốt
    </h3>

    <ul
      style={{
        fontSize: "18px",
        lineHeight: "2",
        paddingLeft: "25px",
        textAlign: "justify",
      }}
    >
      Danh hiệu Sinh viên 5 tốt là danh hiệu cao quý của Hội Sinh viên Việt Nam, được trao tặng hằng năm cho những sinh viên có thành tích xuất sắc trong học tập, rèn luyện và tham gia Phong trào "Sinh viên 5 tốt". Danh hiệu hướng tới xây dựng hình mẫu sinh viên Việt Nam phát triển toàn diện, có đạo đức, tri thức, sức khỏe, tinh thần tình nguyện và năng lực hội nhập, đáp ứng yêu cầu của thời kỳ mới.

Để đạt được danh hiệu, sinh viên cần phấn đấu và đáp ứng đầy đủ các tiêu chuẩn ở 05 tiêu chí: Đạo đức tốt, Học tập tốt, Thể lực tốt, Tình nguyện tốt và Hội nhập tốt theo quy định của Hội Sinh viên Việt Nam. Danh hiệu được xét chọn ở các cấp từ cấp trường đến cấp tỉnh, thành phố và cấp Trung ương, là sự ghi nhận xứng đáng cho quá trình rèn luyện, cống hiến và phát triển toàn diện của mỗi sinh viên.
    </ul>
 <h3
      style={{
        marginTop: "35px",
        color: "#2563eb",
        fontSize: "24px",
      }}
    >
      🎯 Mục tiêu
    </h3>

    <ul
      style={{
        fontSize: "18px",
        lineHeight: "2",
        paddingLeft: "25px",
      }}
    >
      <li>Hỗ trợ sinh viên xây dựng lộ trình phấn đấu đạt danh hiệu Sinh viên 5 tốt.</li>
      <li>Chuẩn hóa việc lưu trữ minh chứng theo từng tiêu chí.</li>
      <li>Rút ngắn thời gian chuẩn bị và nộp hồ sơ.</li>
      <li>Nâng cao hiệu quả quản lý, xét duyệt của Ban Chủ nhiệm Câu lạc bộ.</li>
      <li>Thúc đẩy chuyển đổi số trong công tác Hội và phong trào sinh viên.</li>
    </ul>

    <h3
      style={{
        marginTop: "35px",
        color: "#2563eb",
        fontSize: "24px",
      }}
    >
      👨‍🎓 Đối với sinh viên
    </h3>

    <ul
      style={{
        fontSize: "18px",
        lineHeight: "2",
        paddingLeft: "25px",
      }}
    >
      <li>Lưu trữ minh chứng trực tuyến, an toàn và lâu dài.</li>
      <li>Theo dõi tiến độ hoàn thành từng tiêu chí.</li>
      <li>Xuất hồ sơ nhanh chóng khi đăng ký xét danh hiệu.</li>
      <li>Nhận góp ý, yêu cầu bổ sung minh chứng từ Ban Chủ nhiệm.</li>
      <li>Theo dõi trạng thái xét duyệt theo thời gian thực.</li>
    </ul>

    <h3
      style={{
        marginTop: "35px",
        color: "#2563eb",
        fontSize: "24px",
      }}
    >
      👨‍💼 Đối với Ban Chủ nhiệm
    </h3>

    <ul
      style={{
        fontSize: "18px",
        lineHeight: "2",
        paddingLeft: "25px",
      }}
    >
      <li>Quản lý hồ sơ sinh viên tập trung.</li>
      <li>Kiểm tra và đánh giá minh chứng trực tuyến.</li>
      <li>Gửi nhận xét, yêu cầu chỉnh sửa.</li>
      <li>Theo dõi lịch sử thao tác và quá trình cập nhật hồ sơ.</li>
      <li>Thống kê dữ liệu phục vụ báo cáo và tổng kết.</li>
    </ul>
    
  </>
)}

{tab === "criteria" && (
  <div>
    <h1
      style={{
        textAlign: "center",
        color: "#2563eb",
        marginBottom: "2px",
        fontSize: "24px",
      }}
    >
      <b> TIÊU CHUẨN SINH VIÊN 5 TỐT CẤP TRƯỜNG NHIỆM KỲ 2025 - 2028</b>
  </h1>
   <h1
      style={{
        textAlign: "center",
        color: "#636363",
        marginBottom: "20px",
        fontSize: "16px",
      }}
    >
  <i> (Theo quyết định Số.../QĐ-HSV ngày...tháng...năm 2026 của BCH Hội Sinh viên Việt Nam
    Trường Đại học Y Dược Buôn Ma Thuột)
  </i>
    </h1>
      
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "25px",
      }}
    >
      {criteria.map((item: any) => (
        <div
          className="criteria-card"
          key={item.id}
          style={{
            background: "#fff",
            borderRadius: "18px",
            padding: "28px",
            boxShadow: "0 8px 20px rgba(0,0,0,.08)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#2563eb",
              fontSize: "26px",
            }}
          >
            {item.title}
          </h2>

          <div
            className="criteria-content"
            style={{
              marginTop: "18px",
              whiteSpace: "pre-wrap",
              lineHeight: "1.8",
              minHeight: "250px",
              fontSize: "17px",
            }}
          >
            {item.content?.trim() || "Chưa cập nhật"}
          </div>

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                background:
                  item.content?.trim()
                    ? "#DCFCE7"
                    : "#FEF3C7",
                color:
                  item.content?.trim()
                    ? "#15803D"
                    : "#B45309",
                padding: "6px 14px",
                borderRadius: "999px",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              {item.content?.trim()
                ? "Đã cập nhật"
                : "Chưa cập nhật"}
            </span>

            <span
              style={{
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              {new Date(item.updated_at).toLocaleString(
                "vi-VN"
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

          <div
  className="cta-wrapper"
  style={{
    marginTop: 40,
    textAlign: "center",
  }}
>
            <Link
  href="/login"
  className="cta-btn"
  style={{
    background: "#2563eb",
    color: "white",
    padding: "15px 35px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "18px",
  }}
>
  Đăng nhập hệ thống
</Link>
          </div>
        </div>
      </main>
        <Footer />
    </div>
  );
}