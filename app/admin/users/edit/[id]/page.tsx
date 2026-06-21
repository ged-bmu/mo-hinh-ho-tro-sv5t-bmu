"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../../lib/supabase";
import { useParams } from "next/navigation";

export default function EditUser() {
  const params = useParams();
  const [hoTen, setHoTen] = useState("");
  const [mssv, setMssv] = useState("");
  const [lop, setLop] = useState("");

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", String(params.id))
      .single();

    if (data) {
      setHoTen(data.ho_ten || "");
      setMssv(data.mssv || "");
      setLop(data.lop || "");
    }
  }

  async function saveUser() {
    const { error } = await supabase
      .from("profiles")
      .update({
        ho_ten: hoTen,
        mssv: mssv,
        lop: lop,
      })
      .eq("id", String(params.id))

    if (error) {
  console.log(error);
  alert(error.message);
  return;
}
    alert("Đã cập nhật");

    window.location.href =
      "/admin/users";
  }

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "40px auto",
      }}
    >
      <a
        href="/admin/users"
        style={{
          textDecoration: "none",
          color: "#0f172a",
          fontWeight: "600",
        }}
      >
        ← Quay lại
      </a>

      <h1
        style={{
          marginTop: "20px",
        }}
      >
        ✏️ Chỉnh sửa tài khoản
      </h1>

      <div
        style={{
          background: "white",
          padding: "24px",
          borderRadius: "16px",
          marginTop: "20px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <input
          value={hoTen}
          onChange={(e) =>
            setHoTen(e.target.value)
          }
          placeholder="Họ tên"
          style={inputStyle}
        />

        <input
          value={mssv}
          onChange={(e) =>
            setMssv(e.target.value)
          }
          placeholder="MSSV"
          style={inputStyle}
        />

        <input
          value={lop}
          onChange={(e) =>
            setLop(e.target.value)
          }
          placeholder="Lớp"
          style={inputStyle}
        />

        <button
          onClick={saveUser}
          style={{
            width: "100%",
            padding: "12px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          💾 Lưu thay đổi
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "16px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
};