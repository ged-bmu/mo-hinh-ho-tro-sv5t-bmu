
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { createPortal } from "react-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

type InstallContextType = {
  deferredPrompt: BeforeInstallPromptEvent | null;
  installed: boolean;
  showIOSGuide: boolean;
  setShowIOSGuide: (show: boolean) => void;
  clearPrompt: () => void;
  markInstalled: () => void;
};

const InstallContext = createContext<InstallContextType>({
  deferredPrompt: null,
  installed: false,
  showIOSGuide: false,
  setShowIOSGuide: () => {},
  clearPrompt: () => {},
  markInstalled: () => {},
});
export function useInstallPrompt() {
  return useContext(InstallContext);
}

export default function InstallPromptProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [installed, setInstalled] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true
    ) {
      setInstalled(true);
    }

    const beforeInstallHandler = (e: Event) => {
      e.preventDefault();
      console.log("ĐÃ NHẬN beforeinstallprompt:", e);
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

    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        beforeInstallHandler
      );

      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const clearPrompt = () => {
    setDeferredPrompt(null);
  };

  const markInstalled = () => {
    setInstalled(true);
    setDeferredPrompt(null);
  };

  return (
  <InstallContext.Provider
    value={{
      deferredPrompt,
      installed,
      showIOSGuide,
      setShowIOSGuide,
      clearPrompt,
      markInstalled,
    }}
  >
    {children}

    {showIOSGuide && typeof document !== "undefined" &&
  createPortal(
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
          <h2
            style={{
              margin: "0 0 25px",
              color: "#2563eb",
              textAlign: "center",
              fontSize: "20px",
            }}
          >
            <b>Cài đặt trên thiết bị iOS</b>
          </h2>

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
                desc: "Tìm kiếm từ khóa [Mô hình hỗ trợ SV5T BMU].",
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
                title: "Bước 6. Chọn Thêm vào Màn hình chính",
              },
              {
                img: "7.jpg",
                title: "Bước 7. Chọn Thêm để hoàn tất cài đặt",
                desc: "Biểu tượng hệ thống sẽ xuất hiện trên Màn hình chính của iPhone.",
              },
            ].map((step) => (
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

                {step.desc && (
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
                )}
              </div>
            ))}
          </div>

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
document.body
   )}
  </InstallContext.Provider>
);
}
