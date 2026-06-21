"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminPage() {
  const [profile, setProfile] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([])
  const [search, setSearch] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const totalStudents = students.length;
  const menuStyle = {
  display: "block",
  padding: "12px 16px",
  borderRadius: "10px",
  textDecoration: "none",
  color: "#1e293b",
  marginBottom: "10px",
  background: "#f8fafc",
  fontWeight: 500,
};

const filteredStudents = students.filter((sv) => {
  const keyword = search.toLowerCase();

  return (
    sv.ho_ten?.toLowerCase().includes(keyword) ||
    sv.mssv?.toLowerCase().includes(keyword)
  );
});

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!data || data.role !== "admin") {
      alert("Bạn không có quyền truy cập");
      window.location.href = "/";
      return;
    }

    setProfile(data);
    const { data: studentsData } = await supabase
  .from("profiles")
  .select("*")
  .eq("role", "student")
  .order("lop", { ascending: true })
  .order("mssv", { ascending: true });

if (studentsData) {
  setStudents(studentsData);
}
  }
async function updateCriteria(
  id: string,
  field: string,
  value: boolean
) {
  await supabase
    .from("profiles")
    .update({
      [field]: value,
    })
    .eq("id", id);

  setStudents((prev) =>
    prev.map((sv) =>
      sv.id === id
        ? {
            ...sv,
            [field]: value,
          }
        : sv
    )
  );
}

 return (
  <>
    <button
      onMouseEnter={() =>
        setShowSidebar(true)
      }
      style={{
        position: "fixed",
        top: "20px",
        left: "20px",
        width: "50px",
        height: "50px",
        border: "none",
        borderRadius: "12px",
        background: "#ffffff",
        boxShadow:
          "0 2px 10px rgba(0,0,0,0.1)",
        cursor: "pointer",
        fontSize: "24px",
        zIndex: 999,
      }}
    >
      ☰
    </button>

    {showSidebar && (
      <div
        onMouseLeave={() =>
          setShowSidebar(false)
        }
        style={{
  position: "fixed",
  top: 0,
  left: 0,
  width: "260px",
  height: "100vh",
  background: "#ffffff",
  boxShadow:
    "4px 0 20px rgba(0,0,0,0.1)",
  padding: "20px",
  zIndex: 998,

  display: "flex",
  flexDirection: "column",
}}
      >
        <h2
          style={{
            marginTop: "70px",
            marginBottom: "30px",
          }}
        >
          🛠 Menu
        </h2>

        <a
           href="/admin"
  style={{
    display: "block",
    padding: "12px 16px",
    borderRadius: "10px",
    textDecoration: "none",
    color: "white",
    marginBottom: "10px",
    background: "#5686ed",
    fontWeight: 600,
  }}
        >
          📋 Danh sách sinh viên
        </a>

      <a
  href="/admin/users"
  style={menuStyle}
>
  👥 Quản lý tài khoản
</a>

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href =
              "/login";
          }}
          style={{
            marginTop: "auto",
            width: "100%",
            padding: "12px",
            border: "none",
            borderRadius: "10px",
            background: "#ef4444",
            color: "white",
            cursor: "pointer",
          }}
        >
          Đăng xuất
        </button>
      </div>
    )}

  <div
    style={{
      padding: "60px",
      maxWidth: "1700px",
      margin: "0 auto",
    }}
  >
    <div
  style={{
    textAlign: "center",
    marginTop: "-40px",
    marginBottom: "20px",
  }}
>
  <h1
    style={{
      marginBottom: "5px",
      color: "#0f172a",
    }}
  >
    <b>CÂU LẠC BỘ SINH VIÊN 5 TỐT</b>
  </h1>

  <h2
    style={{
      fontSize: "18px",
      fontWeight: 500,
      color: "#475569",
    }}
  >
    <b>TRƯỜNG ĐẠI HỌC Y DƯỢC BUÔN MA THUỘT</b>
  </h2>

  <p
    style={{
      marginTop: "15px",
      color: "#2563eb",
      fontWeight: 600,
    }}
  >
    Xin chào Ban Chủ nhiệm 👋
  </p>
</div>

<div
  style={{
    display: "grid",
    gridTemplateColumns:
      "repeat(4,1fr)",
    gap: "20px",
    marginTop: "-20px",
    marginBottom: "30px",
  }}
>
    <input
  placeholder="🔍 Tìm MSSV hoặc họ tên..."
  value={search}
  onChange={(e) =>
    setSearch(e.target.value)
  }
  style={{
    width: "100%",
    padding: "14px",
    marginBottom: "20px",
    borderRadius: "12px",
    border:
      "1px solid #dbe2ea",
  }}
/>
</div>
   <p
  style={{
    textAlign: "center",
    fontSize: "20px",
    fontWeight: "bold",
    marginTop: "-20px",
    color: "#334155",
  }}
>
    Mô Hình hỗ trợ sinh viên phấn đấu đạt danh hiệu Sinh viên 5 tốt các cấp
  </p>

    <hr
      style={{
        margin: "20px 0",
      }}
    />

    <h2>📋 Danh sách sinh viên</h2>

    <div
  style={{
    background: "white",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  }}
