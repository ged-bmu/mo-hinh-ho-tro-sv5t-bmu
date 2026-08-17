"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Footer from "../components/Footer";
import Spinner from "../components/Spinner";
import Header from "../components/Header";
import AdminSidebar from "../components/AdminSidebar";
import NotificationBell from "../components/NotificationBell";

export default function AdminPage() {
  const [profile, setProfile] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationContent, setNotificationContent] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [selectedPassed, setSelectedPassed] = useState<string[] | null>(null);
  const totalStudents = students.length;
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [filterResult, setFilterResult] = useState("all");
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
  const keyword = search.toLowerCase();
  const pathname = usePathname();
  const filteredStudents = students.filter((sv) => {
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
    : filterResult === "failed"
    ? !isPassed
    : filterResult === "submitted"
    ? sv.is_submitted === true
    : true;

    return (
      matchSearch &&
      matchFilter
    );
  });
useEffect(() => {
  checkAdmin();

  const channel = supabase
    .channel("admin-student-profile-status")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "profiles",
        filter: "role=eq.student",
      },
      (payload) => {
        const updatedStudent = payload.new as any;

        setStudents((prev) =>
          prev.map((sv) =>
            sv.id === updatedStudent.id
              ? {
                  ...sv,
                  ...updatedStudent,
                }
              : sv
          )
        );
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
async function toggleSubmission() {
  const newStatus = !isOpen;

  const { error } = await supabase
    .from("site_settings")
    .update({
      submission_open: newStatus,
    })
    .eq("id", 1);

  if (error) {
    console.error(error);
    alert("Không thể thay đổi trạng thái nhận hồ sơ.");
    return;
  }

  setIsOpen(newStatus);
}
async function sendGeneralNotification() {
  if (!notificationTitle.trim()) {
    alert("Vui lòng nhập tiêu đề thông báo.");
    return;
  }

  if (!notificationContent.trim()) {
    alert("Vui lòng nhập nội dung thông báo.");
    return;
  }

  try {
    // Lấy tất cả sinh viên
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "student");

    if (profilesError) {
      console.error(profilesError);
      alert("Không thể lấy danh sách sinh viên.");
      return;
    }

    if (!profiles || profiles.length === 0) {
      alert("Không có sinh viên nào để gửi thông báo.");
      return;
    }
    const notifications = profiles.map((profile) => ({
      user_id: profile.id,
      type: "general",
      title: notificationTitle.trim(),
      content: notificationContent.trim(),
      target_url: "/thongbaouser",
      is_read: false,
    }));

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notificationError) {
      console.error(notificationError);
      alert(
        "Không thể gửi thông báo: " + notificationError.message
      );
      return;
    }

    alert(`Đã gửi thông báo cho ${profiles.length} sinh viên.`);
    setNotificationTitle("");
    setNotificationContent("");
    setShowNotificationModal(false);
  } catch (error) {
    console.error(error);
    alert("Đã xảy ra lỗi khi gửi thông báo.");
  }
}
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

  // Lấy trạng thái nhận hồ sơ
  const { data: setting, error: settingError } = await supabase
    .from("site_settings")
    .select("submission_open")
    .eq("id", 1)
    .single();

  if (settingError) {
    console.error("Lỗi lấy trạng thái nhận hồ sơ:", settingError);
  }

  if (setting) {
    setIsOpen(setting.submission_open);
  }

  // Lấy danh sách sinh viên
  const { data: studentsData } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student");

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
<AdminSidebar />
<NotificationBell />

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
  onChange={(e) => setFilterResult(e.target.value)}
  style={{
    padding: "14px",
    border: "1px solid #dbe2ea",
    borderRadius: "0 12px 12px 0",
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

  <option value="submitted">
    Đã nộp hồ sơ
  </option>
</select>
</div>
<div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "10px",
    width: "100%",
    paddingRight: "20px",
  }}
>
  <button
    type="button"
    onClick={toggleSubmission}
    style={{
      padding: "12px 18px",
      borderRadius: "10px",
      border: "none",
      background: "#2563eb",
      color: "#fff",
      fontWeight: 600,
      cursor: "pointer",
      transition: "all .2s ease",
      whiteSpace: "nowrap",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "#1d4ed8";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "#2563eb";
    }}
  >
    Nhận hồ sơ&nbsp;&nbsp;|&nbsp;&nbsp;{isOpen ? "Mở" : "Đóng"}
  </button>

  <button
    type="button"
    onClick={() => setShowNotificationModal(true)}
    style={{
      padding: "12px 18px",
      borderRadius: "10px",
      border: "1px solid #2563eb",
      background: "#fff",
      color: "#2563eb",
      fontWeight: 600,
      cursor: "pointer",
      transition: "all .2s ease",
      whiteSpace: "nowrap",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "#eff6ff";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "#fff";
    }}
  >
    Gửi thông báo
  </button>
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
    setExporting(true);

    window.open(
      `/api/export-all-student?filter=${filterResult}&search=${encodeURIComponent(search)}`,
      "_blank"
    );

    setShowExportMenu(false);

    setTimeout(() => {
      setExporting(false);
    }, 2000);
  }}
  style={{
    padding: "12px",
    cursor: exporting ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  }}
>
  {exporting && <Spinner size={16} />}

  <span>
    {exporting
      ? "Đang xuất hồ sơ..."
      : "🗂️ Xuất toàn bộ hồ sơ"}

  </span>
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
  Các tiêu chí đã đạt
