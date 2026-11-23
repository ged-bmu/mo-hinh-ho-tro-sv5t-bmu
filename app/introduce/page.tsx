"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Footer from "../components/Footer";
import { supabase } from "@/lib/supabase";
import InstallButton from "../components/InstallButton";
import { Eye, EyeOff } from "lucide-react";

export default function IntroducePage() {
 const [tab, setTab] = useState("home");
 const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  checkMobile();
  window.addEventListener("resize", checkMobile);


  return () => window.removeEventListener("resize", checkMobile);
}, []);
useEffect(() => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}, [tab]);
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 const [criteria, setCriteria] = useState<any[]>([]);
 const [header, setHeader] = useState<any>(null);
 const [mssv, setMssv] = useState("");
const [password, setPassword] = useState("");
const [rememberLogin, setRememberLogin] = useState(false);
const [showPassword, setShowPassword] = useState(false);

const [authMode, setAuthMode] = useState<"login" | "register">("login");

const [confirmPassword, setConfirmPassword] = useState("");
const [hoTen, setHoTen] = useState("");
const [lop, setLop] = useState("");
 const [level, setLevel] = useState<
  "school" | "province" | "central"
>("school");

useEffect(() => {
  loadCriteria();
}, [level]);

async function loadCriteria() {

  // lấy thông tin chung
  const { data: headerData } = await supabase
    .from("criteria_headers")
    .select("*")
    .eq("type", level)
    .single();

  setHeader(headerData);


  // lấy tiêu chí
  const { data, error } = await supabase
    .from("criteria_contents")
    .select("*")
    .eq("type", level)
    .order("id");


  if (error) {
    console.error(error);
    return;
  }

  setCriteria(data || []);
}
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

  const { error } = await supabase.auth.signInWithPassword({
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
    return;
  } else if (roleList.includes("bch_hsv") || role === "bch_hsv") {
    window.location.href = "/bch";
    return;
  } else if (roleList.includes("admin") || role === "admin") {
    window.location.href = "/admin";
    return;
  } else {
    window.location.href = "/";
    return;
  }
} 
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
{/* Header */}
<div
  className="intro-header"
  style={{
    display: "flex",
    justifyContent: isMobile ? "center" : "space-between",
    alignItems: "center",
    padding: isMobile ? "12px 35px" : "clamp(8px, 0.8vw, 12px) clamp(18px, 2.3vw, 35px)",
    background: "white",
    borderBottom: "1px solid #eee",
    position: "sticky",
    top: 0,
    zIndex: 100,
  }}
>
  {/* Logo + Tên */}
  <div
    style={{
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: "center",
      justifyContent: "center",
      gap: isMobile ? "8px" : "12px",
      flex: isMobile ? 1 : "unset",
    }}
  >
    <img
      className="intro-logo"
      src="/logo-header.png"
      alt="Logo"
      style={{
        height: isMobile ? "42px" : "clamp(40px, 3.3vw, 50px)",
        objectFit: "contain",
      }}
    />

   <img
  className="intro-title"
  src= {isMobile ? "/Tenhethong2.png" : "Tenhethong1.png"}
  alt="Tên hệ thống"
  style={{
    height: isMobile ? "50px" : "clamp(48px, 4vw, 60px)",
    objectFit: "contain",
    marginLeft: isMobile ?"0" : "5"
  }}
/>
  </div>

  {/* Nút menu mobile */}
  {isMobile && (
    <button
      className="hamburger-btn"
      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      style={{
        position: "absolute",
        right: "16px",
        top: "30%",
        transform: "translateY(-50%)",
        border: "none",
        background: "transparent",
        fontSize: "22px",
        cursor: "pointer",
      }}
    >
      ☰
    </button>
  )}

  {/* Menu desktop */}
  {!isMobile && (
    <div
      className="intro-header-buttons"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "clamp(4px, 0.5vw, 8px)",
      }}
    >
      {[
        { id: "home", label: "Trang chủ" },
        { id: "about", label: "Giới thiệu" },
        { id: "criteria", label: "Tiêu chuẩn" },
      ].map((item) => (
        <button
          key={item.id}
          onClick={() => setTab(item.id)}
             onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = "#2563eb";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = "transparent";
    }}
          style={{
            padding: "clamp(6px, 0.6vw, 9px) clamp(10px, 1.2vw, 18px)",
            fontSize: "clamp(12px, 1vw, 15px)",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: 600,
            transition: "0.2s",
            background: tab === item.id ? "#2563eb" : "#f3f4f6",
            color: tab === item.id ? "white" : "#111",
          }}
        >
          {item.label}
        </button>
      ))}

      <button
  type="button"
  className="cta-btn"
  onClick={() => setTab("login")}
  onMouseEnter={(e) => {
    e.currentTarget.style.borderColor = "#2563eb";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.borderColor = "transparent";
  }}
  style={{
    background: tab === "login" ? "#2563eb" : "#f8fafc",
    color: tab === "login" ? "white" : "black",
    padding: "clamp(6px, 0.6vw, 9px) clamp(10px, 1.2vw, 18px)",
    fontSize: "clamp(12px, 1vw, 15px)",
    borderRadius: "10px",
    fontWeight: 600,
    border: "2px solid transparent",
    transition: "all 0.2s ease",
    cursor: "pointer",
  }}
>
  Đăng nhập
</button>
    </div>
  )}
</div>
{mobileMenuOpen && (
  <div className="mobile-dropdown">

    <button
  onClick={() => { setTab("home"); setMobileMenuOpen(false); }}
  style={{
    background: tab === "home" ? "#2563eb" : "#f3f4f6",
    color: tab === "home" ? "white" : "#111",
    textAlign: "center"
  }}
>
  Trang chủ
</button>

    <button
  onClick={() => { setTab("about"); setMobileMenuOpen(false); }}
  style={{
    background: tab === "about" ? "#2563eb" : "#f3f4f6",
    color: tab === "about" ? "white" : "#111",
    textAlign: "center"
  }}
>
  Giới thiệu
</button>
    <button
  onClick={() => { setTab("criteria"); setMobileMenuOpen(false); }}
  style={{
    background: tab === "criteria" ? "#2563eb" : "#f3f4f6",
    color: tab === "criteria" ? "white" : "#111",
    textAlign: "center"
  }}
>
  Tiêu chí
</button>

    <button
  type="button"
  onClick={() => {
    setTab("login");
    setMobileMenuOpen(false);
  }}
  style={{
    background: tab === "login" ? "#2563eb" : "#f3f4f6",
    color: tab === "login" ? "white" : "#111",
    textAlign: "center",
    border: "none",
    cursor: "pointer",
    padding: "10px",
    borderRadius: "8px",
  }}
>
  Đăng nhập
</button>

  </div>
)}

      {/* Banner + nội dung */}
