
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminSidebar() {
  const [showSidebar, setShowSidebar] = useState(false);

  const menuStyle = {
    display: "block",
    padding: "12px",
    borderRadius: "10px",
    textDecoration: "none",
    color: "#1e293b",
    marginBottom: "10px",
    background: "#f8fafc",
    fontWeight: 500,
    transition: "all 0.2s ease",
    flexShrink: 0,
  } as const;

  function handleMouseEnter(
    e: React.MouseEvent<HTMLAnchorElement>
  ) {
    e.currentTarget.style.background = "#e0f2fe";
    e.currentTarget.style.color = "#0369a1";
    e.currentTarget.style.transform = "translateX(5px) scale(1.02)";
    e.currentTarget.style.boxShadow =
      "0 4px 12px rgba(0,0,0,0.08)";
  }

  function handleMouseLeave(
    e: React.MouseEvent<HTMLAnchorElement>
  ) {
    e.currentTarget.style.background = "#f8fafc";
    e.currentTarget.style.color = "#1e293b";
    e.currentTarget.style.transform = "translateX(0) scale(1)";
    e.currentTarget.style.boxShadow = "none";
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/introduce";
  }

  return (
    <>
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          width: 50,
          height: 50,
          border: "none",
          borderRadius: 12,
          background: "#fff",
          boxShadow: "0 2px 10px rgba(0,0,0,.1)",
          cursor: "pointer",
          fontSize: 24,
          zIndex: 1000,
        }}
      >
        ☰
      </button>

      {showSidebar && (
        <div
          onMouseLeave={() => setShowSidebar(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "min(260px, 85vw)",
            height: "100dvh",
            maxHeight: "100vh",
            background: "#fff",
            boxShadow: "4px 0 20px rgba(0,0,0,.1)",
            padding: 20,
            paddingBottom: 20,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            overscrollBehavior: "contain",
            zIndex: 999,
          }}
        >
          <h2
            style={{
              marginTop: 70,
              marginBottom: 30,
              flexShrink: 0,
            }}
          >
            🛠 Menu
          </h2>

          {[
            ["📋 Danh sách sinh viên", "/admin"],
            ["👥 Quản lý tài khoản", "/admin/users"],
            ["👥 Theo dõi CLB", "/admin/theodoitvclb"],
            ["📊 Thống kê", "/admin/statistics"],
            ["💬 Nhắn tin", "/trao-doi"],
            ["🔔 Thông báo", "/admin/activity"],
            ["📅 Cập nhật hoạt động", "/admin/activities"],
            ["📑 Cập nhật Tiêu chuẩn", "/admin/criteria"],
            ["🔐 Đổi mật khẩu", "/doi-mat-khau"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              style={menuStyle}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {label}
            </a>
          ))}

          <button
            onClick={logout}
            style={{
              marginTop: "auto",
              flexShrink: 0,
              width: "100%",
              padding: 12,
              border: "none",
              borderRadius: 10,
              background: "#ef4444",
              color: "#fff",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#dc2626";
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ef4444";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            Đăng xuất
          </button>
        </div>
      )}
    </>
  );
}
