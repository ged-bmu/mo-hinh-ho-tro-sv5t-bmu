"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Footer from "../components/Footer";
import { supabase } from "@/lib/supabase";
import InstallButton from "../components/InstallButton";

export default function IntroducePage() {
 const [tab, setTab] = useState("home");
 const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  checkMobile();
  window.addEventListener("resize", checkMobile);


  return () => window.removeEventListener("resize", checkMobile);
}, []);
useEffect(() => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}, [tab]);
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 const [criteria, setCriteria] = useState<any[]>([]);
 const [header, setHeader] = useState<any>(null);
 const [level, setLevel] = useState<
  "school" | "province" | "central"
>("school");

useEffect(() => {
  loadCriteria();
}, [level]);

async function loadCriteria() {

  // lấy thông tin chung
  const { data: headerData } = await supabase
    .from("criteria_headers")
    .select("*")
    .eq("type", level)
    .single();

  setHeader(headerData);


  // lấy tiêu chí
  const { data, error } = await supabase
    .from("criteria_contents")
    .select("*")
    .eq("type", level)
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
        height: isMobile ? "42px" : "50px",
        objectFit: "contain",
      }}
    />

   <img
  className="intro-title"
  src= {isMobile ? "/Tenhethong2.png" : "Tenhethong1.png"}
  alt="Tên hệ thống"
  style={{
    height: isMobile ? "50px" : "60px",
    objectFit: "contain",
    marginLeft: isMobile ?"0" : "5"
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
        gap: "8px",
      }}
    >
      {[
        { id: "home", label: "Trang chủ" },
        { id: "about", label: "Giới thiệu" },
        { id: "criteria", label: "Tiêu chuẩn" },
      ].map((item) => (
        <button
          key={item.id}
          onClick={() => setTab(item.id)}
             onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = "#2563eb";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = "transparent";
    }}
          style={{
            padding: "9px 18px",
            border: "2px solid transparent",
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
  onMouseEnter={(e) => {
    e.currentTarget.style.borderColor = "#2563eb";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.borderColor = "transparent";
  }}
  style={{
    background: "#f8fafc",
    color: "black",
    textDecoration: "none",
    padding: "9px 18px",
    borderRadius: "10px",
    fontWeight: 600,
    fontSize: "15px",
    border: "2px solid transparent",
    transition: "all 0.2s ease",
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
    flex: isMobile ? "none" : 1, 
    position: "relative", 
    minHeight: isMobile ? "auto" : "calc(100vh - 75px)", 
    height: isMobile ? "auto" : undefined,
  }} 
>
  {/* Trang chủ */}
  {tab === "home" && (
    <>
   {tab === "home" && (
  <>
  <div 
  style={{ 
    width: "100%", 
    minHeight: isMobile ? "auto" : "calc(100vh - 75px)", 
    backgroundImage: isMobile 
      ? "url('/trangchumobile.png'), radial-gradient(circle at 0% 0%, #33d1f4 0%, #e5fdff 100%)"
      : "url('/Trangchu.png')",
    backgroundSize: "100% auto", 
    backgroundPosition: "top center", 
    backgroundRepeat: "no-repeat", 
    display: isMobile ? "flex" : "block", 
    flexDirection: isMobile ? "column" : undefined, 
    alignItems: isMobile ? "center" : undefined, 
    paddingBottom: isMobile ? "30px" : undefined, 
    boxSizing: "border-box", 
  }} 
>
  {isMobile && (
  <img
    src="/trangchumobile.png"
    alt=""
    style={{
      width: "100%",
      height: "auto",
      display: "block",
      objectFit: "contain",
      flexShrink: 0,
    }}
  />
)}
       {/* ===== CARD TRẮNG ===== */}
  <div
    style={{
      position: isMobile ? "relative" : "absolute",

      fontFamily: "'Noto Serif', serif",
      fontSize: isMobile ? "15px" : "18px",

      left: isMobile ? "auto" : "6%",
      top: isMobile ? "auto" : "35%",

      width: isMobile ? "90%" : "45%",
      height: isMobile ? "auto" : "155px",

      background: "#fafafa",
      borderRadius: "20px",

      padding: isMobile
        ? "15px"
        : "12px 20px 20px",

      marginTop: isMobile ? "10px" : undefined,

      boxSizing: "border-box",

      boxShadow:
        "0 8px 25px rgba(0,0,0,0.12)",

      textAlign: "justify",

      lineHeight: isMobile
        ? 1.5
        : undefined,
    }}
  >
    <b>
      {" "}Với mục tiêu{" "}
      <span
        style={{
          color: "#2563eb",
          fontWeight: 600,
        }}
      >
        tăng cường ứng dụng công nghệ và thúc đẩy chuyển đổi số
      </span>{" "}
      trong công tác Đoàn – Hội,{" "}
      <span
        style={{
          color: "#2563eb",
          fontWeight: 600,
        }}
      >
        Hệ thống Hỗ trợ Sinh viên 5 Tốt BMU
      </span>{" "}
      là nền tảng trực tuyến do{" "}
      <span
        style={{
          color: "#2563eb",
          fontWeight: 600,
        }}
      >
        Câu lạc bộ Sinh viên 5 Tốt Trường Đại học Y Dược Buôn Ma Thuột
      </span>{" "}
      xây dựng nhằm hỗ trợ sinh viên trong quá trình{" "}
      <span
        style={{
          color: "#2563eb",
          fontWeight: 600,
        }}
      >
        chuẩn bị hồ sơ xét danh hiệu Sinh viên 5 tốt các cấp
      </span>
      .
    </b>
  </div>

      {/* ===== 3 CARD BÊN DƯỚI ===== */}
      <div
        style={{
          position: isMobile ? "relative" : "absolute",
          left: isMobile ? "auto" : "6%",
          top: isMobile ? "auto" : "63%",
          width: isMobile ? "90%" : "45%",
          display: isMobile ? "none" : "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : "repeat(3, 1fr)",
          gap: isMobile ? "12px" : "25px",
          marginTop: isMobile ? "20px" : undefined,
        }}
      >

        {/* CARD 1 */}
        <div
          style={{
            background: "#fafafa",
            borderRadius: "24px",
            padding: "12px 15px",
            height: isMobile ? "130px" : "145px",
            boxSizing: "border-box",
            boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "55px",
              height: "55px",
              borderRadius: "16px",
              background: "#f3f5b5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "5px",
              flexShrink: 0,
            }}
          >
            <img
              src="/icon-folder.png"
              alt=""
              style={{
                width: "38px",
                height: "38px",
                objectFit: "contain",
              }}
            />
          </div>
          <b
            style={{
              fontSize: "13px",
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: "6px",
            }}
          >
            Quản lý minh chứng
          </b>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              lineHeight: 1.35,
              color: "#222",
            }}
          >
            Lưu trữ và quản lý
            <br />
            minh chứng theo từng tiêu chí
          </p>
        </div>

        {/* CARD 2 */}
        <div
          style={{
            background: "#fafafa",
            borderRadius: "24px",
            padding: "12px 15px",
            height: isMobile ? "130px" : "145px",
            boxSizing: "border-box",
            boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "55px",
              height: "55px",
              borderRadius: "16px",
              background: "#f3f5b5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "5px",
              flexShrink: 0,
            }}
          >
            <img
              src="/icon-progress.png"
              alt=""
              style={{
                width: "38px",
                height: "38px",
                objectFit: "contain",
              }}
            />
          </div>
          <b
            style={{
              fontSize: "13px",
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: "6px",
            }}
          >
            Theo dõi tiến độ
          </b>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              lineHeight: 1.35,
              color: "#222",
            }}
          >
            Cập nhật và theo dõi
            <br />
            quá trình hoàn thiện hồ sơ
          </p>
        </div>

        {/* CARD 3 */}
        <div
          style={{
            background: "#fafafa",
            borderRadius: "24px",
            padding: "12px 15px",
            height: isMobile ? "130px" : "145px",
            boxSizing: "border-box",
            boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "55px",
              height: "55px",
              borderRadius: "16px",
              background: "#f3f5b5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "5px",
              flexShrink: 0,
            }}
          >
            <img
              src="/icon-export.png"
              alt=""
              style={{
                width: "38px",
                height: "38px",
                objectFit: "contain",
              }}
            />
          </div>
          <b
            style={{
              fontSize: "13px",
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: "6px",
            }}
          >
            Xuất hồ sơ
          </b>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              lineHeight: 1.35,
              color: "#222",
            }}
          >
            Xuất hồ sơ
            <br />
            phục vụ công tác xét chọn
          </p>
        </div>
      </div>
      {/* ===== NÚT ĐĂNG NHẬP + CÀI ỨNG DỤNG ===== */}
      <div
        style={{
          position: isMobile ? "relative" : "absolute",
          right: isMobile ? "auto" : "61%",
          bottom: isMobile ? "auto" : "3%",
          display: "flex",
          alignItems: "center",
          justifyContent: isMobile ? "center" : undefined,
          gap: "15px",
          width: isMobile ? "90%" : undefined,
          marginTop: isMobile ? "20px" : undefined,
        }}
      >
        {/* Khu vực nút */}
        <div
          style={{
            position: isMobile ? "relative" : "absolute",
            left: isMobile ? "auto" : "18.4%",
            top: isMobile ? "auto" : "91.5%",
            width: isMobile ? "100%" : "400px",
            height: isMobile ? "auto" : "60px",
            display: isMobile ? "flex" : "block",
            alignItems: isMobile ? "center" : undefined,
            justifyContent: isMobile ? "center" : undefined,
            gap: isMobile ? "10px" : undefined,
          }}
        >
          {/* ===== NÚT ĐĂNG NHẬP ===== */}
          <Link
            href="/login"
            className="cta-btn"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 8px 20px rgba(37,99,235,.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
            style={{
              position: isMobile ? "relative" : "absolute",
              left: isMobile ? "auto" : "-59%",
              top: isMobile ? "auto" : "-90%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#2563eb",
              color: "white",
              padding: "13px 35px",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: 400,
              fontSize: "18px",
              transition: "all 0.25s ease",
              minWidth: "140px",
              textAlign: "center",
              boxSizing: "border-box",
              margin: isMobile ? "0" : undefined,
            }}
          >
            <b>Đăng nhập</b>
          </Link>
          {/* ===== NÚT CÀI ỨNG DỤNG ===== */}
          <div
            style={{
              position: isMobile ? "relative" : "absolute",
              left: isMobile ? "auto" : "-17%",
              top: isMobile ? "auto" : "-90%",
              display: isMobile ? "flex" : undefined,
              alignItems: isMobile ? "center" : undefined,
              justifyContent: isMobile ? "center" : undefined,
            }}
          >
            <InstallButton />
          </div>
        </div>
      </div>

    </div>
  </>
)}
    </>
  )}
{tab === "about" && (
  <div
    style={{
      background:
        "linear-gradient(90deg, #32c8e8 0%, #62d8eb 40%, #a8eaf2 70%, #e4f9fb 100%)",
      minHeight: "100%",
      padding: isMobile ? "20px 12px" : "35px 5%",
      boxSizing: "border-box",
    }}
  >

    {/* ===== CARD LỚN CHỨA TOÀN BỘ NỘI DUNG ===== */}
    <div
      style={{
        background: "#fff",
        borderRadius: isMobile ? "18px" : "28px",
        padding: isMobile ? "20px" : "35px 45px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
        width: "100%",
        maxWidth: "1200px",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >

      {/* ===== TIÊU ĐỀ ===== */}
      <h1
        style={{
          textAlign: "center",
          color: "#2563eb",
          margin: "0 0 25px",
          fontSize: isMobile ? "22px" : "30px",
        }}
      >
        <b>GIỚI THIỆU</b>
      </h1>

      {/* ===== ẢNH GIỚI THIỆU ===== */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "30px",
        }}
      >
        <img
          src="/gioithieu.avif"
          alt="Gioithieu"
          style={{
            width: "100%",
            maxWidth: "650px",
            height: "auto",
            display: "block",
            borderRadius: isMobile ? "12px" : "18px",
            boxShadow: "0 5px 18px rgba(0,0,0,0.08)",
          }}
        />
      </div>

      {/* ===== GIỚI THIỆU HỆ THỐNG ===== */}
      <section
        style={{
          marginBottom: "30px",
        }}
      >
        <p
          style={{
            fontSize: isMobile ? "15px" : "18px",
            lineHeight: 1.8,
            textAlign: "justify",
            margin: 0,
          }}
        >
          <b>Hệ thống hỗ trợ Sinh viên 5 tốt BMU</b> là nền tảng trực tuyến
          được phát triển bởi{" "}
          <b>
            Câu lạc bộ Sinh viên 5 tốt Trường Đại học Y Dược Buôn Ma Thuột
          </b>
          . Đây là nội dung thuộc{" "}
          <b>
            Mô hình hỗ trợ Sinh viên phấn đấu đạt danh hiệu Sinh viên 5 tốt
            các cấp
          </b>{" "}
          nhằm hỗ trợ sinh viên trong quá trình chuẩn bị hồ sơ xét danh hiệu{" "}
          <b>Sinh viên 5 tốt</b>.
        </p>

        <p
          style={{
            fontSize: isMobile ? "15px" : "18px",
            lineHeight: 1.8,
            textAlign: "justify",
            margin: "18px 0 0",
          }}
        >
          Hệ thống được xây dựng với mục tiêu giúp sinh viên quản lý minh
          chứng một cách khoa học, theo dõi tiến độ hoàn thiện hồ sơ, tiếp
          nhận nhận xét từ Ban Chủ nhiệm Câu lạc bộ và xuất hồ sơ phục vụ
          công tác xét chọn. Việc quản lý minh chứng tập trung góp phần giảm
          thời gian chuẩn bị hồ sơ, hạn chế sai sót và nâng cao hiệu quả
          trong quá trình xét duyệt.
        </p>
      </section>

      {/* ĐƯỜNG PHÂN CÁCH */}
      <div
        style={{
          height: "1px",
          background: "#e5e7eb",
          margin: "25px 0",
        }}
      />

      {/* ===== DANH HIỆU SINH VIÊN 5 TỐT ===== */}
      <section style={{ marginBottom: "30px" }}>
        <h3
          style={{
            margin: "0 0 15px",
            color: "#2563eb",
            fontSize: isMobile ? "20px" : "24px",
          }}
        >
          🏅 Danh hiệu Sinh viên 5 tốt
        </h3>

        <p
          style={{
            fontSize: isMobile ? "15px" : "18px",
            lineHeight: 1.8,
            textAlign: "justify",
            margin: 0,
          }}
        >
          Danh hiệu Sinh viên 5 tốt là danh hiệu cao quý của Hội Sinh viên
          Việt Nam, được trao tặng hằng năm cho những sinh viên có thành tích
          xuất sắc trong học tập, rèn luyện và tham gia Phong trào "Sinh viên
          5 tốt". Danh hiệu hướng tới xây dựng hình mẫu sinh viên Việt Nam
          phát triển toàn diện, có đạo đức, tri thức, sức khỏe, tinh thần
          tình nguyện và năng lực hội nhập, đáp ứng yêu cầu của thời kỳ mới.
        </p>

        <p
          style={{
            fontSize: isMobile ? "15px" : "18px",
            lineHeight: 1.8,
            textAlign: "justify",
            margin: "18px 0 0",
          }}
        >
          Để đạt được danh hiệu, sinh viên cần phấn đấu và đáp ứng đầy đủ các
          tiêu chuẩn ở 05 tiêu chí: Đạo đức tốt, Học tập tốt, Thể lực tốt,
          Tình nguyện tốt và Hội nhập tốt theo quy định của Hội Sinh viên
          Việt Nam. Danh hiệu được xét chọn ở các cấp từ cấp trường đến cấp
          tỉnh, thành phố và cấp Trung ương, là sự ghi nhận xứng đáng cho quá
          trình rèn luyện, cống hiến và phát triển toàn diện của mỗi sinh viên.
        </p>
      </section>

      <div
        style={{
          height: "1px",
          background: "#e5e7eb",
          margin: "25px 0",
        }}
      />

      {/* ===== MỤC TIÊU ===== */}
      <section style={{ marginBottom: "30px" }}>
        <h3
          style={{
            margin: "0 0 15px",
            color: "#2563eb",
            fontSize: isMobile ? "20px" : "24px",
          }}
        >
          🎯 Mục tiêu
        </h3>

        <ul
          style={{
            fontSize: isMobile ? "15px" : "18px",
            lineHeight: 1.8,
            paddingLeft: "25px",
            margin: 0,
          }}
        >
          <li>
            Hỗ trợ sinh viên xây dựng lộ trình phấn đấu đạt danh hiệu Sinh
            viên 5 tốt.
          </li>
          <li>Chuẩn hóa việc lưu trữ minh chứng theo từng tiêu chí.</li>
          <li>Rút ngắn thời gian chuẩn bị và nộp hồ sơ.</li>
          <li>
            Nâng cao hiệu quả quản lý, xét duyệt của Ban Chủ nhiệm Câu lạc bộ.
          </li>
          <li>
            Thúc đẩy chuyển đổi số trong công tác Hội và phong trào sinh viên.
          </li>
        </ul>
      </section>

      <div
        style={{
          height: "1px",
          background: "#e5e7eb",
          margin: "25px 0",
        }}
      />

      {/* ===== ĐỐI VỚI SINH VIÊN ===== */}
      <section style={{ marginBottom: "30px" }}>
        <h3
          style={{
            margin: "0 0 15px",
            color: "#2563eb",
            fontSize: isMobile ? "20px" : "24px",
          }}
        >
          👨‍🎓 Đối với sinh viên
        </h3>

        <ul
          style={{
            fontSize: isMobile ? "15px" : "18px",
            lineHeight: 1.8,
            paddingLeft: "25px",
            margin: 0,
          }}
        >
          <li>Lưu trữ minh chứng trực tuyến, an toàn và lâu dài.</li>
          <li>Theo dõi tiến độ hoàn thành từng tiêu chí.</li>
          <li>Xuất hồ sơ nhanh chóng khi đăng ký xét danh hiệu.</li>
          <li>
            Nhận góp ý, yêu cầu bổ sung minh chứng từ Ban Chủ nhiệm.
          </li>
          <li>Theo dõi trạng thái xét duyệt theo thời gian thực.</li>
        </ul>
      </section>

      <div
        style={{
          height: "1px",
          background: "#e5e7eb",
          margin: "25px 0",
        }}
      />

      {/* ===== ĐỐI VỚI BAN CHỦ NHIỆM ===== */}
      <section>
        <h3
          style={{
            margin: "0 0 15px",
            color: "#2563eb",
            fontSize: isMobile ? "20px" : "24px",
          }}
        >
          👨‍💼 Đối với Ban Chủ nhiệm
        </h3>

        <ul
          style={{
            fontSize: isMobile ? "15px" : "18px",
            lineHeight: 1.8,
            paddingLeft: "25px",
            margin: 0,
          }}
        >
          <li>Quản lý hồ sơ sinh viên tập trung.</li>
          <li>Kiểm tra và đánh giá minh chứng trực tuyến.</li>
          <li>Gửi nhận xét, yêu cầu chỉnh sửa.</li>
          <li>
            Theo dõi lịch sử thao tác và quá trình cập nhật hồ sơ.
          </li>
          <li>Thống kê dữ liệu phục vụ báo cáo và tổng kết.</li>
        </ul>
      </section>

    </div>
  </div>
)}

{tab === "criteria" && (
  <div
    style={{
      background:
        "linear-gradient(90deg, #32c8e8 0%, #62d8eb 40%, #a8eaf2 70%, #e4f9fb 100%)",
      minHeight: "100%",
      padding: isMobile ? "20px 12px" : "30px 5%",
      boxSizing: "border-box",
      color: "#000000",
    }}
  >
    {/* CARD LỚN CHỨA TOÀN BỘ NỘI DUNG */}
    <div
      style={{
        background: "#fff",
        borderRadius: "20px",
        padding: isMobile ? "20px" : "30px 35px",
        boxShadow: "0 8px 25px rgba(0,0,0,0.10)",
        boxSizing: "border-box",
      }}
    >

      {/* ===== CHỌN CẤP ===== */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px",
          marginBottom: "25px",
          flexWrap: "wrap",
        }}
      >
        {[
          {
            key: "school",
            label: "Cấp Trường",
          },
          {
            key: "province",
            label: "Cấp Tỉnh",
          },
          {
            key: "central",
            label: "Cấp Trung ương",
          },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setLevel(item.key as any)}
            style={{
              padding: "10px 20px",
              borderRadius: "12px",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              background:
                level === item.key
                  ? "#2563eb"
                  : "#f1f5f9",
              color:
                level === item.key
                  ? "white"
                  : "#334155",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ===== THÔNG TIN TIÊU CHUẨN ===== */}
      {header && (
        <div
          style={{
            textAlign: "center",
            marginBottom: "25px",
          }}
        >
          <h1
            style={{
              color: "#2563eb",
              margin: "0 0 6px",
              fontSize: isMobile ? "20px" : "24px",
              fontWeight: 700,
              lineHeight: 1.5,
            }}
          >
            Tiêu chuẩn Sinh viên 5 tốt{" "}
            {level === "school"
              ? "Cấp Trường"
              : level === "province"
              ? "Cấp Tỉnh"
              : "Cấp Trung Ương"}

            {header.period && (
              <span
                style={{
                  fontWeight: 600,
                }}
              >
                {" "}
                {header.period}
              </span>
            )}
          </h1>

          {header.decision && (
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "14px",
                color: "#64748b",
                fontStyle: "italic",
              }}
            >
              {header.decision}{" "}
              {level === "school"
                ? "của Ban Chấp hành Hội Sinh viên Việt Nam Trường Đại học Y Dược Buôn Ma Thuột"
                : level === "province"
                ? "của Ban Chấp hành Hội Sinh viên Việt Nam Tỉnh Đắk Lắk"
                : "của Ban Chấp hành Trung ương Hội Sinh viên Việt Nam"}
            </p>
          )}

          {header.description && (
            <p
              style={{
                margin: "10px 0 0",
                fontSize: "15px",
                color: "#475569",
                lineHeight: 1.7,
              }}
            >
              {header.description}
            </p>
          )}
        </div>
      )}

      {/* ===== CÁC TIÊU CHÍ ===== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "20px",
        }}
      >
        {criteria.map((item: any) => (
          <div
            className="criteria-card"
            key={item.id}
            style={{
              background: "#f8fafc",
              borderRadius: "18px",
              padding: isMobile ? "20px" : "28px",
              boxShadow:
                "0 4px 12px rgba(0,0,0,.06)",
              border: "1px solid #eef2f7",
              boxSizing: "border-box",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                color: "#2563eb",
                fontSize: isMobile ? "21px" : "26px",
                marginBottom: "10px",
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
                fontSize: isMobile ? "15px" : "17px",
                color: "#111827",
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
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  background: item.content?.trim()
                    ? "#DCFCE7"
                    : "#FEF3C7",
                  color: item.content?.trim()
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
                {new Date(
                  item.updated_at
                ).toLocaleString("vi-VN")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}
    </main>

    <Footer />
  </div>
  );
}