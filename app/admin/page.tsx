"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Image from "next/image";
import NotificationBell from "../components/NotificationBell";
import { usePathname } from "next/navigation";
import Footer from "../components/Footer";

export default function AdminPage() {
  const [profile, setProfile] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([])
  const [search, setSearch] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const totalStudents = students.length;
  const [showExportMenu, setShowExportMenu] =
  useState(false);
  const [filterResult, setFilterResult] =
  useState("all");
  const menuStyle = {
  display: "block",
  padding: "12px 12px",
  borderRadius: "10px",
  textDecoration: "none",
  color: "#1e293b",
  marginBottom: "10px",
  background: "#f8fafc",
  fontWeight: 500,
};
  const keyword =
  search.toLowerCase();
  const pathname = usePathname();

const filteredStudents =
  students.filter((sv) => {
    const matchSearch =
      sv.ho_ten
        ?.toLowerCase()
        .includes(keyword) ||
      sv.mssv
        ?.toLowerCase()
        .includes(keyword);

    const isPassed =
      sv["dao-duc"] &&
      sv["hoc-tap"] &&
      sv["the-luc"] &&
      sv["tinh-nguyen"] &&
      sv["hoi-nhap"];

    const matchFilter =
      filterResult === "all"
        ? true
        : filterResult === "passed"
        ? isPassed
        : !isPassed;

    return (
      matchSearch &&
      matchFilter
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
      window.location.href = "/introduce";
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

if (studentsData) {
 const sorted = [...studentsData].sort((a, b) => {
  const lopCompare = (a.lop || "").localeCompare(
    b.lop || "",
    undefined,
    { numeric: true }
  );

  if (lopCompare !== 0) {
    return lopCompare;
  }

  return (a.mssv || "").localeCompare(
    b.mssv || "",
    undefined,
    { numeric: true }
  );
});

  setStudents(sorted);
}
  }
async function updateCriteria(
  id: string,
  field: string,
  value: boolean
) 
{
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
const exportExcel = async () => {
  const workbook =
    new ExcelJS.Workbook();

  const worksheet =
    workbook.addWorksheet(
      "Danh sách SV5T"
    );

  worksheet.mergeCells(
    "A1:D1"
  );

  worksheet.getCell(
    "A1"
  ).value =
    "DANH SÁCH SINH VIÊN ĐẠT DANH HIỆU SINH VIÊN 5 TỐT CẤP TRƯỜNG";

  worksheet.getCell(
    "A1"
  ).font = {
    bold: true,
    size: 16,
  };

  worksheet.getCell(
    "A1"
  ).alignment = {
    horizontal: "center",
  };

  worksheet.addRow([]);

  worksheet.addRow([
    "STT",
    "Họ tên",
    "Lớp",
    "MSSV",
  ]);

  const headerRow =
    worksheet.getRow(3);

  headerRow.font = {
    bold: true,
  };

  headerRow.alignment = {
    horizontal: "center",
  };

  filteredStudents.forEach(
    (sv, index) => {
      worksheet.addRow([
        index + 1,
        sv.ho_ten,
        sv.lop,
        sv.mssv,
      ]);
    }
  );

  worksheet.columns = [
    {
      width: 10,
    },
    {
      width: 40,
    },
    {
      width: 20,
    },
    {
      width: 20,
    },
  ];

  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: {
          style: "thin",
        },
        left: {
          style: "thin",
        },
        bottom: {
          style: "thin",
        },
        right: {
          style: "thin",
        },
      };
    });
  });

  const buffer =
    await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer]),
    "DanhSachSV5T.xlsx"
  );
};
 return (
<div
  style={{
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  }}
>
  <div style={{ flex: 1 }}>
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
    <div
  style={{
    position: "fixed",
    top: "20px",
    right: "30px",
    width: "50px",
    height: "50px",
    borderRadius: "12px",
    background: "#ffffff",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    cursor: "pointer",
  }}
></div>
<NotificationBell />
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
<a
  href="/admin/statistics"
  style={menuStyle}
>
  📊 Thống kê
</a>
<a
  href="/admin/activity"
  style={menuStyle}
>
  🔔 Thông báo
</a>
<a
  href="/doi-mat-khau"
  style={menuStyle}
>
  🔐 Đổi mật khẩu
</a>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href =
              "/introduce";
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
    marginTop: "-60px",
    marginBottom: "20px",
  }}
>
  <div
  style={{
    marginBottom: "20px",
    paddingBottom: "15px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "center",
  }}
>
    <Image
      src="/logo-header.png"
      alt="Logo"
      width={220}
      height={80}
      style={{
        marginTop: "15px",
        width: "20%",
        height: "auto",
      }}
    />
  </div>
  <h1
    style={{
      marginBottom: "5px",
      fontSize: "18px",
      fontWeight: 500,
      color: "#0f172a",
    }}
  >
    <b>CÂU LẠC BỘ SINH VIÊN 5 TỐT TRƯỜNG ĐẠI HỌC Y DƯỢC BUÔN MA THUỘT</b>
  </h1>

   <p
  style={{
    textAlign: "center",
    fontSize: "24px",
    fontWeight: "bold",
    marginTop: "0px",
    color: "#0f65de",
  }}
