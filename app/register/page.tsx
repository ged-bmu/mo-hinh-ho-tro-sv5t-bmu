"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function RegisterPage() {
  const [mssv, setMssv] = useState("");
  const [hoTen, setHoTen] = useState("");
  const [lop, setLop] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  async function handleRegister() {
    if (
      !mssv ||
      !hoTen ||
      !lop ||
      !password
    ) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (password !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp");
      return;
    }

    const email = `${mssv}@gmail.com`;

    const { data, error } =
      await supabase.auth.signUp({
        email,
        password,
      });

    if (error) {
      alert(error.message);
      return;
    }

    if (!data.user) {
      alert("Không tạo được tài khoản");
      return;
    }

    const { error: profileError } =
      await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          mssv,
          ho_ten: hoTen,
          lop,
        });

    if (profileError) {
      alert(profileError.message);
      return;
    }

    alert("Đăng ký thành công!");

    window.location.href = "/introduce";
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
          width: "450px",
          background: "white",
          padding: "30px",
          borderRadius: "16px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h1>📝 Đăng ký tài khoản</h1>

        <input
          placeholder="MSSV"
          value={mssv}
          onChange={(e) =>
            setMssv(e.target.value)
          }
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "15px",
          }}
        />

        <input
          placeholder="Họ và tên"
          value={hoTen}
          onChange={(e) =>
            setHoTen(e.target.value)
          }
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "10px",
          }}
        />

        <input
          placeholder="Lớp"
          value={lop}
          onChange={(e) =>
            setLop(e.target.value)
          }
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "10px",
          }}
        />

        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "10px",
          }}
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
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "10px",
          }}
        />

        <button
          onClick={handleRegister}
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
          Đăng ký
        </button>
      </div>
    </main>
  );
}