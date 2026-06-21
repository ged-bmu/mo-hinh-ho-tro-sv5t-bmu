"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import Sidebar from "../components/Sidebar";

export default function DoiMatKhauPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  async function handleChangePassword() {
    if (password.length < 6) {
      alert("Mật khẩu phải từ 6 ký tự.");
      return;
    }

    if (password !== confirm) {
      alert("Mật khẩu xác nhận không khớp.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

  alert("Đổi mật khẩu thành công.");

window.location.href = "/";
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      <Sidebar />

      <main
        style={{
          flex: 1,
          background: "#f5f7fb",
          padding: "30px",
        }}
      >
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            background: "white",
            padding: "30px",
            borderRadius: "16px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >
          <h1 style={{ marginBottom: "25px" }}>
            🔐 Đổi mật khẩu
          </h1>

          <div style={{ marginBottom: "15px" }}>
            <label>Mật khẩu mới</label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "6px",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label>Xác nhận mật khẩu</label>

            <input
              type="password"
              value={confirm}
              onChange={(e) =>
                setConfirm(e.target.value)
              }
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "6px",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            />
          </div>

          <button
            onClick={handleChangePassword}
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              padding: "12px 20px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Lưu mật khẩu mới
          </button>
        </div>
      </main>
    </div>
  );
}