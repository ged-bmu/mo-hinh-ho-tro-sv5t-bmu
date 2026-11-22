
"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useInstallPrompt } from "./InstallPromptContext";

export default function InstallButton({
  isHeader = false,
}: {
  isHeader?: boolean;
}) {
  const {
    deferredPrompt,
    installed,
    clearPrompt,
    markInstalled,
  } = useInstallPrompt();

  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const isDevelopment = process.env.NODE_ENV === "development";

  useEffect(() => {
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" &&
        navigator.maxTouchPoints > 1);

    setIsIOS(ios);

    const checkMobile = () => {
      setIsMobile(
        ios ||
          /Android|Mobile/i.test(navigator.userAgent) ||
          window.matchMedia("(max-width: 768px)").matches
      );
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert("Hiện chưa có sự kiện cài đặt PWA.");
      return;
    }

    try {
      await deferredPrompt.prompt();

      const { outcome } = await deferredPrompt.userChoice;

      clearPrompt();

      if (outcome === "accepted") {
        markInstalled();
      }
    } catch (error) {
      console.error("Lỗi cài đặt PWA:", error);
    }
  };

  if (installed) return null;

  if (!deferredPrompt && !isIOS && !isMobile && !isDevelopment) return null;

  return (
    <>
      <button
        onClick={() => {
          if (isIOS) {
            setShowIOSGuide(true);
          } else {
            handleInstall();
          }
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#2563eb";
          e.currentTarget.style.color = "#fff";
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow =
            "0 8px 20px rgba(37,99,235,.25)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#fff";
          e.currentTarget.style.color = "#2563eb";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
        style={{
          background: "#fff",
          color: "#2563eb",
          border: "2px solid #2563eb",
          borderRadius: "10px",
          padding: "13px 20px",
          fontWeight: 400,
          fontSize: "18px",
          cursor: "pointer",
          transition: "all 0.25s ease",
          width: "100%",
          height: "52px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          boxSizing: "border-box",
        }}
      >
        <Download size={22} />
        {isHeader ? "Tải" : isMobile ? "Tải ứng dụng" : ""}
      </button>

       {/* Nút xem thử hướng dẫn iPhone - chỉ hiện khi chạy localhost */}
      {isDevelopment && !isIOS && (
        <button
          onClick={() => setShowIOSGuide(true)}
          style={{
            width: "100%",
            marginTop: "10px",
            padding: "10px",
            background: "#eff6ff",
            color: "#2563eb",
            border: "1px dashed #2563eb",
            borderRadius: "10px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Xem thử hướng dẫn iPhone
        </button>
      )}

{showIOSGuide && (
  <div
    onClick={() => setShowIOSGuide(false)}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.55)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 99999,
      padding: "16px",
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "100%",
        maxWidth: "420px",
        maxHeight: "85vh",
        background: "#fff",
        borderRadius: "18px",
        padding: "20px",
        boxShadow: "0 20px 60px rgba(0,0,0,.2)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Tiêu đề */}
      <h2
        style={{
          margin: "0 0 8px",
          color: "#2563eb",
          textAlign: "center",
          fontSize: "20px",
          marginBottom: "25px",
        }}
      >
        <b>Cài đặt trên thiết bị iOS</b>
      </h2>

      {/* Nội dung hình ảnh */}
      <div
        style={{
          overflowY: "auto",
          flex: 1,
          minHeight: 0,
          paddingRight: "4px",
        }}
      >
        {[
          {
            img: "1.jpg",
            title: "Bước 1. Mở trang web bằng Safari",
            desc: "Truy cập hệ thống bằng trình duyệt Safari trên iPhone.",
          },
          {
            img: "2.jpg",
            title: "Bước 2. Tìm kiếm",
            desc: "tìm kiếm từ khóa [Mô hình hỗ trợ SV5T BMU].",
          },
          {
            img: "3.jpg",
            title: "Bước 3. Truy cập hệ thống",
          },
          {
            img: "4.jpg",
            title: "Bước 4. Chọn nút ... ở góc dưới bên phải",
          },
          {
            img: "5.jpg",
            title: "Bước 5. Chọn chia sẻ",
          },
          {
            img: "6.jpg",
            title: "Bước 6. Chọn Thêm vào Mành hình chính",
          },
          {
            img: "7.jpg",
            title: "Bước 7. Chọn Thêm để Hoàn tất cài đặt",
            desc: "Biểu tượng hệ thống sẽ xuất hiện trên Màn hình chính của iPhone.",
          },
        ].map((step, index) => (
          <div
            key={step.img}
            style={{
              marginBottom: "22px",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: "15px",
                color: "#2563eb",
                marginBottom: "7px",
              }}
            >
              {step.title}
            </div>

            <img
              src={`/${step.img}`}
              alt={step.title}
              style={{
                display: "block",
                width: "100%",
                height: "auto",
                objectFit: "contain",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
              }}
            />

            <p
              style={{
                fontSize: "13px",
                lineHeight: 1.6,
                color: "#64748b",
                margin: "7px 2px 0",
              }}
            >
              {step.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Nút đóng */}
      <button
        onClick={() => setShowIOSGuide(false)}
        style={{
          width: "100%",
          marginTop: "14px",
          flexShrink: 0,
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          padding: "12px",
          fontWeight: 600,
          fontSize: "15px",
          cursor: "pointer",
        }}
      >
        Đã hiểu
      </button>
    </div>
  </div>
)}
    </>
  );
}