>
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
        <th style={{ padding: "14px" }}>STT</th>

<th style={{ padding: "20px" }}>
  Họ tên
</th>

<th style={{ padding: "20px" }}>
  Lớp
</th>

<th style={{ padding: "20px" }}>
  MSSV
</th>

<th style={{ padding: "20px" }}>
  Đạo đức tốt
</th>

<th style={{ padding: "20px" }}>
  Học tập tốt
</th>

<th style={{ padding: "20px" }}>
  Thể lực tốt
</th>

<th style={{ padding: "20px" }}>
  Tình nguyện tốt
</th>

<th style={{ padding: "20px" }}>
  Hội nhập tốt
</th>

<th style={{ padding: "20px" }}>
  Kết quả
</th>

<th style={{ padding: "20px" }}>
  Hồ sơ
</th>
      </tr>
    </thead>

    <tbody>
      {filteredStudents.map((sv, index) => (
        <tr
          key={sv.id}
          style={{
            borderTop:
              "1px solid #e2e8f0",
          }}
        >
       <td
  style={{
    padding: "14px",
    textAlign: "center",
  }}
>
  {index + 1}
</td>

<td style={{ padding: "14px" }}>
  {sv.ho_ten}
</td>

<td style={{ padding: "14px" }}>
  {sv.lop}
</td>

<td style={{ padding: "14px" }}>
  {sv.mssv}
</td>

<td
  style={{
    textAlign: "center",
  }}
>
  <input
  type="checkbox"
  checked={sv["dao-duc"] || false}
  onChange={(e) =>
    updateCriteria(
      sv.id,
      "dao-duc",
      e.target.checked
    )
  }
  style={{
  width: "16px",
  height: "16px",
  cursor: "pointer",
}}
/>
</td>

<td
  style={{
    textAlign: "center",
  }}
>
  <input
  type="checkbox"
  checked={sv["hoc-tap"] || false}
  onChange={(e) =>
    updateCriteria(
      sv.id,
      "hoc-tap",
      e.target.checked
    )
  }
  style={{
  width: "16px",
  height: "16px",
  cursor: "pointer",
}}
/>
</td>

<td
  style={{
    textAlign: "center",
  }}
>
  <input
  type="checkbox"
  checked={sv["the-luc"] || false}
  onChange={(e) =>
    updateCriteria(
      sv.id,
      "the-luc",
      e.target.checked
    )
  }
  style={{
  width: "16px",
  height: "16px",
  cursor: "pointer",
}}
/>
</td>

<td
  style={{
    textAlign: "center",
  }}
>
  <input
  type="checkbox"
  checked={sv["tinh-nguyen"] || false}
  onChange={(e) =>
    updateCriteria(
      sv.id,
      "tinh-nguyen",
      e.target.checked
    )
  }
  style={{
  width: "16px",
  height: "16px",
  cursor: "pointer",
}}
/>
</td>

<td
  style={{
    textAlign: "center",
  }}
>
 <input
  type="checkbox"
  checked={sv["hoi-nhap"] || false}
  onChange={(e) =>
    updateCriteria(
      sv.id,
      "hoi-nhap",
      e.target.checked
    )
  }
  style={{
  width: "16px",
  height: "16px",
  cursor: "pointer",
}}
/>
</td>

<td
  style={{
    textAlign: "center",
    fontWeight: "bold",
  }}
>
  {sv["dao-duc"] &&
   sv["hoc-tap"] &&
   sv["the-luc"] &&
   sv["tinh-nguyen"] &&
   sv["hoi-nhap"]
    ? "🟢"
    : sv.dao_duc &&
 sv.hoc_tap &&
 sv.the_luc &&
 sv.tinh_nguyen &&
 sv.hoi_nhap ? (
  <span
    style={{
      background:
        "#dcfce7",
      color:
        "#166534",
      padding:
        "6px 12px",
      borderRadius:
        "999px",
      fontWeight: 600,
    }}
  >
    Đủ điều kiện
  </span>
) : (
  <span
    style={{
      background:
        "#fee2e2",
      color:
        "#991b1b",
      padding:
        "6px 12px",
      borderRadius:
        "999px",
      fontWeight: 600,
    }}
  >
    Chưa đạt
  </span>
)}
</td>

<td
  style={{
    textAlign: "center",
  }}
>
  <a
    href={`/admin/students/${sv.id}`}
    style={{
      background: "#2563eb",
      color: "white",
      padding: "8px 14px",
      borderRadius: "8px",
      textDecoration: "none",
    }}
  >
    👁
  </a>
</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
  </div>
  
  </>
);
}
function DashboardCard({
  title,
  value,
  icon,
}: any) {

  return (
    <div
      style={{
        background: "white",
        padding: "25px",
        borderRadius: "16px",
        boxShadow:
          "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          fontSize: "18px",
        }}
      >
        {icon} {title}
      </div>

      <div
        style={{
          fontSize: "36px",
          fontWeight: 700,
          marginTop: "10px",
          color: "#2563eb",
        }}
      >
        {value}
      </div>
    </div>
  );
}