"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [mssv, setMssv] = useState("");
  const [password, setPassword] = useState("");

 async function handleLogin() {
  const email = `${mssv}@clbsv5tbmu.com`;

  const { error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    alert("Sai MSSV hoặc mật khẩu");
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") {
    window.location.href = "/admin";
  } else {
    window.location.href = "/";
  }
}
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f7fb",
      }}
    >
      <div
        style={{
          width: "520px",
          background: "white",
          padding: "30px",
          borderRadius: "16px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <div
  style={{
    textAlign: "center",
    marginBottom: "25px",
  }}
>
  <img
  src="/logo-header.png"
  alt="Logo BMU"
  style={{
    width: "300px",
    height: "140px",
    objectFit: "contain",
    display: "block",
    margin: "0 auto 15px",
  }}
/>
  <h1
    style={{
      fontSize: "20px",
      fontWeight: "700",
      lineHeight: "1.4",
      marginBottom: "10px",
    }}
  >
    CÂU LẠC BỘ SINH VIÊN 5 TỐT
    <br />
    TRƯỜNG ĐẠI HỌC Y DƯỢC BUÔN MA THUỘT
  </h1>

  <div
    style={{
      fontSize: "16px",
      color: "#64748b",
      lineHeight: "1.5",
    }}
  >
    MÔ HÌNH HỖ TRỢ SINH VIÊN PHẤN ĐẤU
    <br />
    ĐẠT DANH HIỆU SINH VIÊN 5 TỐT CÁC CẤP
  </div>

  <div
    style={{
      marginTop: "15px",
      fontSize: "20px",
      fontWeight: "600",
    }}
  >
    🔐 ĐĂNG NHẬP
  </div>
</div>

        <input
          placeholder="MSSV"
          value={mssv}
          onChange={(e) => setMssv(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "15px",
          }}
        />

        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "10px",
          }}
        />

        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            marginTop: "20px",
            padding: "12px",
            border: "none",
            background: "#2563eb",
            color: "white",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Đăng nhập
        </button>
      </div>
    </main>
  );
}