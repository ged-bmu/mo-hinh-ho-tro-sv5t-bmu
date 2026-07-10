"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Kiểm tra iPhone / iPad
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" &&
        navigator.maxTouchPoints > 1);

    setIsIOS(ios);

    // Nếu đã cài PWA thì ẩn nút
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const beforeInstallHandler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const installedHandler = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener(
      "beforeinstallprompt",
      beforeInstallHandler
    );

    window.addEventListener(
      "appinstalled",
      installedHandler
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        beforeInstallHandler
      );

      window.removeEventListener(
        "appinstalled",
        installedHandler
      );
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  if (installed) return null;

  // Android/PC chưa có prompt và cũng không phải iPhone
  if (!deferredPrompt && !isIOS) return null;

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
          borderRadius: "12px",
          padding: "15px 35px",
          fontWeight: 600,
          fontSize: "18px",
          cursor: "pointer",
          transition: "all .25s ease",
          minWidth: "260px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        {isIOS ? <Smartphone size={22} /> : <Download size={22} />}
        {isIOS
          ? "Thêm vào màn hình chính"
          : "Cài đặt ứng dụng"}
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
              🍎 Cài đặt trên iPhone
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
              <li>Nhấn nút <b>Chia sẻ</b> (□↑) trong Safari.</li>
              <li>Chọn <b>Thêm vào Màn hình chính</b>.</li>
              <li>Nhấn <b>Thêm</b>.</li>
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