<main 
  className="intro-main" 
  style={{ 
    flex: isMobile ? "none" : 1, 
    position: "relative", 
    minHeight: isMobile ? "auto" : "calc(100vh - 75px)", 
    height: isMobile ? "auto" : undefined,
  }} 
>
  {/* Trang chủ */}
{(tab === "home" || tab === "login") && (
  <>
    {/* ================= DESKTOP ================= */}
    {!isMobile && (
      <div
        style={{
          width: "100%",
          minHeight: "calc(100vh - 75px)",
          background:
            "linear-gradient(to bottom right, #35c9e8 0%, #72ddf4 38%, #a5effa 70%, #d0fbff 100%)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* ================= NỬA TRÁI ================= */}
        <div
          style={{
            padding: "clamp(10px, 1.5vw, 20px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxSizing: "border-box",
            minWidth: 0,
          }}
        >
          {/* ẢNH TRANG CHỦ */}
          <img
            src="/trangchumobile.png"
            alt=""
            style={{
              width: "100%",
              maxWidth: "100%",
              height: "auto",
              display: "block",
              objectFit: "contain",
            }}
          />
          {/* ===== CARD ĐĂNG NHẬP / ĐĂNG KÝ ===== */}
{tab === "login" && (
  <div
    style={{
      width: "min(100%, 500px)",
      height: "clamp(340px, 48vh, 460px)",
      marginTop: "clamp(8px, 1.5vh, 16px)",
      background: "rgba(255,255,255,0.96)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      padding: "24px",
      borderRadius: "20px",
      border: "1px solid rgba(255,255,255,0.9)",
      boxShadow:
        "0 15px 40px rgba(0,100,180,0.18), 0 4px 12px rgba(0,0,0,0.08)",
      boxSizing: "border-box",
      overflowY: "auto",
      scrollbarWidth: "thin",
      scrollbarColor: "rgba(100,116,139,0.3) transparent",
    }}
  >
        {/* CỬA SỔ ĐĂNG NHẬP */}
      <div
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "15px",
    marginBottom: "12px",
  }}
>

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
        background:
          authMode === "login" ? "#fff" : "#f8fafc",
        color:
          authMode === "login" ? "#2563eb" : "#64748b",
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
        background:
          authMode === "register" ? "#fff" : "#f8fafc",
        color:
          authMode === "register" ? "#2563eb" : "#64748b",
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
  {/* ===== HỌ TÊN + LỚP ===== */}
  {authMode === "register" && (
    <>
      <label
        style={{
          display: "block",
          marginTop: "3px",
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
          color: "#000",
          background: "#fff",
        }}
      />

      <label
        style={{
          display: "block",
          marginTop: "3px",
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
          color: "#000",
          background: "#fff",
        }}
      />
    </>
  )}

  {/* ===== MSSV ===== */}
  <label
    style={{
      display: "block",
      marginTop: "3px",
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
      color: "#000",
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
        color: "#000",
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
      aria-label={
        showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
      }
    >
      {showPassword ? (
        <EyeOff size={19} />
      ) : (
        <Eye size={19} />
      )}
    </button>
  </div>

  {/* ===== XÁC NHẬN MẬT KHẨU ===== */}
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
        onChange={(e) =>
          setConfirmPassword(e.target.value)
        }
        style={{
          width: "100%",
          padding: "12px 14px",
          boxSizing: "border-box",
          border: "1px solid #d9dee7",
          borderRadius: "10px",
          outline: "none",
          fontSize: "15px",
          color: "#000",
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
    </div>
  )}

  {/* ===== NÚT ===== */}
  <button
    type="submit"
    style={{
      width: "100%",
      marginTop: "0px",
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
  <p
  style={{
    margin: "8px 12px",
    fontSize: "11px",
    color: "#dc2626",
    textAlign: "center",
    lineHeight: 1.5,
  }}
>
  Sinh viên liên hệ CLB Sinh viên 5 tốt BMU trong trường hợp quên mật khẩu.
</p>
</form>


  </div>
)}

          {/* ===== CARD GIỚI THIỆU ===== */}
          {tab !== "login" && (
          <div
  style={{
    width: "100%",
    background: "rgba(255,255,255,0.92)",
    borderRadius: "clamp(14px, 1.5vw, 24px)",
    padding: "clamp(6px, 1.2vh, 14px) clamp(10px, 1.2vw, 18px)",
    boxSizing: "border-box",
    boxShadow: "0 8px 25px rgba(0,0,0,0.10)",
    fontFamily: "'Noto Serif', serif",
    fontSize: "clamp(14px, 1.2vw, 19px)",
    textAlign: "justify",
    lineHeight: 1.5,
    marginTop: "clamp(8px, 1.5vh, 16px)",
  }}
>
            <b>
              Với mục tiêu{" "}
              <span style={{ color: "#2563eb", fontWeight: 600 }}>
                tăng cường ứng dụng công nghệ thông tin và thúc đẩy chuyển đổi số
              </span>{" "}
              trong công tác Hội và phong trào sinh viên,{" "}
              <span style={{ color: "#2563eb", fontWeight: 600 }}>
                Hệ thống hỗ trợ Sinh viên 5 tốt BMU
              </span>{" "}
              là mô hình Chuyển đổi số được ban hành theo{" "}
              <span style={{ color: "#2563eb", fontWeight: 600 }}>
                Kế hoạch số 03/KH-HSV ngày 27/8/2026 của Ban Chấp hành Hội
                Sinh viên Trường
              </span>{" "}
              nhằm hỗ trợ sinh viên theo dõi quá trình rèn luyện, hoàn thiện hồ
              sơ Sinh viên 5 tốt cấp Trường.
            </b>
          </div>
          )}
          {/* ===== 3 CARD ===== */}
          {tab !== "login" && (
<div
  style={{
    width: "100%",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "clamp(8px, 1vw, 16px)",
    marginTop: "clamp(10px, 2vh, 20px)",
  }}
>
  {/* CARD 1 */}
  <div
    style={{
      background: "rgba(255,255,255,0.96)",
      border: "1px solid rgba(255,255,255,0.8)",
      borderRadius: "20px",
      padding: "clamp(10px, 1vw, 15px)",
      minHeight: "clamp(110px, 14vh, 155px)",
      boxSizing: "border-box",
      boxShadow: "0 5px 18px rgba(30,100,160,0.10)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
    }}
  >
    <div
      style={{
        width: "clamp(36px, 3.2vw, 50px)",
        height: "clamp(36px, 3.2vw, 50px)",
        borderRadius: "14px",
        background: "linear-gradient(135deg, #dbeafe, #e0f2fe)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "8px",
        flexShrink: 0,
      }}
    >
      <img
        src="/icon-folder.png"
        alt=""
        style={{
          width: "75%",
          height: "75%",
          objectFit: "contain",
        }}
      />
    </div>

    <b
      style={{
        fontSize: "clamp(11px, 1vw, 15px)",
        color: "#1e3a8a",
        marginBottom: "5px",
      }}
    >
      Quản lý minh chứng
    </b>

    <p
      style={{
        margin: 0,
        fontSize: "clamp(10px, 0.85vw, 13px)",
        lineHeight: 1.5,
        color: "#475569",
      }}
    >
      Lưu trữ và quản lý
      <br />
      minh chứng theo từng tiêu chí
    </p>
  </div>

  {/* CARD 2 */}
  <div
    style={{
      background: "rgba(255,255,255,0.96)",
      border: "1px solid rgba(255,255,255,0.8)",
      borderRadius: "20px",
      padding: "clamp(10px, 1vw, 15px)",
      minHeight: "clamp(110px, 14vh, 155px)",
      boxSizing: "border-box",
      boxShadow: "0 5px 18px rgba(30,100,160,0.10)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
    }}
  >
    <div
      style={{
        width: "clamp(36px, 3.2vw, 50px)",
        height: "clamp(36px, 3.2vw, 50px)",
        borderRadius: "14px",
        background: "linear-gradient(135deg, #dbeafe, #e0f2fe)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "8px",
        flexShrink: 0,
      }}
    >
      <img
        src="/icon-progress.png"
        alt=""
        style={{
          width: "75%",
          height: "75%",
          objectFit: "contain",
        }}
      />
    </div>

    <b
      style={{
        fontSize: "clamp(11px, 1vw, 15px)",
        color: "#1e3a8a",
        marginBottom: "5px",
      }}
    >
      Theo dõi tiến độ
    </b>

    <p
      style={{
        margin: 0,
        fontSize: "clamp(10px, 0.85vw, 13px)",
        lineHeight: 1.5,
        color: "#475569",
      }}
    >
      Cập nhật và theo dõi
      <br />
      quá trình hoàn thiện hồ sơ
    </p>
  </div>

  {/* CARD 3 */}
  <div
    style={{
      background: "rgba(255,255,255,0.96)",
      border: "1px solid rgba(255,255,255,0.8)",
      borderRadius: "20px",
      padding: "clamp(10px, 1vw, 15px)",
      minHeight: "clamp(110px, 14vh, 155px)",
      boxSizing: "border-box",
      boxShadow: "0 5px 18px rgba(30,100,160,0.10)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
    }}
  >
    <div
      style={{
        width: "clamp(36px, 3.2vw, 50px)",
        height: "clamp(36px, 3.2vw, 50px)",
        borderRadius: "14px",
        background: "linear-gradient(135deg, #dbeafe, #e0f2fe)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "8px",
        flexShrink: 0,
      }}
    >
      <img
        src="/icon-export.png"
        alt=""
        style={{
          width: "75%",
          height: "75%",
          objectFit: "contain",
        }}
      />
    </div>

    <b
      style={{
        fontSize: "clamp(11px, 1vw, 15px)",
        color: "#1e3a8a",
        marginBottom: "5px",
      }}
    >
      Xuất hồ sơ
    </b>

    <p
      style={{
        margin: 0,
        fontSize: "clamp(10px, 0.85vw, 13px)",
        lineHeight: 1.5,
        color: "#475569",
      }}
    >
      Xuất hồ sơ
      <br />
      phục vụ công tác xét chọn
    </p>
  </div>
</div>
)}
          {/* ===== NÚT ĐĂNG NHẬP + CÀI ỨNG DỤNG ===== */}
          {tab !== "login" && (
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "clamp(10px, 1.5vw, 24px)",
              marginTop: "clamp(8px, 1.5vh, 16px)",
              flexWrap: "wrap",
            }}
          >
            {/* NÚT ĐĂNG NHẬP */}
            <button
              type="button"
              className="cta-btn"
              onClick={() => setTab("login")}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 20px rgba(37,99,235,.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#2563eb",
                color: "white",
                padding: "clamp(10px, 1vw, 15px) clamp(20px, 2.5vw, 38px)",
                borderRadius: "clamp(8px, 0.8vw, 12px)",
                fontWeight: 400,
                fontSize: "clamp(13px, 1.2vw, 18px)",
                transition: "all 0.25s ease",
                minWidth: "clamp(110px, 10vw, 150px)",
                textAlign: "center",
                border: "none",
                cursor: "pointer",
              }}
            >
              <b>Đăng nhập</b>
            </button>

            <InstallButton />
          </div>
          )}
        </div>
            


{/* ================= NỬA BÊN PHẢI ================= */}
<div
  style={{
    minWidth: 0,
    minHeight: "100%",
    padding: "clamp(15px, 2vw, 30px)",
    paddingTop: "clamp(10px, 2vh, 25px)",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-evenly",
    position: "relative",
    isolation: "isolate",
    overflow: "hidden",
  }}
>
  {/* HIỆU ỨNG QUẦNG SÁNG CÔNG NGHỆ */}
  <div
    style={{
      position: "absolute",
      inset: 0,
      zIndex: -1,
      pointerEvents: "none",
      background: `
        radial-gradient(ellipse at 50% 25%,
          rgba(255,255,255,0.42) 0%,
          rgba(125,230,255,0.18) 35%,
          transparent 70%)
      `,
    }}
  />
  

{/* ÁNH SÁNG NỀN */}
<div className="sv5t-ambient ambient-1" />
<div className="sv5t-ambient ambient-2" />
<div className="sv5t-ambient ambient-3" />

{/* VÒNG ÁNH SÁNG */}
<div className="sv5t-soft-orbit orbit-a" />
<div className="sv5t-soft-orbit orbit-b" />

{/* HẠT SÁNG */}
<div className="sv5t-particle particle-a" />
<div className="sv5t-particle particle-b" />
<div className="sv5t-particle particle-c" />
<div className="sv5t-particle particle-d" />
<div className="sv5t-particle particle-e" />

{/* ================= DIGITAL ENERGY NETWORK ================= */}
<svg
  viewBox="0 0 600 760"
  preserveAspectRatio="none"
  style={{
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    zIndex: 1,
    pointerEvents: "none",
    overflow: "hidden",
  }}
>
  <defs>
    <radialGradient id="energyCore">
      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
      <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.2" />
      <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
    </radialGradient>

    <linearGradient id="energyTrace" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stopColor="#0284c7" stopOpacity="0.2" />
      <stop offset="55%" stopColor="#0ea5e9" stopOpacity="0.7" />
      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
    </linearGradient>

    <filter id="energyGlow">
      <feGaussianBlur stdDeviation="3.5" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  {/* 1. QUẦNG SÁNG TẬP TRUNG SAU LOGO */}
  <ellipse
    cx="300"
    cy="245"
    rx="175"
    ry="185"
    fill="url(#energyCore)"
  />

  {/* 2. MẠCH CHÍNH BÊN TRÁI */}
  <g
    fill="none"
    stroke="url(#energyTrace)"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M 155 75 L 155 125 L 185 155 L 185 205" />
    <path d="M 105 180 L 135 180 L 165 210 L 165 245" />
    <path d="M 85 275 L 135 275 L 165 305 L 165 345" />
    <path d="M 125 395 L 155 365 L 185 365 L 205 345" />

    {/* Các nhánh phụ */}
    <path d="M 155 125 L 125 155 L 105 155" />
    <path d="M 185 205 L 215 235 L 235 235" />
    <path d="M 135 275 L 135 250 L 115 230" />
    <path d="M 165 305 L 195 305 L 215 285" />
    <path d="M 155 365 L 135 385 L 105 385" />
    <path d="M 205 345 L 225 325 L 225 305" />
  </g>

  {/* 3. MẠCH CHÍNH BÊN PHẢI */}
  <g
    fill="none"
    stroke="url(#energyTrace)"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M 445 75 L 445 125 L 415 155 L 415 205" />
    <path d="M 495 180 L 465 180 L 435 210 L 435 245" />
    <path d="M 515 275 L 465 275 L 435 305 L 435 345" />
    <path d="M 475 395 L 445 365 L 415 365 L 395 345" />

    {/* Các nhánh phụ */}
    <path d="M 445 125 L 475 155 L 495 155" />
    <path d="M 415 205 L 385 235 L 365 235" />
    <path d="M 465 275 L 465 250 L 485 230" />
    <path d="M 435 305 L 405 305 L 385 285" />
    <path d="M 445 365 L 465 385 L 495 385" />
    <path d="M 395 345 L 375 325 L 375 305" />
  </g>

  {/* 4. MẠCH NHỎ PHÂN BỐ QUANH CHỦ THỂ */}
  <g
    fill="none"
    stroke="#0ea5e9"
    strokeWidth="1.1"
    strokeLinecap="round"
    strokeLinejoin="round"
    opacity="0.65"
  >
    {/* Phía trên trái */}
    <path d="M 90 90 L 110 110 L 110 135 L 130 155" />
    <path d="M 185 55 L 185 85 L 205 105 L 205 130" />
    <path d="M 115 215 L 135 215 L 150 230" />

    {/* Phía trên phải */}
    <path d="M 510 90 L 490 110 L 490 135 L 470 155" />
    <path d="M 415 55 L 415 85 L 395 105 L 395 130" />
    <path d="M 485 215 L 465 215 L 450 230" />

    {/* Phía dưới trái */}
    <path d="M 85 440 L 115 440 L 135 420" />
    <path d="M 175 430 L 195 410 L 195 390" />
    <path d="M 235 455 L 235 425 L 250 410" />

    {/* Phía dưới phải */}
    <path d="M 515 440 L 485 440 L 465 420" />
    <path d="M 425 430 L 405 410 L 405 390" />
    <path d="M 365 455 L 365 425 L 350 410" />
  </g>

  {/* 5. CÁC CHẤM SÁNG DI CHUYỂN THEO ĐÚNG ĐƯỜNG MẠCH */}
  <g fill="#ffffff" filter="url(#energyGlow)">

    {/* MẠCH TRÁI - DI CHUYỂN TỪ TRONG RA NGOÀI */}

    <circle r="3">
      <animateMotion
        dur="3.2s"
        repeatCount="indefinite"
        path="M 185 205 L 185 155 L 155 125 L 155 75"
      />
    </circle>

    <circle r="2.5">
      <animateMotion
        dur="3.8s"
        begin="0.7s"
        repeatCount="indefinite"
        path="M 165 245 L 165 210 L 135 180 L 105 180"
      />
    </circle>

    <circle r="2.5">
      <animateMotion
        dur="4s"
        begin="1.2s"
        repeatCount="indefinite"
        path="M 165 345 L 165 305 L 135 275 L 85 275"
      />
    </circle>

    <circle r="2.5">
      <animateMotion
        dur="3.6s"
        begin="1.8s"
        repeatCount="indefinite"
        path="M 205 345 L 185 365 L 155 365 L 125 395"
      />
    </circle>

    {/* NHÁNH PHỤ BÊN TRÁI */}

    <circle r="2">
      <animateMotion
        dur="3.4s"
        begin="0.5s"
        repeatCount="indefinite"
        path="M 155 125 L 125 155 L 105 155"
      />
    </circle>

    <circle r="2">
      <animateMotion
        dur="3.2s"
        begin="1.4s"
        repeatCount="indefinite"
        path="M 185 205 L 215 235 L 235 235"
      />
    </circle>

    <circle r="2">
      <animateMotion
        dur="3.5s"
        begin="2s"
        repeatCount="indefinite"
        path="M 165 305 L 195 305 L 215 285"
      />
    </circle>

    {/* MẠCH PHẢI - DI CHUYỂN TỪ TRONG RA NGOÀI */}

    <circle r="3">
      <animateMotion
        dur="3.2s"
        begin="0.4s"
        repeatCount="indefinite"
        path="M 415 205 L 415 155 L 445 125 L 445 75"
      />
    </circle>

    <circle r="2.5">
      <animateMotion
        dur="3.8s"
        begin="1s"
        repeatCount="indefinite"
        path="M 435 245 L 435 210 L 465 180 L 495 180"
      />
    </circle>

    <circle r="2.5">
      <animateMotion
        dur="4s"
        begin="1.5s"
        repeatCount="indefinite"
        path="M 435 345 L 435 305 L 465 275 L 515 275"
      />
    </circle>

    <circle r="2.5">
      <animateMotion
        dur="3.6s"
        begin="2.1s"
        repeatCount="indefinite"
        path="M 395 345 L 415 365 L 445 365 L 475 395"
      />
    </circle>

    {/* NHÁNH PHỤ BÊN PHẢI */}

    <circle r="2">
      <animateMotion
        dur="3.4s"
        begin="0.8s"
        repeatCount="indefinite"
        path="M 445 125 L 475 155 L 495 155"
      />
    </circle>

    <circle r="2">
      <animateMotion
        dur="3.2s"
        begin="1.7s"
        repeatCount="indefinite"
        path="M 415 205 L 385 235 L 365 235"
      />
    </circle>

    <circle r="2">
      <animateMotion
        dur="3.5s"
        begin="2.3s"
        repeatCount="indefinite"
        path="M 435 305 L 405 305 L 385 285"
      />
    </circle>

    {/* CÁC MẠCH NHỎ PHÍA TRÊN */}

    <circle r="1.8">
      <animateMotion
        dur="3.5s"
        begin="0.3s"
        repeatCount="indefinite"
        path="M 90 90 L 110 110 L 110 135 L 130 155"
      />
    </circle>

    <circle r="1.8">
      <animateMotion
        dur="3.8s"
        begin="1.1s"
        repeatCount="indefinite"
        path="M 185 55 L 185 85 L 205 105 L 205 130"
      />
    </circle>

    <circle r="1.8">
      <animateMotion
        dur="3.5s"
        begin="0.6s"
        repeatCount="indefinite"
        path="M 510 90 L 490 110 L 490 135 L 470 155"
      />
    </circle>

    <circle r="1.8">
      <animateMotion
        dur="3.8s"
        begin="1.5s"
        repeatCount="indefinite"
        path="M 415 55 L 415 85 L 395 105 L 395 130"
      />
    </circle>

    {/* CÁC MẠCH NHỎ PHÍA DƯỚI */}

    <circle r="1.8">
      <animateMotion
        dur="3.6s"
        begin="1s"
        repeatCount="indefinite"
        path="M 85 440 L 115 440 L 135 420"
      />
    </circle>

    <circle r="1.8">
      <animateMotion
        dur="3.6s"
        begin="1.8s"
        repeatCount="indefinite"
        path="M 235 455 L 235 425 L 250 410"
      />
    </circle>

    <circle r="1.8">
      <animateMotion
        dur="3.6s"
        begin="1.3s"
        repeatCount="indefinite"
        path="M 515 440 L 485 440 L 465 420"
      />
    </circle>

    <circle r="1.8">
      <animateMotion
        dur="3.6s"
        begin="2s"
        repeatCount="indefinite"
        path="M 365 455 L 365 425 L 350 410"
      />
    </circle>
  </g>

  {/* 6. NÚT KẾT NỐI TRÊN CÁC MẠCH */}
  <g fill="#ffffff" filter="url(#energyGlow)">
    {/* Nút mạch trái */}
    <circle cx="155" cy="75" r="3" />
    <circle cx="155" cy="125" r="3" />
    <circle cx="185" cy="205" r="3" />
    <circle cx="105" cy="180" r="2.5" />
    <circle cx="165" cy="245" r="2.5" />
    <circle cx="85" cy="275" r="3" />
    <circle cx="165" cy="345" r="2.5" />
    <circle cx="125" cy="395" r="3" />
    <circle cx="205" cy="345" r="2.5" />

    {/* Nút mạch phải */}
    <circle cx="445" cy="75" r="3" />
    <circle cx="445" cy="125" r="3" />
    <circle cx="415" cy="205" r="3" />
    <circle cx="495" cy="180" r="2.5" />
    <circle cx="435" cy="245" r="2.5" />
    <circle cx="515" cy="275" r="3" />
    <circle cx="435" cy="345" r="2.5" />
    <circle cx="475" cy="395" r="3" />
    <circle cx="395" cy="345" r="2.5" />

    {/* Nút mạch phụ */}
    <circle cx="90" cy="90" r="2" />
    <circle cx="185" cy="55" r="2" />
    <circle cx="235" cy="235" r="2" />
    <circle cx="235" cy="455" r="2" />
    <circle cx="510" cy="90" r="2" />
    <circle cx="415" cy="55" r="2" />
    <circle cx="365" cy="235" r="2" />
    <circle cx="365" cy="455" r="2" />
  </g>

  {/* 7. VÒNG KẾT NỐI NHỎ */}
  <g
    fill="none"
    stroke="#ffffff"
    strokeWidth="1"
    opacity="0.55"
  >
    <circle cx="155" cy="75" r="6" />
    <circle cx="445" cy="75" r="6" />
    <circle cx="90" cy="90" r="4" />
    <circle cx="510" cy="90" r="4" />
  </g>

  {/* 8. HẠT SÁNG TRANG TRÍ */}
  <g fill="#ffffff" filter="url(#energyGlow)">
    <circle cx="120" cy="300" r="1.8" />
    <circle cx="200" cy="160" r="1.8" />
    <circle cx="145" cy="450" r="1.8" />
    <circle cx="250" cy="180" r="1.8" />

    <circle cx="480" cy="300" r="1.8" />
    <circle cx="400" cy="160" r="1.8" />
    <circle cx="455" cy="450" r="1.8" />
    <circle cx="350" cy="180" r="1.8" />
  </g>
</svg>
{/* PHIÊN BẢN HIỆN TẠI */}
<div
  style={{
    position: "absolute",
    top: "8px",
    right: "20px",
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 10px",
    border: "1px solid rgba(14,165,233,0.45)",
    background: "rgba(224,242,254,0.55)",
    borderRadius: "4px",
    backdropFilter: "blur(8px)",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "1px",
    color: "#075985",
  }}
>
  <span
    style={{
      width: "6px",
      height: "6px",
      borderRadius: "50%",
      background: "#0ea5e9",
      boxShadow: "0 0 7px #38bdf8",
    }}
  />
  Phiên bản 1.4.0
</div>
  {/* LOGO */}
  <div
    style={{
  position: "relative",
  zIndex: 2,
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}}
  >
    {/* Quầng sáng sau logo */}
    <div
      style={{
        position: "absolute",
        width: "65%",
        aspectRatio: "1",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.25)",
        filter: "blur(45px)",
        pointerEvents: "none",
      }}
    />

    <img
      src="/bonghoa5totintroduce.png"
      alt=""
      style={{
        position: "relative",
        width: "clamp(120px, min(38vw, 42vh), 420px)",
        maxWidth: "100%",
        height: "auto",
        objectFit: "contain",
        display: "block",
        filter: "drop-shadow(0 12px 18px rgba(0,100,160,0.17))",
      }}
    />
  </div>


{/* NỘI DUNG BÊN DƯỚI - DIGITAL HUD */}
<div
  style={{
    width: "100%",
    maxWidth: "560px",
    textAlign: "center",
    marginTop: "clamp(5px, 2vh, 24px)",
    position: "relative",
    zIndex: 2,
  }}
>
  {/* TIÊU ĐỀ */}
  <div
    style={{
      fontSize: "clamp(20px, min(2.2vw, 3.2vh), 36px)",
      fontWeight: 900,
      color: "#075985",
      letterSpacing: "1.5px",
      textShadow: "0 0 14px rgba(56,189,248,0.3)",
    }}
  >
    PHONG TRÀO SINH VIÊN 5 TỐT
  </div>

  {/* DÒNG PHỤ */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      marginTop: "8px",
      color: "#0c4a6e",
      fontSize: "clamp(14px, 1.2vw, 19px)",
      fontWeight: 600,
      letterSpacing: "0.5px",
    }}
  >
    <span
      style={{
        width: "24px",
        height: "1px",
        background: "linear-gradient(90deg, transparent, #0ea5e9)",
      }}
    />
    Hành trình hơn cả một danh hiệu
    <span
      style={{
        width: "24px",
        height: "1px",
        background: "linear-gradient(90deg, #0ea5e9, transparent)",
      }}
    />
  </div>

  {/* ĐƯỜNG MẠCH PHÂN CÁCH */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      margin: "17px auto 13px",
      width: "72%",
    }}
  >
    <div
      style={{
        flex: 1,
        height: "1px",
        background: "linear-gradient(90deg, transparent, #38bdf8)",
      }}
    />
    <div
      style={{
        width: "6px",
        height: "6px",
        border: "1px solid #0284c7",
        transform: "rotate(45deg)",
        boxShadow: "0 0 8px rgba(14,165,233,0.6)",
      }}
    />
    <div
      style={{
        flex: 1,
        height: "1px",
        background: "linear-gradient(90deg, #38bdf8, transparent)",
      }}
    />
  </div>

  {/* 5 TIÊU CHÍ - DIGITAL INTERFACE */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
      gap: "8px",
    }}
  >
    {[
      { number: "01", name: "Đạo đức" },
      { number: "02", name: "Học tập" },
      { number: "03", name: "Thể lực" },
      { number: "04", name: "Tình nguyện" },
      { number: "05", name: "Hội nhập" },
    ].map((item) => (
      <div
        key={item.number}
        style={{
          position: "relative",
          minWidth: 0,
          padding: "11px 3px 12px",
          background:
            "linear-gradient(145deg, rgba(224,242,254,0.78), rgba(255,255,255,0.42))",
          border: "1px solid rgba(14,165,233,0.45)",
          borderRadius: "5px",
          boxShadow:
            "inset 0 0 12px rgba(56,189,248,0.10), 0 3px 12px rgba(14,116,144,0.08)",
          backdropFilter: "blur(8px)",
          overflow: "hidden",
        }}
      >
        {/* GÓC CÔNG NGHỆ */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "13px",
            height: "2px",
            background: "#0284c7",
            boxShadow: "0 0 7px #38bdf8",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "13px",
            height: "2px",
            background: "#0284c7",
          }}
        />

        {/* MÃ SỐ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            marginBottom: "7px",
          }}
        >
          <div
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: "#0ea5e9",
              boxShadow: "0 0 7px #38bdf8",
            }}
          />
          <div
            style={{
              fontSize: "13px",
              fontWeight: 900,
              color: "#0284c7",
              letterSpacing: "1.5px",
            }}
          >
            {item.number}
          </div>
        </div>

        {/* TÊN TIÊU CHÍ */}
        <div
          style={{
            fontSize: "clamp(10px, 0.9vw, 13px)",
            fontWeight: 800,
            color: "#075985",
            lineHeight: 1.4,
            overflowWrap: "anywhere",
          }}
        >
          {item.name}
        </div>

        {/* VẠCH TÍN HIỆU */}
        <div
          style={{
            width: "55%",
            height: "2px",
            margin: "9px auto 0",
            background: "linear-gradient(90deg, transparent, #0ea5e9, transparent)",
          }}
        />

        {/* GÓC DƯỚI */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "9px",
            height: "9px",
            borderTop: "1px solid rgba(14,165,233,0.65)",
            transform: "translate(4px, 4px) rotate(45deg)",
          }}
        />
      </div>
    ))}
  </div>

  {/* CHỈ BÁO HỆ THỐNG */}
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "7px",
      marginTop: "12px",
      fontSize: "9px",
      fontWeight: 800,
      letterSpacing: "2px",
      color: "#0c75a5",
      opacity: 0.75,
    }}
  >
  </div>
