"use client";

import { useEffect, useState } from "react";
import DriveProfileModal from "../components/DriveProfileModal";

type HeaderProps = {
  tab: string;
  setTab: (tab: string) => void;
  openCriteria: () => void;
  openProfile: () => void;
};

export default function Header({
  tab,
  setTab,
  openCriteria,
  openProfile,
}: HeaderProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
<header
  className="header"
  style={{
    position: "sticky",
    top: 0,
    zIndex: 9999,

    background: "rgba(255, 255, 255, 0.96)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",

    padding: "14px 28px",
    borderBottom: "1px solid #dbe3ef",

    boxShadow: "0 4px 18px rgba(15, 23, 42, 0.07)",
  }}
>
        {isMobile ? (
          <div
            className="header-container-mobile"
            style={{
              maxWidth: "1400px",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <img
                className="header-logo"
                src="/logo-header.png"
                alt="Logo"
                style={{
                  height: 38,
                  cursor: "pointer",
                }}
                onClick={() => (window.location.href = "/")}
              />

              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowMenu((prev) => !prev)}
                  style={{
                    width: 42,
                    height: 42,
                    border: "none",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontSize: 22,
                    background: "transparent",
                    color: "#333",
                  }}
                  aria-label="Mở menu"
                >
                  ☰
                </button>

                {showMenu && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50px",
                      right: 0,
                      width: 190,
                      background: "#fff",
                      borderRadius: 12,
                      boxShadow: "0 8px 25px rgba(0,0,0,0.18)",
                      border: "1px solid #e5e7eb",
                      overflow: "hidden",
                      zIndex: 9999,
                    }}
                  >
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        openCriteria();
                      }}
                      onMouseEnter={(e) => {
  e.currentTarget.style.background = "#eff6ff";
  e.currentTarget.style.color = "#2563eb";
}}
onMouseLeave={(e) => {
  e.currentTarget.style.background = "#fff";
  e.currentTarget.style.color = "#111";
}}
                      style={{
                        width: "100%",
                        padding: "13px 15px",
                        border: "none",
                        background: "#fff",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      📑 Xem tiêu chuẩn
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowProfile(true);
                      }}
                      onMouseEnter={(e) => {
  e.currentTarget.style.background = "#eff6ff";
  e.currentTarget.style.color = "#2563eb";
}}
onMouseLeave={(e) => {
  e.currentTarget.style.background = "#fff";
  e.currentTarget.style.color = "#111";
}}
                      style={{
                        width: "100%",
                        padding: "13px 15px",
                        border: "none",
                        borderTop: "1px solid #eee",
                        background: "#fff",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      📂 Hồ sơ mẫu
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Hàng dưới */}
            <img
              className="header-title"
              src="/Tenhethong2.png"
              alt="Tên hệ thống"
              style={{
                marginTop: 8,
                width: 220,
                height: "auto",
              }}
            />
          </div>
        ) : (
          <div
            className="header-container"
            style={{
              maxWidth: "1400px",
              margin: "0 auto",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <img
              className="header-logo"
              src="/logo-header.png"
              alt="Logo"
              style={{
                height: 55,
                cursor: "pointer",
              }}
              onClick={() => (window.location.href = "/")}
            />

            <img
              className="header-title"
              src="/Tenhethong2.png"
              alt="Tên hệ thống"
              style={{
                height: 48,
                objectFit: "contain",
              }}
            />

            <div
              className="header-right"
              style={{
                display: "flex",
                gap: 15,
              }}
            >
              <div style={{ position: "relative" }}>
                <button
                
                  onClick={() => setShowMenu((prev) => !prev)}
                  style={{
                    width: 46,
                    height: 46,
                    border: "none",
                    borderRadius: 12,
                    cursor: "pointer",
                    fontSize: 23,
                    background: "transparent",
                    color: "#333",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all .25s ease",
                    boxShadow:
                      "0 4px 12px rgba(97, 97, 97, 0.2)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(-3px) scale(1.03)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(0) scale(1)";
                  }}
                  aria-label="Mở menu"
                >
                  ☰
                </button>

                {showMenu && (
                  <div
                    style={{
                      position: "absolute",
                      top: "54px",
                      right: 0,
                      width: 210,
                      background: "#fff",
                      borderRadius: 12,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
                      border: "1px solid #e5e7eb",
                      overflow: "hidden",
                      zIndex: 9999,
                    }}
                  >
                   <button
  onClick={() => {
    setShowMenu(false);
    openCriteria();
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = "#eff6ff";
    e.currentTarget.style.color = "#2563eb";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = "#fff";
    e.currentTarget.style.color = "#111";
  }}
  style={{
    width: "100%",
    padding: "14px 16px",
    border: "none",
    background: "#fff",
    textAlign: "left",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    transition: "all 0.2s ease",
  }}
>
  📑 Xem tiêu chuẩn
</button>

                    <button
  onClick={() => {
    setShowMenu(false);
    setShowProfile(true);
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = "#eff6ff";
    e.currentTarget.style.color = "#2563eb";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = "#fff";
    e.currentTarget.style.color = "#111";
  }}
  style={{
    width: "100%",
    padding: "14px 16px",
    border: "none",
    borderTop: "1px solid #eee",
    background: "#fff",
    textAlign: "left",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    transition: "all 0.2s ease",
  }}
>
  📂 Hồ sơ mẫu
</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* MODAL HỒ SƠ MẪU */}
      <DriveProfileModal
        open={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </>
  );
}