"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "../components/Footer";

export default function IntroducePage() {
  const [tab, setTab] = useState("home");

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
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 50px",
          background: "white",
          borderBottom: "1px solid #eee",
        }}
      >
        <img
          src="/logo-header.png"
          alt="Logo"
          style={{
            height: "70px",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
          }}
        >
          <button
            onClick={() => setTab("home")}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: 600,
              background: tab === "home" ? "#2563eb" : "#f3f4f6",
              color: tab === "home" ? "white" : "#111",
            }}
          >
            Trang chủ
          </button>

          <button
            onClick={() => setTab("about")}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: 600,
              background: tab === "about" ? "#2563eb" : "#f3f4f6",
              color: tab === "about" ? "white" : "#111",
            }}
          >
            Giới thiệu
          </button>

          <button
            onClick={() => setTab("criteria")}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: 600,
              background: tab === "criteria" ? "#2563eb" : "#f3f4f6",
              color: tab === "criteria" ? "white" : "#111",
            }}
          >
            Tiêu chí
          </button>

          <Link
            href="/login"
            style={{
              background: "#bababa",
              color: "white",
              textDecoration: "none",
              padding: "10px 22px",
              borderRadius: "10px",
              fontWeight: 600,
            }}
          >
            Đăng nhập
          </Link>
        </div>
      </div>

      {/* Banner + nội dung */}
      <main
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
          style={{
            background: "rgba(255,255,255,0.96)",
            borderRadius: "28px",
            padding: "25px 55px 70px",
            maxWidth: "1100px",
            width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }}
        >
          
    {tab === "home" && (
  <>
  
   <h1
      style={{
        marginBottom: "5px",
        fontSize: "18px",
        fontWeight: 500,
        textAlign: "center",
        color: "#0f172a",
      }}
    >
      <b>CÂU LẠC BỘ SINH VIÊN 5 TỐT TRƯỜNG ĐẠI HỌC Y DƯỢC BUÔN MA THUỘT</b>
    </h1>

    <p
      style={{
        textAlign: "center",
        fontSize: "24px",
        fontWeight: "bold",
        marginTop: "0px",
        color: "#0f65de",
      }}
    >
      Mô hình hỗ trợ sinh viên phấn đấu đạt danh hiệu Sinh viên 5 tốt các cấp
    </p>
    <p
      style={{
        fontSize: "18px",
        lineHeight: "2",
        textAlign: "justify",
        marginTop: "20px",
        
      }}
    >
      Hệ thống Sinh viên 5 tốt BMU là nền tảng trực tuyến được xây dựng và quản
      lý bởi <b>Câu lạc bộ Sinh viên 5 tốt Trường Đại học Y Dược Buôn Ma Thuột</b>,
      nhằm hỗ trợ sinh viên trong quá trình đăng ký, lưu trữ minh chứng và hoàn thiện hồ sơ xét
      chọn danh hiệu Sinh viên 5 tốt các cấp.
    </p>

    <p
      style={{
        fontSize: "18px",
        lineHeight: "2",
        textAlign: "justify",
        marginTop: "15px",
        
      }}
    >
      Với định hướng chuyển đổi số trong công tác Đoàn – Hội, hệ thống giúp đơn
      giản hóa quy trình chuẩn bị hồ sơ, tăng tính minh bạch trong xét duyệt và tạo
      môi trường thuận lợi để sinh viên chủ động theo dõi quá trình phấn đấu của
      mình.
    </p>
     <p
      style={{
        fontSize: "18px",
        lineHeight: "2",
        textAlign: "justify",
        marginTop: "15px",
              }}
    >
      Thông qua hệ thống, sinh viên có thể lưu trữ minh chứng theo từng tiêu chí, theo dõi tiến độ hoàn thiện hồ sơ, nhận góp ý từ Ban Chủ nhiệm Câu lạc bộ và xuất hồ sơ khi tham gia các đợt xét chọn. Mọi minh chứng được quản lý tập trung, giúp giảm thời gian tổng hợp hồ sơ và hạn chế sai sót trong quá trình chuẩn bị.
    </p>

    <h3
      style={{
        marginTop: "35px",
        color: "#2563eb",
        fontSize: "24px",
      }}
    >
      🖥 Hệ thống hỗ trợ
    </h3>

    <ul
      style={{
        fontSize: "18px",
        lineHeight: "2",
        paddingLeft: "25px",
      }}
    >
      
      <li>📂 Lưu trữ minh chứng trực tuyến theo từng tiêu chí.</li>
      <li>📊 Theo dõi tiến độ hoàn thiện hồ sơ Sinh viên 5 tốt.</li>
      <li>💬 Nhận góp ý và hướng dẫn từ Ban Chủ nhiệm Câu lạc bộ.</li>
      <li>📄 Xuất hồ sơ nhanh chóng khi có nhu cầu đăng ký xét danh hiệu.</li>
    </ul>
      </>
)}
{tab === "about" && (
  <>
  <h1
      style={{
        marginBottom: "5px",
        fontSize: "18px",
        fontWeight: 500,
        textAlign: "center",
        color: "#0f172a",
      }}
    >
      <b>CÂU LẠC BỘ SINH VIÊN 5 TỐT TRƯỜNG ĐẠI HỌC Y DƯỢC BUÔN MA THUỘT</b>
    </h1>

    <p
      style={{
        textAlign: "center",
        fontSize: "24px",
        fontWeight: "bold",
        marginTop: "0px",
        color: "#0f65de",
      }}
    >
      Mô hình hỗ trợ sinh viên phấn đấu đạt danh hiệu Sinh viên 5 tốt các cấp
    </p>
    <h1
      style={{
        textAlign: "center",
        color: "#000000",
        marginTop: "10px",
        marginBottom: "20px",
        fontSize: "24px",
      }}
    >
      <b>GIỚI THIỆU</b>
    </h1>


    <p style={{ fontSize: 18, lineHeight: 2, textAlign: "justify" }}>
      Hệ thống <b>Sinh viên 5 tốt BMU</b> là nền tảng trực tuyến được phát triển
      bởi <b>Câu lạc bộ Sinh viên 5 tốt Trường Đại học Y Dược Buôn Ma Thuột </b>
       nhằm hỗ trợ sinh viên trong quá trình chuẩn bị hồ sơ xét danh hiệu
      <b> Sinh viên 5 tốt</b>.
    </p>

    <p style={{ fontSize: 18, lineHeight: 2, textAlign: "justify" }}>
      Hệ thống được xây dựng với mục tiêu giúp sinh viên quản lý minh chứng một
      cách khoa học, theo dõi tiến độ hoàn thiện hồ sơ và nhận góp ý từ Ban Chủ
      nhiệm Câu lạc bộ trong suốt quá trình phấn đấu.
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
      <li>Theo dõi tiến độ xét duyệt.</li>
      <li>Thống kê dữ liệu phục vụ báo cáo và tổng kết.</li>
    </ul>
    
  </>
)}
{tab === "criteria" && (
  <>
    <h1
      style={{
        textAlign: "center",
        color: "#2563eb",
        marginBottom: "30px",
      }}
    >
      TIÊU CHÍ SINH VIÊN 5 TỐT
    </h1>

    <div
      style={{
        background: "#f8fafc",
        border: "2px dashed #cbd5e1",
        borderRadius: "16px",
        padding: "50px 30px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "64px",
          marginBottom: "20px",
        }}
      >
        🚧
      </div>

      <h2
        style={{
          color: "#2563eb",
          marginBottom: "10px",
        }}
      >
        Chưa cập nhật
      </h2>

      <p
        style={{
          fontSize: "18px",
          color: "#64748b",
          lineHeight: "1.8",
        }}
      >
        Nội dung tiêu chí Sinh viên 5 tốt đang được cập nhật.
        <br />
        Vui lòng quay lại trong thời gian tới.
      </p>
    </div>
  </>
)}

          <div
            style={{
              marginTop: 40,
              textAlign: "center",
            }}
          >
            <Link
              href="/login"
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