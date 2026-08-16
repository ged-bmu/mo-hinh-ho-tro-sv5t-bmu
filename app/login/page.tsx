"use client";

import { supabase } from "../../lib/supabase";
import Footer from "../components/Footer";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [mssv, setMssv] = useState("");
  const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  checkMobile(); // kiểm tra lần đầu
  window.addEventListener("resize", checkMobile);

  return () => window.removeEventListener("resize", checkMobile);
}, []);
  const [password, setPassword] = useState("");
  const [rememberLogin, setRememberLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(180deg, #f8fbff, #eef4ff)",
    }}
  >
    <main
      style={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "30px 20px",
      }}
    >
      <div
        style={{
          width: "min(92vw, 480px)",
          background: "white",
          padding: "30px",
          borderRadius: "16px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
       <div
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "15px",
    marginBottom: "12px",
  }}
>
 <img
  src="/logo-header.png"
  style={{
    width: "min(220px, 65vw)",
    height: "auto",
  }}
/>

<img
  src="/Tenhethong2.png"
  style={{
    width: "min(450px, 90vw)",
    height: "auto",
  }}
/>

<div
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: "14px",
  }}
>
  
  <div
    style={{
      fontSize: isMobile ? "13px" : "16px",
      fontWeight: "700",
      lineHeight: "1.5",
      color: "#1e293b",
      marginTop: "30px",
    }}
  >
    CÂU LẠC BỘ SINH VIÊN 5 TỐT
    <br />
    TRƯỜNG ĐẠI HỌC Y DƯỢC BUÔN MA THUỘT
  </div>
  <div
    style={{
      marginTop: "8px",
      fontSize: "20px",
      fontWeight: "700",
      color: "#4168bb",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    }}
  >
    <span>🔐</span>
    <span>ĐĂNG NHẬP</span>
  </div>
</div>
        </div>
<form
  onSubmit={(e) => {
    e.preventDefault();
    handleLogin();
  }}
>

<label
  style={{
    display: "block",
    marginTop: "15px",
    marginBottom: "3px",
    marginLeft: "3px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#94a3b8",
  }}
>
  Mã số sinh viên
</label>

<input
  placeholder="Nhập mã số sinh viên"
  value={mssv}
  onChange={(e) => setMssv(e.target.value)}
  style={{
    width: "100%",
    padding: "12px 14px",
    boxSizing: "border-box",
    border: "1px solid #d9dee7",
    borderRadius: "10px",
    outline: "none",
    fontSize: "15px",
    color: "#000000",
    background: "#fff",
  }}
/>

<label
  style={{
    display: "block",
    marginTop: "14px",
    marginBottom: "3px",
    marginLeft: "3px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#94a3b8",
  }}
>
  Mật khẩu
</label>

<div
  style={{
    position: "relative",
    width: "100%",
  }}
>
  <input
    type={showPassword ? "text" : "password"}
    placeholder="Nhập mật khẩu"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    style={{
      width: "100%",
      padding: "12px 45px 12px 14px",
      boxSizing: "border-box",
      border: "1px solid #d9dee7",
      borderRadius: "10px",
      outline: "none",
      fontSize: "15px",
      color: "#000000",
      background: "#fff",
    }}
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    style={{
      position: "absolute",
      right: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      border: "none",
      background: "transparent",
      padding: "4px",
      cursor: "pointer",
      fontSize: "18px",
      color: "#94a3b8",
    }}
    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
  >
    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
  </button>
</div>
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "6px",
    marginLeft: "3px",
    marginRight: "3px",
    height: "28px",
  }}
>
  {/* LƯU ĐĂNG NHẬP */}
  <label
    style={{
      display: "flex",
      alignItems: "center",
      gap: "7px",
      fontSize: "14px",
      color: "#7a7c80",
      cursor: "pointer",
      lineHeight: 1,
      margin: 0,
    }}
  >
    <input
      type="checkbox"
      checked={rememberLogin}
      onChange={(e) => setRememberLogin(e.target.checked)}
      style={{
        width: "18px",
        height: "18px",
        margin: 0,
        cursor: "pointer",
        accentColor: "#2563eb",
      }}
    />

    <span>Lưu đăng nhập</span>
  </label>

  {/* ĐĂNG KÝ */}
  <a
    href="/register"
    style={{
      fontSize: "15px",
      color: "#3485f8",
      textDecoration: "none",
      cursor: "pointer",
      lineHeight: 1,
      marginTop: "3px",
    }}
  >
    Đăng ký
  </a>
</div>
        <button
  type="submit"
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
</form>
      </div>
    </main>
    <Footer />
  </div>
);
}