</div>
</div>
      </div>
    )}

    {/* ================= MOBILE: GIỮ NGUYÊN ================= */}
    {isMobile && (
      <>
        <div
          style={{
            width: "100%",
            minHeight: "auto",
            backgroundImage:
              "url('/trangchumobile.png'), radial-gradient(circle at 0% 0%, #33d1f4 0%, #e5fdff 100%)",
            backgroundSize: "100% auto",
            backgroundPosition: "top center",
            backgroundRepeat: "no-repeat",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingBottom: "30px",
            boxSizing: "border-box",
          }}
        >
          <img
            src="/trangchumobile.png"
            alt=""
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              objectFit: "contain",
              flexShrink: 0,
            }}
          />

        </div>
      </>
    )}
  </>
)}
{tab === "about" && (
  <div
    style={{
      background:
        "linear-gradient(90deg, #32c8e8 0%, #62d8eb 40%, #a8eaf2 70%, #e4f9fb 100%)",
      minHeight: "100%",
      padding: isMobile ? "20px 12px" : "35px 5%",
      boxSizing: "border-box",
    }}
  >
{/* PHIÊN BẢN HIỆN TẠI */}
<div
  style={{
    position: "absolute",
    top: "8px",
    right: "20px",
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 10px",
    border: "1px solid rgba(14,165,233,0.45)",
    background: "rgba(224,242,254,0.55)",
    borderRadius: "4px",
    backdropFilter: "blur(8px)",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "1px",
    color: "#075985",
  }}
>
  <span
    style={{
      width: "6px",
      height: "6px",
      borderRadius: "50%",
      background: "#0ea5e9",
      boxShadow: "0 0 7px #38bdf8",
    }}
  />
  Phiên bản 1.4.0
</div>
    {/* ===== CARD LỚN CHỨA TOÀN BỘ NỘI DUNG ===== */}
    <div
      style={{
        background: "#fff",
        borderRadius: isMobile ? "18px" : "28px",
        padding: isMobile ? "20px" : "35px 45px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
        width: "100%",
        maxWidth: "1200px",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >

      {/* ===== TIÊU ĐỀ ===== */}
      <h1
        style={{
          textAlign: "center",
          color: "#2563eb",
          margin: "0 0 25px",
          fontSize: isMobile ? "22px" : "30px",
        }}
      >
        <b>GIỚI THIỆU</b>
      </h1>

      {/* ===== ẢNH GIỚI THIỆU ===== */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "30px",
        }}
      >
        <img
          src="/gioithieu.avif"
          alt="Gioithieu"
          style={{
            width: "100%",
            maxWidth: "650px",
            height: "auto",
            display: "block",
            borderRadius: isMobile ? "12px" : "18px",
            boxShadow: "0 5px 18px rgba(0,0,0,0.08)",
          }}
        />
      </div>

      {/* ===== GIỚI THIỆU HỆ THỐNG ===== */}
      <section
        style={{
          marginBottom: "30px",
        }}
      >
      <section
  style={{
    marginBottom: "30px",
  }}
>
  <div
    style={{
      fontSize: isMobile ? "15px" : "18px",
      lineHeight: 1.8,
      textAlign: "justify",
    }}
  >
    <p>
      <b>Hệ thống hỗ trợ Sinh viên 5 tốt BMU</b> là nền tảng trực tuyến
      được phát triển bởi{" "}
      <b>
        Câu lạc bộ Sinh viên 5 tốt Trường Đại học Y Dược Buôn Ma Thuột
      </b>
      , thuộc{" "}
      <b>
        Mô hình hỗ trợ Sinh viên phấn đấu đạt danh hiệu Sinh viên 5 tốt
        các cấp
      </b>
    </p>

    <p>
      Hệ thống được xây dựng nhằm đồng hành cùng sinh viên trong quá trình phấn đấu,
      rèn luyện và hoàn thiện hồ sơ Sinh viên 5 tốt cấp Trường. Thông qua nền
      tảng, sinh viên có thể theo dõi các tiêu chí, quản lý minh chứng, cập nhật kết
      quả học tập, theo dõi tiến độ và nhận hướng dẫn từ Câu lạc bộ Sinh viên 5 tốt.
      Đồng thời, hệ thống hỗ trợ cán bộ quản lý tập trung hồ sơ, kiểm tra minh chứng
      và phản hồi kết quả xử lý.
    </p>

    <p>
      Với phương thức quản lý trực tuyến, hệ thống giúp quá trình chuẩn bị
      hồ sơ trở nên thuận tiện, khoa học và minh bạch hơn, góp phần hỗ trợ sinh viên
      chủ động trong hành trình chinh phục danh hiệu Sinh viên 5 tốt.
    </p>
  </div>
</section>
      </section>

      {/* ĐƯỜNG PHÂN CÁCH */}
      <div
        style={{
          height: "1px",
          background: "#e5e7eb",
          margin: "25px 0",
        }}
      />

      {/* ===== DANH HIỆU SINH VIÊN 5 TỐT ===== */}
      <section style={{ marginBottom: "30px" }}>
<div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: "100%",
    margin: "0 0 15px",
    background: "linear-gradient(90deg, #63d0ff, #38bdf8)",
    color: "#2c449b",
    padding: "12px 14px",
    borderRadius: "16px 16px 0 0",
    borderBottom: "1px solid #000000",
    fontSize: isMobile ? 16 : 18,
    fontWeight: 700,
    lineHeight: 1,
  }}
>
  <img
    src="/bonghoa5tot.png"
    alt="Danh hiệu Sinh viên 5 tốt"
    style={{
      width: 27,
      height: 27,
      objectFit: "contain",
      flexShrink: 0,
    }}
  />

  <span>Danh hiệu Sinh viên 5 tốt</span>
</div>

        <p
          style={{
            fontSize: isMobile ? "15px" : "18px",
            lineHeight: 1.8,
            textAlign: "justify",
            margin: 0,
          }}
        >
          Danh hiệu Sinh viên 5 tốt là danh hiệu cao quý của Hội Sinh viên
          Việt Nam, được trao tặng hằng năm cho những sinh viên có thành tích
          xuất sắc trong học tập, rèn luyện và tham gia Phong trào "Sinh viên
          5 tốt". Danh hiệu hướng tới xây dựng hình mẫu sinh viên Việt Nam
          phát triển toàn diện, có đạo đức, tri thức, sức khỏe, tinh thần
          tình nguyện và năng lực hội nhập, đáp ứng yêu cầu của thời kỳ mới.
        </p>

        <div
  style={{
    fontSize: "18px",
    lineHeight: 1.8,
    textAlign: "justify",
    margin: "18px 0 0",
  }}
>
  Để đạt được danh hiệu, sinh viên cần phấn đấu và đáp ứng đầy đủ các
  tiêu chuẩn ở 05 tiêu chí:

  <p><b>Đạo đức tốt:</b> Rèn luyện phẩm chất, đạo đức và lối sống tích cực.</p>
  <p><b>Học tập tốt:</b> Đạt kết quả học tập cao, có tinh thần học hỏi, nghiên cứu khoa học và sáng tạo.</p>
  <p><b>Thể lực tốt:</b> Có sức khỏe tốt, tích cực tham gia các hoạt động thể thao và rèn luyện thể chất.</p>
  <p><b>Tình nguyện tốt:</b> Tham gia tích cực các hoạt động tình nguyện, góp phần xây dựng cộng đồng.</p>
</div>
      </section>

      <div
        style={{
          height: "1px",
          background: "#e5e7eb",
          margin: "25px 0",
        }}
      />

      {/* ===== MỤC TIÊU ===== */}
      <section style={{ marginBottom: "30px" }}>
<div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: "100%",
    margin: "0 0 15px",
    background: "linear-gradient(90deg, #63d0ff, #38bdf8)",
    color: "#2c449b",
    padding: "12px 14px",
    borderRadius: "16px 16px 0 0",
    borderBottom: "1px solid #000000",
    fontSize: isMobile ? 16 : 18,
    fontWeight: 700,
    lineHeight: 1,
  }}
