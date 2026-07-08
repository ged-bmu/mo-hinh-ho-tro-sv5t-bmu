"use client";

import { supabase } from "../../lib/supabase";
import Footer from "../components/Footer";
import { useEffect, useState } from "react";

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
  src="/Tenhethong.png"
  style={{
    width: "min(360px, 82vw)",
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