>
    Mô Hình hỗ trợ sinh viên phấn đấu đạt danh hiệu Sinh viên 5 tốt các cấp
  </p>
</div>

    <hr
      style={{
        margin: "20px 0",
      }}
    />

    <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
 <div
  style={{
    display: "flex",
    width: "420px",
    marginBottom: "20px",
  }}
>
  <input
    placeholder="🔍 Tìm MSSV hoặc họ tên..."
    value={search}
    onChange={(e) =>
      setSearch(e.target.value)
    }
    style={{
      flex: 1,
      padding: "14px",
      border:
        "1px solid #dbe2ea",
      borderRight: "none",
      borderRadius:
        "12px 0 0 12px",
    }}
  />

  <select
    value={filterResult}
    onChange={(e) =>
      setFilterResult(
        e.target.value
      )
    }
    style={{
      padding: "14px",
      border:
        "1px solid #dbe2ea",
      borderRadius:
        "0 12px 12px 0",
      background: "white",
      cursor: "pointer",
    }}
  >
    <option value="all">
      Tất cả
    </option>

    <option value="passed">
      Đạt
    </option>

    <option value="failed">
      Chưa đạt
    </option>
  </select>
</div>


 <div style={{ position: "relative" }}>
  <button
    onClick={() =>
      setShowExportMenu(!showExportMenu)
    }
    style={{
      padding: "12px 18px",
      borderRadius: "10px",
      border: "none",
      background: "#16a34a",
      color: "white",
      fontWeight: 600,
      cursor: "pointer",
    }}
  >
    Xuất
  </button>

  {showExportMenu && (
    <div
      style={{
        position: "absolute",
        top: "110%",
        right: 0,
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "10px",
        boxShadow:
          "0 4px 12px rgba(0,0,0,0.15)",
        minWidth: "200px",
        zIndex: 999,
      }}
    >
      <div
        onClick={() => {
          exportExcel();
          setShowExportMenu(false);
        }}
        style={{
          padding: "12px",
          cursor: "pointer",
          borderBottom:
            "1px solid #eee",
        }}
      >
        📊 Xuất Excel
      </div>

      <div
        onClick={() => {
          window.open(
  `/api/export-all-student?filter=${filterResult}&search=${encodeURIComponent(search)}`,
  "_blank"
)
          setShowExportMenu(false);
        }}
        style={{
          padding: "12px",
          cursor: "pointer",
        }}
      >
        🗂️ Xuất toàn bộ hồ sơ
      </div>
    </div>
  )}
</div>
</div>
    <div
  style={{
    background: "white",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  }}
>
  <div
  style={{
    overflowX: "auto",
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
          background: "#dbeafe",
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
  {sv["dao-duc"] ? (
    <span
      style={{
        background: "#dcfce7",
        color: "#166534",
        padding: "4px 10px",
        borderRadius: "999px",
        fontWeight: 600,
      }}
    >
      Đạt
    </span>
  ) : (
    <span
      style={{
        background: "#fee2e2",
        color: "#991b1b",
        padding: "4px 10px",
        borderRadius: "999px",
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
  {sv["hoc-tap"] ? (
    <span
      style={{
        background: "#dcfce7",
        color: "#166534",
        padding: "4px 10px",
        borderRadius: "999px",
        fontWeight: 600,
      }}
    >
      Đạt
    </span>
  ) : (
    <span
      style={{
        background: "#fee2e2",
        color: "#991b1b",
        padding: "4px 10px",
        borderRadius: "999px",
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
  {sv["the-luc"] ? (
    <span
      style={{
        background: "#dcfce7",
        color: "#166534",
        padding: "4px 10px",
        borderRadius: "999px",
        fontWeight: 600,
      }}
    >
      Đạt
    </span>
  ) : (
    <span
      style={{
        background: "#fee2e2",
        color: "#991b1b",
        padding: "4px 10px",
        borderRadius: "999px",
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
  {sv["tinh-nguyen"] ? (
    <span
      style={{
        background: "#dcfce7",
        color: "#166534",
        padding: "4px 10px",
        borderRadius: "999px",
        fontWeight: 600,
      }}
    >
      Đạt
    </span>
  ) : (
    <span
      style={{
        background: "#fee2e2",
        color: "#991b1b",
        padding: "4px 10px",
        borderRadius: "999px",
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
  {sv["hoi-nhap"] ? (
    <span
      style={{
        background: "#dcfce7",
        color: "#166534",
        padding: "4px 10px",
        borderRadius: "999px",
        fontWeight: 600,
      }}
    >
      Đạt
    </span>
  ) : (
    <span
      style={{
        background: "#fee2e2",
        color: "#991b1b",
        padding: "4px 10px",
        borderRadius: "999px",
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
    fontWeight: "bold",
  }}
>
 {sv["dao-duc"] &&
 sv["hoc-tap"] &&
 sv["the-luc"] &&
 sv["tinh-nguyen"] &&
 sv["hoi-nhap"] ? (
  <span
    style={{
      background: "#dcfce7",
      color: "#166534",
      padding: "6px 12px",
      borderRadius: "999px",
      fontWeight: 600,
    }}
  >
    Đạt
  </span>
)    : sv.dao_duc &&
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
  </div>
  
  </div>

  <Footer />
</div>
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