>
  <img
    src="/muctieuintroduce.png"
    alt="Mục tiêu"
    style={{
      width: 27,
      height: 27,
      objectFit: "contain",
      flexShrink: 0,
    }}
  />

  <span>Mục tiêu</span>
</div>

        <ul
          style={{
            fontSize: isMobile ? "15px" : "18px",
            lineHeight: 1.8,
            paddingLeft: "25px",
            margin: 0,
          }}
        >
          <li>
            Hỗ trợ sinh viên xây dựng lộ trình phấn đấu đạt danh hiệu Sinh
            viên 5 tốt.
          </li>
          <li>Quản lý và lưu trữ minh chứng theo từng tiêu chí.</li>
          <li> Theo dõi tiến độ học tập, rèn luyện và hoàn thiện hồ sơ.</li>
          <li>
            Hỗ trợ kiểm tra, phản hồi và quản lý hồ sơ tập trung.
          </li>
          <li>
           Đơn giản hóa quy trình chuẩn bị hồ sơ Sinh viên 5 tốt.
          </li>
        </ul>
      </section>

      <div
        style={{
          height: "1px",
          background: "#e5e7eb",
          margin: "25px 0",
        }}
      />

      {/* ===== ĐỐI VỚI SINH VIÊN ===== */}
     <div
  style={{
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    gap: isMobile ? 18 : 24,
    marginBottom: "30px",
  }}
