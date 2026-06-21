"use client";

import { useState } from "react";

export default function CreateUserPage() {
  const [hoTen, setHoTen] = useState("");
  const [mssv, setMssv] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [confirmPassword, setConfirmPassword] =
  useState("");
const [lop, setLop] = useState("");
  async function createUser() {
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
          role,
        }),
      });
  if (password !== confirmPassword) {
  alert(
    "Mật khẩu xác nhận không khớp"
  );
  return;
}
      const result = await res.json();

      if (!res.ok) {
        alert(result.error);
        return;
      }

      alert("✅ Tạo tài khoản thành công");

      setHoTen("");
      setMssv("");
      setEmail("");
      setPassword("");
      setRole("student");
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra");
    }
  }

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "40px auto",
        background: "white",
        padding: "30px",
        borderRadius: "16px",
        boxShadow:
          "0 2px 10px rgba(0,0,0,0.08)",
      }}
    >
        <a
  href="/admin"
  style={{
    display: "inline-block",
    marginBottom: "20px",
    textDecoration: "none",
    color: "#d7d7d7",
    fontWeight: 600,
    fontSize: "16px",
  }}
>
  ← Quay về trang chính
</a>
      <h1
        style={{
          marginBottom: "25px",
        }}
      >
        ➕ Tạo tài khoản mới
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
        placeholder="Email"
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
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
    setConfirmPassword(
      e.target.value
    )
  }
  style={inputStyle}
/>
      <select
        value={role}
        onChange={(e) =>
          setRole(e.target.value)
        }
        style={inputStyle}
      >
        <option value="student">
          Student
        </option>

        <option value="admin">
          Admin
        </option>
      </select>

      <button
        onClick={createUser}
        style={{
          width: "100%",
          padding: "14px",
          border: "none",
          borderRadius: "12px",
          background: "#2563eb",
          color: "white",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Tạo tài khoản
      </button>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  borderRadius: "10px",
  border: "1px solid #dbe2ea",
};