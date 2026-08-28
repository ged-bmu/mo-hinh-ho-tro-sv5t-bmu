"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [hoTen, setHoTen] = useState("");
  const [mssv, setMssv] = useState("");
  const [lop, setLop] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

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

    window.location.href = "/introduce";
  } catch (err) {
    console.error(err);
    alert("Có lỗi xảy ra");
  }
}
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background: "#f5f7fb",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          background: "white",
          padding: "30px",
          borderRadius: "16px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <a
          href="/login"
          style={{
            display: "inline-block",
            marginBottom: "20px",
            textDecoration: "none",
            color: "#2563eb",
            fontWeight: 600,
            fontSize: "16px",
          }}
        >
          ← Quay về đăng nhập
        </a>

        <h1
          style={{
            marginBottom: "25px",
            fontSize: "26px",
          }}
        >
          Tạo tài khoản
        </h1>

        <input
          placeholder="Họ tên"
          value={hoTen}
          onChange={(e) =>
            setHoTen(e.target.value)
          }
          style={inputStyle}
        />

        <input
          placeholder="Lớp"
          value={lop}
          onChange={(e) =>
            setLop(e.target.value)
          }
          style={inputStyle}
        />

        <input
          placeholder="MSSV"
          value={mssv}
          onChange={(e) =>
            setMssv(e.target.value)
          }
          style={inputStyle}
        />

        

        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Xác nhận mật khẩu"
          value={confirmPassword}
          onChange={(e) =>
            setConfirmPassword(e.target.value)
          }
          style={inputStyle}
        />

        <button
          onClick={handleRegister}
          style={{
            width: "100%",
            padding: "14px",
            border: "none",
            borderRadius: "12px",
            background: "#2563eb",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "15px",
          }}
        >
          Đăng ký
        </button>
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  borderRadius: "10px",
  border: "1px solid #dbe2ea",
  boxSizing: "border-box" as const,
};