>
  {/* ===== ĐỐI VỚI SINH VIÊN ===== */}
  <section
    style={{
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        background: "linear-gradient(90deg, #63d0ff, #38bdf8)",
        color: "#2c449b",
        padding: "7px 14px",
        borderBottom: "1px solid #000000",
        fontSize: isMobile ? 16 : 18,
        fontWeight: 700,
      }}
    >
      <span>👨‍🎓</span>
      <span>Đối với sinh viên</span>
    </div>

    <ul
      style={{
        fontSize: isMobile ? "15px" : "17px",
        lineHeight: 1.8,
        padding: "18px 25px 18px 42px",
        margin: 0,
        color: "#334155",
      }}
    >
      <li>Lưu trữ minh chứng trực tuyến, an toàn và lâu dài.</li>
      <li>Theo dõi tiến độ hoàn thành từng tiêu chí.</li>
      <li>Xuất hồ sơ nhanh chóng khi đăng ký xét danh hiệu.</li>
      <li>
        Nhận góp ý, yêu cầu bổ sung minh chứng từ Ban Chủ nhiệm.
      </li>
      <li>Theo dõi trạng thái xét duyệt theo thời gian thực.</li>
    </ul>
  </section>

  {/* ===== ĐỐI VỚI BAN CHỦ NHIỆM ===== */}
  <section
    style={{
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        background: "linear-gradient(90deg, #63d0ff, #38bdf8)",
        color: "#2c449b",
        padding: "7px 14px",
        borderBottom: "1px solid #000000",
        fontSize: isMobile ? 16 : 18,
        fontWeight: 700,
      }}
    >
      <span>👨‍💼</span>
      <span>Đối với Ban Chủ nhiệm</span>
    </div>

    <ul
      style={{
        fontSize: isMobile ? "15px" : "17px",
        lineHeight: 1.8,
        padding: "18px 25px 18px 42px",
        margin: 0,
        color: "#334155",
      }}
    >
      <li>Hồ sơ Sinh viên 5 tốt sinh viên tập trung.</li>
      <li>Kiểm tra và đánh giá minh chứng trực tuyến.</li>
      <li>Gửi nhận xét, yêu cầu chỉnh sửa.</li>
      <li>
        Theo dõi lịch sử thao tác và quá trình cập nhật hồ sơ.
      </li>
      <li>Thống kê dữ liệu phục vụ báo cáo và tổng kết.</li>
    </ul>
  </section>
