"use client";

import { useEffect, useState } from "react";

type HeaderProps = {
  tab: string;
  setTab: (tab: string) => void;
  openCriteria: () => void;
};

export default function Header({
  tab,
  setTab,
  openCriteria,
}: HeaderProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <header
      className="header"
      style={{
        background: "#ffffff",
        padding: "14px 28px",
        borderBottom: "1px solid #c0c0c0",
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

            <button
              className="header-btn"
              onClick={openCriteria}
              style={{
                padding: "8px 10px",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 600,
                background: "#0055ff",
                color: "#fff",
                fontSize: "12px",
              }}
            >
              📑 Xem tiêu chí
            </button>
          </div>

          {/* Hàng dưới */}
          <img
            className="header-title"
            src="/Tenhethong.png"
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
            src="/Tenhethong.png"
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
          <button
  className="header-btn"
  onClick={openCriteria}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "translateY(-3px) scale(1.03)";
    e.currentTarget.style.background = "#003ecf";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "translateY(0) scale(1)";
    e.currentTarget.style.background = "#0055ff";
    e.currentTarget.style.boxShadow = "none";
  }}
  style={{
    padding: "10px 18px",
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 600,
    transition: "all .25s ease",
    background: "#0055ff",
    color: "#fff",
    boxShadow: "0 4px 12px rgba(0,85,255,.2)",
  }}
>
  📑 Xem tiêu chí
</button>
          </div>
        </div>
      )}
    </header>
  );
}