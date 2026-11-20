
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

  if (!deferredPrompt && !isIOS && !isMobile) return null;

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

      {showIOSGuide && (
        <div
          onClick={() => setShowIOSGuide(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 99999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "90%",
              maxWidth: "420px",
              background: "#fff",
              borderRadius: "18px",
              padding: "24px",
              boxShadow: "0 20px 60px rgba(0,0,0,.2)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                color: "#2563eb",
                textAlign: "center",
              }}
            >
              Cài đặt trên iPhone
            </h2>

            <p style={{ lineHeight: 1.8 }}>
              Để thêm ứng dụng vào Màn hình chính:
            </p>

            <ol
              style={{
                lineHeight: 2,
                paddingLeft: "20px",
              }}
            >
              <li
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  flexWrap: "wrap",
                }}
              >
                Nhấn nút <b>Chia sẻ</b>

                <img
                  src="/share-ios.png"
                  alt="Chia sẻ"
                  style={{
                    width: "18px",
                    height: "18px",
                    objectFit: "contain",
                  }}
                />

                ở thanh dưới của Safari.
              </li>

              <li>
                Chọn <b>Thêm vào Màn hình chính</b>.
              </li>

              <li>
                Nhấn <b>Thêm</b> để hoàn tất.
              </li>

              <li>
                Bật <b>Mở dưới dạng ứng dụng web</b>.
              </li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              style={{
                width: "100%",
                marginTop: "18px",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "12px",
                fontWeight: 600,
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