</div>

    </div>
  </div>
)}

{tab === "criteria" && (
  <div
    style={{
      background:
        "linear-gradient(90deg, #32c8e8 0%, #62d8eb 40%, #a8eaf2 70%, #e4f9fb 100%)",
      minHeight: "100%",
      padding: isMobile ? "20px 12px" : "30px 5%",
      boxSizing: "border-box",
      color: "#000000",
    }}
  >
    {/* PHIÊN BẢN HIỆN TẠI */}
<div
  style={{
    position: "absolute",
    top: "8px",
    right: "20px",
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 10px",
    border: "1px solid rgba(14,165,233,0.45)",
    background: "rgba(224,242,254,0.55)",
    borderRadius: "4px",
    backdropFilter: "blur(8px)",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "1px",
    color: "#075985",
  }}
>
  <span
    style={{
      width: "6px",
      height: "6px",
      borderRadius: "50%",
      background: "#0ea5e9",
      boxShadow: "0 0 7px #38bdf8",
    }}
  />
  Phiên bản 1.4.0
</div>
    {/* CARD LỚN CHỨA TOÀN BỘ NỘI DUNG */}
    <div
      style={{
        background: "#fff",
        borderRadius: "20px",
        padding: isMobile ? "20px" : "30px 35px",
        boxShadow: "0 8px 25px rgba(0,0,0,0.10)",
        boxSizing: "border-box",
      }}
    >

      {/* ===== CHỌN CẤP ===== */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px",
          marginBottom: "25px",
          flexWrap: "wrap",
        }}
      >
        {[
          {
            key: "school",
            label: "Cấp Trường",
          },
          {
            key: "province",
            label: "Cấp Tỉnh",
          },
          {
            key: "central",
            label: "Cấp Trung ương",
          },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setLevel(item.key as any)}
            style={{
              padding: "10px 20px",
              borderRadius: "12px",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              background:
                level === item.key
                  ? "#2563eb"
                  : "#f1f5f9",
              color:
                level === item.key
                  ? "white"
                  : "#334155",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ===== THÔNG TIN TIÊU CHUẨN ===== */}
      {header && (
        <div
          style={{
            textAlign: "center",
            marginBottom: "25px",
          }}
        >
          <h1
            style={{
              color: "#2563eb",
              margin: "0 0 6px",
              fontSize: isMobile ? "20px" : "24px",
              fontWeight: 700,
              lineHeight: 1.5,
            }}
          >
            Tiêu chuẩn Sinh viên 5 tốt{" "}
            {level === "school"
              ? "Cấp Trường"
              : level === "province"
              ? "Cấp Tỉnh"
              : "Cấp Trung Ương"}

            {header.period && (
              <span
                style={{
                  fontWeight: 600,
                }}
              >
                {" "}
                {header.period}
              </span>
            )}
          </h1>

          {header.decision && (
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "14px",
                color: "#64748b",
                fontStyle: "italic",
              }}
            >
              {header.decision}{" "}
              {level === "school"
                ? "của Ban Chấp hành Hội Sinh viên Việt Nam Trường Đại học Y Dược Buôn Ma Thuột"
                : level === "province"
                ? "của Ban Chấp hành Hội Sinh viên Việt Nam Tỉnh Đắk Lắk"
                : "của Ban Chấp hành Trung ương Hội Sinh viên Việt Nam"}
            </p>
          )}

          {header.description && (
            <p
              style={{
                margin: "10px 0 0",
                fontSize: "15px",
                color: "#475569",
                lineHeight: 1.7,
              }}
            >
              {header.description}
            </p>
          )}
        </div>
      )}

      {/* ===== CÁC TIÊU CHÍ ===== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "20px",
        }}
      >
        {criteria.map((item: any) => (
          <div
            className="criteria-card"
            key={item.id}
            style={{
              background: "#f8fafc",
              borderRadius: "18px",
              padding: isMobile ? "20px" : "28px",
              boxShadow:
                "0 4px 12px rgba(0,0,0,.06)",
              border: "1px solid #eef2f7",
              boxSizing: "border-box",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                color: "#2563eb",
                fontSize: isMobile ? "21px" : "26px",
                marginBottom: "10px",
              }}
            >
              {item.title}
            </h2>

            <div
              className="criteria-content"
              style={{
                marginTop: "18px",
                whiteSpace: "pre-wrap",
                lineHeight: "1.8",
                minHeight: "250px",
                fontSize: isMobile ? "15px" : "17px",
                color: "#111827",
              }}
            >
              {item.content?.trim() || "Chưa cập nhật"}
            </div>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  background: item.content?.trim()
                    ? "#DCFCE7"
                    : "#FEF3C7",
                  color: item.content?.trim()
                    ? "#15803D"
                    : "#B45309",
                  padding: "6px 14px",
                  borderRadius: "999px",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                {item.content?.trim()
                  ? "Đã cập nhật"
                  : "Chưa cập nhật"}
              </span>

              <span
                style={{
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                {new Date(
                  item.updated_at
                ).toLocaleString("vi-VN")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}
    </main>

    <Footer />
  </div>
  );
}