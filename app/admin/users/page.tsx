"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (data) setUsers(data);
  }

 return (

  <div
    style={{
      padding: "40px",
      maxWidth: "1800px",
      margin: "0 auto",
    }}
  >
<a
  href="/admin"
  style={{
    position: "fixed",
    top: "20px",
    left: "20px",
    padding: "12px 18px",
    background: "#ffffff",
    color: "#0f172a",
    textDecoration: "none",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    fontWeight: "600",
    zIndex: 999,
  }}
>
  ← Trang chủ
</a>
    <div
      style={{
        textAlign: "center",
        marginBottom: "30px",
      }}
    >
      <h1
        style={{
          color: "#0f172a",
          marginBottom: "8px",
          fontSize: "24px"
        }}
      >
        👥 Quản lý tài khoản
      </h1>
  <a
  href="/admin/create-user"
  style={{
  display: "inline-block",
  padding: "12px 16px",
  borderRadius: "10px",
  textDecoration: "none",
  color: "#1e293b",
  background: "#ffeb9b",
  fontWeight: 500,
}}
>
  ➕ Tạo tài khoản
</a>
  <p
    style={{
      color: "#64748b",
      fontSize: "16px",
    }}
  >
    Danh sách tài khoản trong hệ thống
  </p>
</div>

<div
  style={{
    background: "#fff",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  }}
>
  <div
  style={{
    padding: "20px",
    background: "#fff",
    borderBottom: "1px solid #e2e8f0",
  }}
>
  <input
    type="text"
    placeholder="🔍 Tìm theo họ tên hoặc MSSV..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    style={{
      width: "100%",
      padding: "12px 16px",
      borderRadius: "10px",
      border: "1px solid #cbd5e1",
      fontSize: "15px",
    }}
  />
</div>
  <table
    style={{
      width: "100%",
      borderCollapse: "collapse",
    }}
  >
    <thead>
      <tr
        style={{
          background: "#f1f5f9",
        }}
      >
        <th style={{ padding: "18px", width: "80px" }}>
          STT
        </th>

        <th
          style={{
            padding: "18px",
            width: "380px",
            textAlign: "left",
          }}
        >
          UID
        </th>

        <th
  style={{
    width: "250px",
  }}
>
  Họ tên
</th>

        <th
          style={{
            padding: "18px",
            width: "160px",
          }}
        >
          MSSV
        </th>

        <th
          style={{
            padding: "18px",
            width: "180px",
          }}
        >
          Vai trò
        </th>
      <th
  style={{
    width: "180px",
    textAlign: "center",
  }}
>
  Thao tác
</th>

      </tr>
    </thead>

    <tbody>
      {users
  .filter((user) =>
    user.ho_ten
      ?.toLowerCase()
      .includes(search.toLowerCase()) ||
    user.mssv
      ?.toLowerCase()
      .includes(search.toLowerCase())
  )
  .map((user, index) => (
        <tr
          key={user.id}
          style={{
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <td
            style={{
              padding: "18px",
              textAlign: "center",
              fontWeight: "600",
            }}
          >
            {index + 1}
          </td>

          <td
            style={{
              padding: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <span
                style={{
                  fontSize: "16px",
                  color: "#334155",
                  fontWeight: "500",
                  wordBreak: "break-all",
                }}
              >
                {user.id}
              </span>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    user.id
                  );
                  alert("Đã copy UID");
                }}
                style={{
                  padding: "6px 10px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#ededed",
                  color: "black",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                📋 Copy
              </button>
            </div>
          </td>

         <td
  style={{
    padding: "14px",
    whiteSpace: "nowrap",
  }}
>
  {user.ho_ten}
</td>

          <td
            style={{
              padding: "18px",
              textAlign: "center",
            }}
          >
            {user.mssv}
          </td>

          <td
            style={{
              padding: "18px",
              textAlign: "center",
            }}
          >
            <span
              style={{
                background:
                  user.role === "admin"
                    ? "#dbeafe"
                    : "#dcfce7",

                color:
                  user.role === "admin"
                    ? "#1d4ed8"
                    : "#166534",

                padding: "8px 16px",
                borderRadius: "999px",
                fontWeight: "600",
              }}
            >
              {user.role}
            </span>
          </td>
          <td
  style={{
    padding: "18px",
    textAlign: "center",
    whiteSpace: "nowrap",
  }}
>
  <button
    onClick={async () => {
  const ok = confirm(
    `Bạn có chắc chắn muốn đổi mật khẩu của ${user.ho_ten}?`
  );

  if (!ok) return;

  const password = prompt(
    "Nhập mật khẩu mới:"
  );

  if (!password) return;

  const confirmPassword = prompt(
    "Nhập lại mật khẩu:"
  );

  if (!confirmPassword) return;

  if (password !== confirmPassword) {
    alert(
      "Mật khẩu xác nhận không khớp!"
    );
    return;
  }

const res = await fetch(
  "/api/reset-password",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: user.id,
      password,
    }),
  }
);

console.log("status:", res.status);

const data = await res.json();

console.log("response:", data);

if (!res.ok) {
  alert(data.error);
  return;
}

alert(
  `Đã đổi mật khẩu cho ${user.ho_ten}`
); 
}}
    style={{
      marginRight: "8px",
      padding: "6px 10px",
      border: "none",
      borderRadius: "8px",
      background: "#ffeb9b",
      cursor: "pointer",
      fontWeight: "600",
    }}
  >
    🔑 Reset
  </button>
  <button
onClick={async () => {
  const ok = confirm(
    `Bạn có chắc chắn muốn xóa tài khoản của ${user.ho_ten}?`
  );

  if (!ok) return;

  const res = await fetch(
    "/api/delete-user",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        uid: user.id,
      }),
    }
  );

  const result =
    await res.json();

  if (!res.ok) {
    alert(
      result.error ||
        "Xóa thất bại"
    );
    return;
  }

  alert(
    `Đã xóa tài khoản ${user.ho_ten}`
  );

  loadUsers();
}}
    style={{
      padding: "6px 10px",
      border: "none",
      borderRadius: "8px",
      background: "#ef4444",
      color: "white",
      cursor: "pointer",
      fontWeight: "600",
    }}
  >
    🗑 Xóa
  </button>
  <div
  style={{
    marginTop: "8px",
  }}
>
  <button
    onClick={() => {
  window.location.href =
    `/admin/users/edit/${user.id}`;
    }}
    style={{
      width: "100%",
      padding: "7px",
      border: "none",
      borderRadius: "8px",
      background: "#20f76f",
      color: "white",
      cursor: "pointer",
      fontWeight: "600",
    }}
  >
    ✏️ Chỉnh sửa
  </button>
</div>
</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

  </div>
);
}