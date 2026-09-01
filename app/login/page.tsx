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
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hoTen, setHoTen] = useState("");
  const [lop, setLop] = useState("");
  async function handleRegister() {
  if (
    !mssv ||
    !hoTen ||
    !lop ||
    !password ||
    !confirmPassword
  ) {
    alert("Vui lòng nhập đầy đủ thông tin");
    return;
  }

  if (password !== confirmPassword) {
    alert("Mật khẩu xác nhận không khớp");
    return;
  }

  const email = `${mssv}@clbsv5tbmu.com`;

  try {
    const res = await fetch("/api/create-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        hoTen,
        mssv,
        lop,
        email,
        password,
        role: "student",
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error);
      return;
    }

    alert("Đăng ký thành công!");

    setAuthMode("login");
    setHoTen("");
    setLop("");
    setMssv("");
    setPassword("");
    setConfirmPassword("");
  } catch (err) {
    console.error(err);
    alert("Có lỗi xảy ra");
  }
}
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
    .select("role, roles")
    .eq("id", user.id)
    .maybeSingle();

  const roleList = Array.isArray(profile?.roles) ? profile.roles : [];
  const role = profile?.role || roleList[0] || "student";

  if (roleList.includes("chu_tich_hsv") || role === "chu_tich_hsv") {
    window.location.href = "/chutichhsv";
  } else if (roleList.includes("bch_hsv") || role === "bch_hsv") {
    window.location.href = "/bch";
  } else if (roleList.includes("admin") || role === "admin") {
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
    width: "calc(100% + 30px)",
    marginLeft: "0px",
    marginTop: "0",
    marginBottom: "20px",
    borderBottom: "1px solid #e5e7eb",
    boxSizing: "border-box",
  }}
>
  <button
    type="button"
    onClick={() => setAuthMode("login")}
    style={{
      flex: 1,
      minWidth: 0,
      border: "none",
      borderBottom:
        authMode === "login"
          ? "2px solid #2563eb"
          : "2px solid transparent",
      background: authMode === "login" ? "#fff" : "#f8fafc",
      color: authMode === "login" ? "#2563eb" : "#64748b",
      padding: "12px 10px",
      fontSize: "16px",
      fontWeight: 700,
      cursor: "pointer",
      boxSizing: "border-box",
    }}
  >
    ĐĂNG NHẬP
  </button>

  <button
    type="button"
    onClick={() => setAuthMode("register")}
    style={{
      flex: 1,
      minWidth: 0,
      border: "none",
      borderLeft: "1px solid #e5e7eb",
      borderBottom:
        authMode === "register"
          ? "2px solid #2563eb"
          : "2px solid transparent",
      background: authMode === "register" ? "#fff" : "#f8fafc",
      color: authMode === "register" ? "#2563eb" : "#64748b",
      padding: "12px 10px",
      fontSize: "16px",
      fontWeight: 700,
      cursor: "pointer",
      boxSizing: "border-box",
    }}
  >
    ĐĂNG KÝ
  </button>
</div>
        </div>
<form
  onSubmit={(e) => {
    e.preventDefault();

    if (authMode === "login") {
      handleLogin();
    } else {
      handleRegister();
    }
  }}
>
  {/* ===== HỌ TÊN ===== */}
  {authMode === "register" && (
    <>
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
        Họ tên
      </label>

      <input
        placeholder="Nhập họ và tên"
        value={hoTen}
        onChange={(e) => setHoTen(e.target.value)}
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
        Lớp
      </label>

      <input
        placeholder="Nhập lớp"
        value={lop}
        onChange={(e) => setLop(e.target.value)}
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
    </>
  )}

  {/* ===== MSSV ===== */}
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

  {/* ===== MẬT KHẨU ===== */}
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

  {/* ===== XÁC NHẬN MẬT KHẨU - CHỈ ĐĂNG KÝ ===== */}
  {authMode === "register" && (
    <>
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
        Xác nhận mật khẩu
      </label>

      <input
        type="password"
        placeholder="Nhập lại mật khẩu"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
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
    </>
  )}

  {/* ===== LƯU ĐĂNG NHẬP ===== */}
  {authMode === "login" && (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        marginTop: "6px",
        marginLeft: "3px",
        height: "28px",
      }}
    >
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
    </div>
  )}

  {/* ===== NÚT ===== */}
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
      fontWeight: 600,
      fontSize: "15px",
    }}
  >
    {authMode === "login" ? "Đăng nhập" : "Đăng ký"}
  </button>
</form>
</div>
    </main>
    <Footer />
  </div>
);
}