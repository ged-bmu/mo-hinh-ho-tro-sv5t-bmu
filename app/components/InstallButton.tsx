
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
  showIOSGuide,
  setShowIOSGuide,
  clearPrompt,
  markInstalled,
} = useInstallPrompt();

  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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

    </>
  );
}