</th>

<th style={{ padding: "20px" }}>
  Trạng thái hồ sơ
</th>

<th style={{ padding: "20px" }}>
  Kết quả
</th>

<th style={{ padding: "20px" }}>
  Xem hồ sơ
</th>
      </tr>
    </thead>

    <tbody>
  {filteredStudents.map((sv, index) => {
    const criteria = [
      { field: "dao-duc", name: "Đạo đức tốt" },
      { field: "hoc-tap", name: "Học tập tốt" },
      { field: "the-luc", name: "Thể lực tốt" },
      { field: "tinh-nguyen", name: "Tình nguyện tốt" },
      { field: "hoi-nhap", name: "Hội nhập tốt" },
    ];

    const notPassed = criteria.filter(
      (item) => !sv[item.field]
    );

    return (
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

<td style={{ padding: "14px", textAlign: "center", }}>
  {sv.lop}
</td>

<td style={{ padding: "14px", textAlign: "center", }}>
  {sv.mssv}
</td>

<td
  style={{
    padding: "14px",
    textAlign: "center",
  }}
>
 <span
  style={{
    color: "#111827",
    cursor: "pointer",
    fontWeight: 600,
    transition: "color .2s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.color = "#2563eb";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.color = "#111827";
  }}
  onClick={() => {
    const passed = criteria
      .filter((item) => sv[item.field])
      .map((item) => item.name);

    setSelectedPassed(passed);
  }}
>
  {5 - notPassed.length}/5
</span>
</td>

<td
  style={{
    padding: "14px",
    textAlign: "center",
  }}
>
  {sv.is_submitted ? (
    <span
      style={{
        display: "inline-block",
        background: "#dcfce7",
        color: "#166534",
        padding: "6px 12px",
        borderRadius: "999px",
        fontWeight: 600,
        fontSize: "16px",
      }}
    >
      Đã nộp
    </span>
  ) : (
    <span
      style={{
        display: "inline-block",
        background: "#fef3c7",
        color: "#92400e",
        padding: "6px 12px",
        borderRadius: "999px",
        fontWeight: 600,
        fontSize: "16px",
      }}
    >
      Chưa nộp
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
    );
})}
    </tbody>
  </table>
  {selectedPassed && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.25)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}
    onClick={() => setSelectedPassed(null)}
  >
    <div
      style={{
        background: "#fff",
        borderRadius: "14px",
        padding: "20px",
        width: "320px",
        maxWidth: "90%",
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "17px",
            fontWeight: 700,
          }}
        >
          Tiêu chí đã đạt
        </h3>

        <button
          type="button"
          onClick={() => setSelectedPassed(null)}
          style={{
            border: "none",
            background: "transparent",
            fontSize: "24px",
            cursor: "pointer",
            color: "#64748b",
          }}
        >
          ×
        </button>
      </div>

      {selectedPassed.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {selectedPassed.map((name) => (
            <div
              key={name}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                background: "#f0fdf4",
                color: "#166534",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              ✅ {name}
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          Chưa đạt tiêu chí nào.
        </div>
      )}
    </div>
  </div>
)}
{showNotificationModal && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.35)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000,
      padding: "20px",
    }}
    onClick={() => setShowNotificationModal(false)}
  >
    <div
      style={{
        width: "100%",
        maxWidth: "520px",
        background: "#fff",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 15px 40px rgba(0,0,0,0.2)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "20px",
            fontWeight: 700,
            color: "#111827",
          }}
        >
          📢 Gửi thông báo chung
        </h2>

        <button
          type="button"
          onClick={() => {
            setShowNotificationModal(false);
            setNotificationTitle("");
            setNotificationContent("");
          }}
          style={{
            border: "none",
            background: "transparent",
            fontSize: "26px",
            color: "#64748b",
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Tiêu đề */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "7px",
            fontSize: "14px",
            fontWeight: 600,
            color: "#374151",
          }}
        >
          Tiêu đề
        </label>

        <input
          type="text"
          value={notificationTitle}
          onChange={(e) =>
            setNotificationTitle(e.target.value)
          }
          placeholder="Nhập tiêu đề thông báo..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "12px 14px",
            border: "1px solid #d1d5db",
            borderRadius: "10px",
            fontSize: "14px",
            outline: "none",
          }}
        />
      </div>

      {/* Nội dung */}
      <div style={{ marginBottom: "22px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "7px",
            fontSize: "14px",
            fontWeight: 600,
            color: "#374151",
          }}
        >
          Nội dung
        </label>

        <textarea
          value={notificationContent}
          onChange={(e) =>
            setNotificationContent(e.target.value)
          }
          placeholder="Nhập nội dung thông báo..."
          rows={5}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "12px 14px",
            border: "1px solid #d1d5db",
            borderRadius: "10px",
            fontSize: "14px",
            outline: "none",
            resize: "vertical",
          }}
        />
      </div>

      {/* Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
        }}
      >
        <button
          type="button"
          onClick={() => {
            setShowNotificationModal(false);
            setNotificationTitle("");
            setNotificationContent("");
          }}
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            background: "#fff",
            color: "#374151",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Hủy
        </button>

        <button
          type="button"
          onClick={sendGeneralNotification}
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            border: "none",
            background: "#2563eb",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Lưu
        </button>
      </div>
    </div>
  </div>
)}
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