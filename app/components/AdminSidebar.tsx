"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminSidebar() {
  const [showSidebar, setShowSidebar] = useState(false);

  const menuStyle = {
    display: "block",
    padding: "12px 12px",
    borderRadius: "10px",
    textDecoration: "none",
    color: "#1e293b",
    marginBottom: "10px",
    background: "#f8fafc",
    fontWeight: 500,
  };

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/introduce";
  }

  return (
    <>
      <button
        onMouseEnter={() => setShowSidebar(true)}
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
          zIndex: 999,
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
            width: 260,
            height: "100vh",
            background: "#fff",
            boxShadow: "4px 0 20px rgba(0,0,0,.1)",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            zIndex: 998,
          }}
        >
          <h2
            style={{
              marginTop: 70,
              marginBottom: 30,
            }}
          >
            🛠 Menu
          </h2>

          <a href="/admin" style={menuStyle}>
            📋 Danh sách sinh viên
          </a>

          <a href="/admin/users" style={menuStyle}>
            👥 Quản lý tài khoản
          </a>

          <a href="/admin/statistics" style={menuStyle}>
            📊 Thống kê
          </a>
          <a href="/trao-doi" style={menuStyle}>
          💬 Nhắn tin
          </a>
          <a href="/admin/activity" style={menuStyle}>
            🔔 Thông báo
          </a>

          <a href="/admin/activities" style={menuStyle}>
           📅 Cập nhật hoạt động
          </a>

          <a href="/admin/criteria" style={menuStyle}>
            📑 Cập nhật Tiêu chuẩn
          </a>

          <a href="/doi-mat-khau" style={menuStyle}>
            🔐 Đổi mật khẩu
          </a>

          <button
            onClick={logout}
            style={{
              marginTop: "auto",
              width: "100%",
              padding: 12,
              border: "none",
              borderRadius: 10,
              background: "#ef4444",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Đăng xuất
          </button>
        </div>
      )}
    </>
  );
}