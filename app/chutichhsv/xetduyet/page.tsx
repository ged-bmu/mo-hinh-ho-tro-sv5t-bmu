"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Spinner from "../../components/Spinner";
import Header from "../../components/Header";
import CriteriaModal from "../../components/CriteriaModal";
import Footer from "../../components/Footer";
import SidebarChutichhsv from "../sidebarchutichhsv/page";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function ChuTichXetDuyetPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [tab, setTab] = useState("");
  const [showCriteria, setShowCriteria] = useState(false);
  const [approvers, setApprovers] = useState<Record<string, string>>({});
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [quickApproveState, setQuickApproveState] = useState<Record<string, boolean>>({});
  const [isOpen, setIsOpen] = useState(true);
  const [savingSubmission, setSavingSubmission] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const isReviewedStatus = (status?: string) =>
    (status || "chua_danh_gia") !== "chua_danh_gia";

  const hasAchievementApproval = (
    status?: string,
    approverId?: string
  ) => (status || "chua_danh_gia") === "da_dat" && !!approverId;

const isApprovalToggled = (student: any) =>
  !!student?.da_duyet;

const approvalLabel = (student: any) =>
  isApprovalToggled(student) ? "Đã duyệt" : "Chưa duyệt";

  useEffect(() => {
    checkAccount();
  }, []);

  async function checkAccount() {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(
          "Lỗi lấy tài khoản:",
          userError
        );
        window.location.href = "/introduce";
        return;
      }

      if (!user) {
        window.location.href = "/introduce";
        return;
      }

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("ho_ten, email, roles")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error(
          "Lỗi kiểm tra quyền:",
          profileError
        );
        window.location.href = "/";
        return;
      }

      if (
        !profileData?.roles?.includes(
          "chu_tich_hsv"
        )
      ) {
        window.location.href = "/";
        return;
      }

      setProfile(profileData);
      // LẤY TRẠNG THÁI NHẬN HỒ SƠ
const {
  data: setting,
  error: settingError,
} = await supabase
  .from("site_settings")
  .select("submission_open")
  .eq("id", 1)
  .single();

if (settingError) {
  console.error(
    "Lỗi lấy trạng thái nhận hồ sơ:",
    settingError
  );
} else if (setting) {
  setIsOpen(setting.submission_open);
}

      // TỔNG SINH VIÊN

      const {
        count: totalCount,
        error: totalError,
      } = await supabase
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("role", "student");

      if (totalError) {
        console.error(
          "Lỗi đếm tổng sinh viên:",
          totalError
        );
      } else {
        setTotalStudents(totalCount || 0);
      }

      // HỒ SƠ ĐÃ NỘP

      const {
        data: submittedStudents,
        count: submittedCountData,
        error: submittedError,
      } = await supabase
        .from("profiles")
        .select("*", {
          count: "exact",
        })
        .eq("role", "student")
        .eq("is_submitted", true)
        .order("lop", {
          ascending: true,
        })
        .order("mssv", {
          ascending: true,
        });

      if (submittedError) {
        console.error(
          "Lỗi lấy hồ sơ đã nộp:",
          submittedError
        );
      } else {
        const studentList = submittedStudents || [];
        setSubmittedCount(
          submittedCountData || 0
        );
        setStudents(studentList);

        const approverIds = [
          ...new Set(
            studentList
              .map((sv) => sv.nguoi_duyet_id)
              .filter(Boolean)
          ),
        ];

        if (approverIds.length > 0) {
          const {
            data: approversData,
            error: approversError,
          } = await supabase
            .from("profiles")
            .select("id, ho_ten")
            .in("id", approverIds);

          if (approversError) {
            console.error(
              "Lỗi lấy tên người duyệt:",
              approversError
            );
          } else {
            const map: Record<string, string> = {};
            (approversData || []).forEach((item) => {
              map[item.id] = item.ho_ten;
            });
            setApprovers(map);
          }
        } else {
          setApprovers({});
        }
      }

      setLoading(false);
    } catch (error) {
      console.error(
        "Lỗi kiểm tra tài khoản:",
        error
      );
      setLoading(false);
    }
  }

  const approvedCount = students.filter(
    (sv) =>
      (sv.trang_thai || "chua_danh_gia") !==
      "chua_danh_gia"
  ).length;

  const pendingCount = students.filter(
    (sv) =>
      (sv.trang_thai || "chua_danh_gia") ===
      "chua_danh_gia"
  ).length;

  const submissionPercent =
    totalStudents > 0
      ? Math.round(
          (submittedCount / totalStudents) * 100
        )
      : 0;
async function toggleSubmission() {
  const newStatus = !isOpen;

  setSavingSubmission(true);

  const { error } = await supabase
    .from("site_settings")
    .update({
      submission_open: newStatus,
    })
    .eq("id", 1);

  setSavingSubmission(false);

  if (error) {
    console.error(
      "Lỗi thay đổi trạng thái nhận hồ sơ:",
      error
    );

    alert(
      "Không thể thay đổi trạng thái nhận hồ sơ."
    );

    return;
  }

  setIsOpen(newStatus);
}
  async function updateTrangThai(
    studentId: string,
    value: string
  ) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("Không xác định được tài khoản Chủ tịch HSV.");
      return;
    }

    setSavingStatus(true);

const { data, error } = await supabase
  .from("profiles")
.update({
  trang_thai: value,
  nguoi_duyet_id:
    value === "chua_danh_gia" ? null : user.id,
})
  .eq("id", studentId)
  .select("id, trang_thai, nguoi_duyet_id, ghi_chu, da_duyet")
  .single();

    if (error) {
      console.error("LỖI CẬP NHẬT TRẠNG THÁI:", error);
      alert("Cập nhật trạng thái thất bại: " + error.message);
      return;
    }

    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? { ...student, ...data }
          : student
      )
    );

    setSelectedStudent((prev: any) =>
      prev?.id === studentId
        ? { ...prev, ...data }
        : prev
    );

    if (data?.nguoi_duyet_id) {
      const { data: approverData } = await supabase
        .from("profiles")
        .select("id, ho_ten")
        .eq("id", data.nguoi_duyet_id)
        .single();

      if (approverData) {
        setApprovers((prev) => ({
          ...prev,
          [approverData.id]: approverData.ho_ten,
        }));
      }
    }
  }

async function handleQuickApprove(student: any) {
  const alreadyApproved = isApprovalToggled(student);

  setSavingStatus(true);

  const { data, error } = await supabase
    .from("profiles")
    .update({
      da_duyet: !alreadyApproved,
    })
    .eq("id", student.id)
    .select("id, da_duyet")
    .single();

  setSavingStatus(false);

  if (error) {
    console.error("LỖI CẬP NHẬT TRẠNG THÁI DUYỆT:", error);
    alert("Cập nhật trạng thái duyệt thất bại: " + error.message);
    return;
  }

  setStudents((prev) =>
    prev.map((item) =>
      item.id === student.id
        ? { ...item, da_duyet: data.da_duyet }
        : item
    )
  );

  setSelectedStudent((prev: any) =>
    prev?.id === student.id
      ? { ...prev, da_duyet: data.da_duyet }
      : prev
  );
}
async function handleApproveAll() {
  if (students.length === 0) return;

  const allApproved = students.every(
    (student) => student.da_duyet === true
  );

  const newApprovalState = !allApproved;

  setSavingStatus(true);

  const studentIds = students.map((student) => student.id);

  const { data, error } = await supabase
    .from("profiles")
    .update({
      da_duyet: newApprovalState,
    })
    .in("id", studentIds)
    .select("id, da_duyet");

  setSavingStatus(false);

  if (error) {
    console.error(
      "LỖI DUYỆT TẤT CẢ:",
      error
    );

    alert(
      "Cập nhật trạng thái duyệt thất bại: " +
        error.message
    );

    return;
  }

  const updatedMap: Record<string, boolean> = {};

  (data || []).forEach((item) => {
    updatedMap[item.id] = item.da_duyet;
  });

  setStudents((prev) =>
    prev.map((student) =>
      updatedMap[student.id] !== undefined
        ? {
            ...student,
            da_duyet: updatedMap[student.id],
          }
        : student
    )
  );

  setSelectedStudent((prev: any) =>
    prev && updatedMap[prev.id] !== undefined
      ? {
          ...prev,
          da_duyet: updatedMap[prev.id],
        }
      : prev
  );
}
  async function updateGhiChu(
    studentId: string,
    value: string
  ) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return;
    }

    setSavingNote(true);

    const { data, error } = await supabase
      .from("profiles")
      .update({
  ghi_chu: value,
  nguoi_duyet_id: user.id,
})
      .eq("id", studentId)
      .select("id, ghi_chu, nguoi_duyet_id, da_duyet")
      .single();

    setSavingNote(false);

    if (error) {
      console.error("LỖI TỰ ĐỘNG LƯU GHI CHÚ:", error);
      return;
    }

    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? { ...student, ...data }
          : student
      )
    );

    setSelectedStudent((prev: any) =>
      prev?.id === studentId
        ? { ...prev, ...data }
        : prev
    );

    if (data?.nguoi_duyet_id) {
      const { data: approverData } = await supabase
        .from("profiles")
        .select("id, ho_ten")
        .eq("id", data.nguoi_duyet_id)
        .single();

      if (approverData) {
        setApprovers((prev) => ({
          ...prev,
          [approverData.id]: approverData.ho_ten,
        }));
      }
    }
  }
const filteredStudents = students.filter((student) => {
  const keyword = searchText.trim().toLowerCase();

  const matchesSearch =
    !keyword ||
    String(student.ho_ten || "").toLowerCase().includes(keyword) ||
    String(student.lop || "").toLowerCase().includes(keyword) ||
    String(student.mssv || "").toLowerCase().includes(keyword);

  const matchesStatus =
    filterStatus === "all" ||
    (student.trang_thai || "chua_danh_gia") === filterStatus;

  return matchesSearch && matchesStatus;
});
const exportExcel = async () => {
  try {
    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet("Danh sách SV5T");

    worksheet.mergeCells("A1:D1");

    worksheet.getCell("A1").value =
      "DANH SÁCH SINH VIÊN ĐẠT DANH HIỆU SINH VIÊN 5 TỐT CẤP TRƯỜNG";

    worksheet.getCell("A1").font = {
      bold: true,
      size: 16,
    };

    worksheet.getCell("A1").alignment = {
      horizontal: "center",
    };

    worksheet.addRow([]);

    worksheet.addRow([
      "STT",
      "Họ tên",
      "Lớp",
      "MSSV",
    ]);

    const headerRow = worksheet.getRow(3);

    headerRow.font = {
      bold: true,
    };

    headerRow.alignment = {
      horizontal: "center",
    };

    filteredStudents.forEach((sv, index) => {
      worksheet.addRow([
        index + 1,
        sv.ho_ten,
        sv.lop,
        sv.mssv,
      ]);
    });

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

    const buffer = await workbook.xlsx.writeBuffer();

    saveAs(
      new Blob([buffer]),
      "DanhSachSV5T.xlsx"
    );
  } catch (error) {
    console.error("Lỗi xuất Excel:", error);
    alert("Không thể xuất file Excel.");
  }
};
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
      }}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <Header
        tab={tab}
        setTab={setTab}
        openCriteria={() =>
          setShowCriteria(true)
        }
        openProfile={() =>
          setShowProfile(true)
        }
      />

      {/* =====================================================
          SIDEBAR + CONTENT
      ===================================================== */}

      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          width: "100%",
          minHeight:
            "calc(100vh - 90px)",
        }}
      >
        {/* SIDEBAR */}

        <SidebarChutichhsv />

        {/* CONTENT */}

        <main
          style={{
            flex: 1,
            minWidth: 0,
            minHeight:
              "calc(100vh - 90px)",
          }}
        >
          {loading ? (
            <div
              style={{
                minHeight:
                  "calc(100vh - 90px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f8fafc",
              }}
            >
              <Spinner size={32} />
            </div>
          ) : (
            <div
              style={{
                padding: "30px",
              }}
            >
              <div
                style={{
                  maxWidth: "1200px",
                  margin: "0 auto",
                }}
              >
                {/* =================================================
                    HEADER TRANG
                ================================================= */}

                <div
                  style={{
                    marginBottom: "25px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href =
                        "/chutichhsv";
                    }}
                    style={{
                      display:
                        "inline-flex",
                      alignItems:
                        "center",
                      gap: "8px",

                      border:
                        "1px solid #e2e8f0",

                      background:
                        "#ffffff",

                      padding:
                        "9px 15px",

                      color:
                        "#334155",

                      fontSize: "14px",
                      fontWeight: 600,

                      cursor: "pointer",

                      marginBottom:
                        "18px",

                      borderRadius:
                        "10px",

                      boxShadow:
                        "0 2px 6px rgba(15,23,42,0.06)",

                      transition:
                        "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "#f8fafc";

                      e.currentTarget.style.borderColor =
                        "#cbd5e1";

                      e.currentTarget.style.transform =
                        "translateY(-1px)";

                      e.currentTarget.style.boxShadow =
                        "0 4px 10px rgba(15,23,42,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "#ffffff";

                      e.currentTarget.style.borderColor =
                        "#e2e8f0";

                      e.currentTarget.style.transform =
                        "translateY(0)";

                      e.currentTarget.style.boxShadow =
                        "0 2px 6px rgba(15,23,42,0.06)";
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform =
                        "scale(0.97)";
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform =
                        "translateY(-1px)";
                    }}
                  >
                    <span
                      style={{
                        fontSize: "17px",
                        lineHeight: 1,
                      }}
                    >
                      ←
                    </span>

                    <span>
                      Trang chủ
                    </span>
                  </button>

<div
  style={{
    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    borderRadius: "20px",
    padding: "20px 24px",
    color: "#fff",
    marginBottom: "25px",
    boxShadow: "0 8px 25px rgba(37, 99, 235, 0.18)",
  }}
>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "10px",
      flexWrap: "wrap",
    }}
  >
    <div>
      <div
        style={{
          fontSize: "13px",
          opacity: 0.85,
          marginBottom: "8px",
          fontWeight: 500,
          letterSpacing: "0.3px",
        }}
      >
        HỆ THỐNG QUẢN LÝ HỒ SƠ SINH VIÊN 5 TỐT
      </div>

      <h1
        style={{
          margin: 0,
          fontSize: "24px",
          fontWeight: 700,
        }}
      >
        Xét duyệt hồ sơ Sinh viên 5 tốt
      </h1>
    </div>

    <div
      style={{
        width: "64px",
        height: "64px",
        borderRadius: "18px",
        background: "rgba(255,255,255,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "30px",
        border: "1px solid rgba(255,255,255,0.2)",
        flexShrink: 0,
      }}
    >
      📋
    </div>
  </div>
</div>
                </div>

                {/* =================================================
                    THỐNG KÊ
                ================================================= */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: "12px",
                    marginBottom: "18px",
                  }}
                >
                  {/* ĐÃ NỘP */}

                  <div
                    style={{
                      background: "#fff",
                      border:
                        "1px solid #e2e8f0",
                      borderRadius: "14px",
                      padding: "16px 14px",
                      boxShadow:
                        "0 2px 8px rgba(15,23,42,0.04)",
                    }}
                  >
                    <div
                      style={{
                        color:
                          "#64748b",
                        fontSize:
                          "12px",
                        marginBottom:
                          "6px",
                      }}
                    >
                      Hồ sơ đã nộp
                    </div>

                    <div
                      style={{
                        fontSize:
                          "24px",
                        fontWeight: 700,
                        color:
                          "#0f172a",
                        lineHeight: 1.1,
                      }}
                    >
                      {submittedCount}
                    </div>

                    <div
                      style={{
                        fontSize:
                          "11px",
                        color:
                          "#64748b",
                        marginTop:
                          "4px",
                      }}
                    >
                      {submissionPercent}%
                      tổng sinh viên
                    </div>
                  </div>

                  {/* ĐÃ XÉT */}

                  <div
                    style={{
                      background: "#fff",
                      border:
                        "1px solid #e2e8f0",
                      borderRadius: "16px",
                      padding: "21px",
                      boxShadow:
                        "0 2px 8px rgba(15,23,42,0.04)",
                    }}
                  >
                    <div
                      style={{
                        color:
                          "#64748b",
                        fontSize:
                          "12px",
                        marginBottom:
                          "6px",
                      }}
                    >
                      Đã xét duyệt
                    </div>

                    <div
                      style={{
                        fontSize:
                          "24px",
                        fontWeight: 700,
                        color:
                          "#16a34a",
                        lineHeight: 1.1,
                      }}
                    >
                      {approvedCount}
                    </div>

                    <div
                      style={{
                        fontSize:
                          "11px",
                        color:
                          "#64748b",
                        marginTop:
                          "4px",
                      }}
                    >
                      Trong số hồ sơ đã
                      nộp
                    </div>
                  </div>

                  {/* CHƯA XÉT */}

                  <div
                    style={{
                      background: "#fff",
                      border:
                        "1px solid #e2e8f0",
                      borderRadius: "14px",
                      padding: "16px 14px",
                      boxShadow:
                        "0 2px 8px rgba(15,23,42,0.04)",
                    }}
                  >
                    <div
                      style={{
                        color:
                          "#64748b",
                        fontSize:
                          "12px",
                        marginBottom:
                          "6px",
                      }}
                    >
                      Chưa xét
                    </div>

                    <div
                      style={{
                        fontSize:
                          "24px",
                        fontWeight: 700,
                        color:
                          "#d97706",
                        lineHeight: 1.1,
                      }}
                    >
                      {pendingCount}
                    </div>

                    <div
                      style={{
                        fontSize:
                          "11px",
                        color:
                          "#64748b",
                        marginTop:
                          "4px",
                      }}
                    >
                      Cần tiếp tục xử lý
                    </div>
                  </div>

                  {/* TỔNG */}

                  <div
                    style={{
                      background: "#fff",
                      border:
                        "1px solid #e2e8f0",
                      borderRadius: "14px",
                      padding: "16px 14px",
                      boxShadow:
                        "0 2px 8px rgba(15,23,42,0.04)",
                    }}
                  >
                    <div
                      style={{
                        color:
                          "#64748b",
                        fontSize:
                          "12px",
                        marginBottom:
                          "6px",
                      }}
                    >
                      Tổng sinh viên
                    </div>

                    <div
                      style={{
                        fontSize:
                          "24px",
                        fontWeight: 700,
                        color:
                          "#2563eb",
                        lineHeight: 1.1,
                      }}
                    >
                      {totalStudents}
                    </div>

                    <div
                      style={{
                        fontSize:
                          "11px",
                        color:
                          "#64748b",
                        marginTop:
                          "4px",
                      }}
                    >
                      Sinh viên trong hệ
                      thống
                    </div>
                  </div>
                </div>

                {/* =================================================
                    DANH SÁCH
                ================================================= */}
                <div
                  style={{
                    background: "#fff",
                    border:
                      "1px solid #e2e8f0",
                    borderRadius: "16px",
                    overflow: "hidden",
                    marginBottom: "20px",
                    boxShadow:
                      "0 2px 8px rgba(15,23,42,0.04)",
                  }}
                >
                <div
  style={{
    padding: "22px 25px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
  }}
>
  <div>
    <h2
      style={{
        margin: 0,
        fontSize: "18px",
        fontWeight: 700,
        color: "#0f172a",
      }}
    >
      Danh sách hồ sơ đã nộp
    </h2>

    <div
      style={{
        marginTop: "5px",
        fontSize: "13px",
        color: "#64748b",
      }}
    >
      Có{" "}
      <strong
        style={{
          color: "#2563eb",
        }}
      >
        {students.length}
      </strong>{" "}
      hồ sơ đang chờ xử lý
    </div>
  </div>

<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  }}
>
  {/* BỘ LỌC TRẠNG THÁI */}
  <select
    value={filterStatus}
    onChange={(e) => setFilterStatus(e.target.value)}
    style={{
      padding: "9px 12px",
      borderRadius: "9px",
      border: "1px solid #cbd5e1",
      background: "#fff",
      color: "#334155",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer",
      outline: "none",
    }}
  >
    <option value="all">Tất cả trạng thái</option>
    <option value="chua_danh_gia">Chưa đánh giá</option>
    <option value="can_xem_xet">Cần xem xét</option>
    <option value="da_dat">Hồ sơ đã đạt</option>
    <option value="khong_dat">Hồ sơ không đạt</option>
  </select>



  {/* NÚT MỞ / ĐÓNG */}
  <button
    type="button"
    onClick={toggleSubmission}
    disabled={savingSubmission}
    style={{
      border: "1px solid #2563eb",
      background: isOpen ? "#2563eb" : "#fff",
      color: isOpen ? "#fff" : "#2563eb",
      padding: "9px 16px",
      borderRadius: "9px",
      fontSize: "13px",
      fontWeight: 600,
      cursor: savingSubmission ? "not-allowed" : "pointer",
      opacity: savingSubmission ? 0.6 : 1,
      whiteSpace: "nowrap",
    }}
  >
    Nhận hồ sơ&nbsp;&nbsp;|&nbsp;&nbsp;
    {isOpen ? "Mở" : "Đóng"}
  </button>

  {/* NÚT DUYỆT TẤT CẢ */}
  <button
    type="button"
    onClick={handleApproveAll}
    disabled={savingStatus || students.length === 0}
    style={{
      border: "1px solid #16a34a",
      background:
        students.length > 0 &&
        students.every((student) => student.da_duyet === true)
          ? "#dcfce7"
          : "#16a34a",
      color:
        students.length > 0 &&
        students.every((student) => student.da_duyet === true)
          ? "#166534"
          : "#fff",
      padding: "9px 16px",
      borderRadius: "9px",
      fontSize: "13px",
      fontWeight: 600,
      cursor:
        savingStatus || students.length === 0
          ? "not-allowed"
          : "pointer",
      opacity:
        savingStatus || students.length === 0
          ? 0.6
          : 1,
      whiteSpace: "nowrap",
    }}
  >
    {students.length > 0 &&
    students.every((student) => student.da_duyet === true)
      ? "Bỏ duyệt tất cả"
      : "Duyệt tất cả"}
  </button>
    {/* NÚT XUẤT */}
<button
  type="button"
  onClick={exportExcel}
  style={{
    padding: "9px 16px",
    borderRadius: "9px",
    border: "none",
    background: "#16a34a",
    color: "white",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  }}
>
  Xuất
</button>
</div>
    </div>

                  <div
                    style={{
                      overflowX:"auto",
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        borderCollapse:"collapse",
                        minWidth: "950px",
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            background:
                              "#dbeafe",
                          }}
                        >
                          <th
                            style={{
                              padding:
                                "14px 12px",
                              textAlign:
                                "center",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            STT
                          </th>

                          <th
                            style={{
                              padding:
                                "14px 16px",
                              textAlign:
                                "left",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            Họ tên
                          </th>

                          <th
                            style={{
                              padding:
                                "14px 16px",
                              textAlign:
                                "center",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            Lớp
                          </th>

                          <th
                            style={{
                              padding:
                                "14px 16px",
                              textAlign:
                                "center",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            MSSV
                          </th>

                          <th
                            style={{
                              padding:
                                "14px 16px",
                              textAlign:
                                "center",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            Trạng thái
                          </th>

                          <th
                            style={{
                              padding:
                                "14px 16px",
                              textAlign:
                                "center",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            Người xét duyệt
                          </th>

                          <th
                            style={{
                              padding:
                                "14px 16px",
                              textAlign:
                                "center",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            Ghi chú
                          </th>

                          <th
                            style={{
                              padding:
                                "14px 16px",
                              textAlign:
                                "center",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            Duyệt
                          </th>

                          <th
                            style={{
                              padding:
                                "14px 16px",
                              textAlign:
                                "center",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            Xem
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredStudents.map(
                          (sv, index) => (
                            <tr
                              key={sv.id}
                              style={{
                                borderTop:
                                  "1px solid #e2e8f0",
                              }}
                            >
                              <td
                                style={{
                                  padding:
                                    "14px 12px",
                                  textAlign:
                                    "center",
                                  color:
                                    "#475569",
                                }}
                              >
                                {index + 1}
                              </td>

                              <td
                                style={{
                                  padding:
                                    "14px 16px",
                                  fontWeight: 600,
                                  color:
                                    "#0f172a",
                                }}
                              >
                                {sv.ho_ten}
                              </td>

                              <td
                                style={{
                                  padding:
                                    "14px 16px",
                                  textAlign:
                                    "center",
                                  color:
                                    "#475569",
                                }}
                              >
                                {sv.lop}
                              </td>

                              <td
                                style={{
                                  padding:
                                    "14px 16px",
                                  textAlign:
                                    "center",
                                  color:
                                    "#475569",
                                }}
                              >
                                {sv.mssv}
                              </td>

                              <td
                                style={{
                                  padding:
                                    "14px 16px",
                                  textAlign:
                                    "center",
                                }}
                              >
                                {(() => {
                                  const status =
                                    sv.trang_thai ||
                                    "chua_danh_gia";
                                  const statusMap: Record<
                                    string,
                                    {
                                      label: string;
                                      background: string;
                                      color: string;
                                    }
                                  > = {
                                    chua_danh_gia: {
                                      label: "Chưa đánh giá",
                                      background: "#fef3c7",
                                      color: "#92400e",
                                    },
                                    can_xem_xet: {
                                      label: "Cần xem xét",
                                      background: "#dbeafe",
                                      color: "#1d4ed8",
                                    },
                                    da_dat: {
                                      label: "Hồ sơ đã đạt",
                                      background: "#dcfce7",
                                      color: "#15803d",
                                    },
                                    khong_dat: {
                                      label: "Hồ sơ không đạt",
                                      background: "#fee2e2",
                                      color: "#b91c1c",
                                    },
                                  };

                                  const current =
                                    statusMap[status] ||
                                    statusMap.chua_danh_gia;

                                  return (
                                    <span
                                      style={{
                                        display:
                                          "inline-block",
                                        padding:
                                          "6px 12px",
                                        borderRadius:
                                          "999px",
                                        background:
                                          current.background,
                                        color:
                                          current.color,
                                        fontSize:
                                          "13px",
                                        fontWeight:
                                          600,
                                      }}
                                    >
                                      {current.label}
                                    </span>
                                  );
                                })()}
                              </td>

                              <td
                                style={{
                                  padding:
                                    "14px 16px",
                                  textAlign:
                                    "center",
                                  color:
                                    "#64748b",
                                  fontSize:
                                    "14px",
                                  whiteSpace:
                                    "normal",
                                }}
                              >
                                <span
  style={{
    color: "#475569",
    fontWeight: 600,
  }}
>
  {sv.trang_thai === "chua_danh_gia"
    ? "Chưa có"
    : sv.nguoi_duyet_id
      ? approvers[sv.nguoi_duyet_id] || "Đang tải..."
      : "Chưa có"}
</span>
                              </td>

                              <td
                                style={{
                                  padding:
                                    "14px 16px",
                                  textAlign:
                                    "center",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedStudent(
                                      sv
                                    )
                                  }
                                  style={{
                                    border:
                                      "1px solid #2563eb",
                                    background:
                                      "#fff",
                                    color:
                                      "#2563eb",
                                    padding:
                                      "7px 12px",
                                    borderRadius:
                                      "8px",
                                    fontSize:
                                      "13px",
                                    fontWeight:
                                      600,
                                    cursor:
                                      "pointer",
                                  }}
                                >
                                  Xem ghi chú
                                </button>
                              </td>

                              <td
                                style={{
                                  padding:
                                    "14px 16px",
                                  textAlign:
                                    "center",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleQuickApprove(sv);
                                  }}
                                  disabled={savingStatus}
                                  style={{
                                    border:
                                      "1px solid #16a34a",
                                    background:
                                      isApprovalToggled(sv)
                                        ? "#dcfce7"
                                        : "#fff",
                                    color:
                                      isApprovalToggled(sv)
                                        ? "#166534"
                                        : "#16a34a",
                                    padding:
                                      "7px 12px",
                                    borderRadius:
                                      "8px",
                                    fontSize:
                                      "13px",
                                    fontWeight:
                                      600,
                                    cursor: savingStatus
                                      ? "not-allowed"
                                      : "pointer",
                                  }}
                                >
                                  {isApprovalToggled(sv)
                                    ? "Đã duyệt"
                                    : "Duyệt"}
                                </button>
                              </td>

                              <td
                                style={{
                                  padding:
                                    "14px 16px",
                                  textAlign:
                                    "center",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    window.location.href =
                                      `/chutichhsv/students/${sv.id}`;
                                  }}
                                  style={{
                                    border:
                                      "none",
                                    background:
                                      "#2563eb",
                                    color:
                                      "#fff",
                                    padding:
                                      "7px 12px",
                                    borderRadius:
                                      "8px",
                                    fontSize:
                                      "13px",
                                    fontWeight:
                                      600,
                                    cursor:
                                      "pointer",
                                    display:
                                      "inline-flex",
                                    alignItems:
                                      "center",
                                    gap: "5px",
                                  }}
                                >
                                  Xem
                                </button>
                              </td>
                            </tr>
                          )
                        )}

{filteredStudents.length === 0 && (
  <tr>
    <td
      colSpan={9}
      style={{
        padding: "40px 20px",
        textAlign: "center",
        color: "#64748b",
      }}
    >
      {students.length === 0
        ? "Chưa có sinh viên nào nộp hồ sơ."
        : "Không có hồ sơ phù hợp với bộ lọc."}
    </td>
  </tr>
)}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =====================================================
          MODAL LỊCH SỬ
      ===================================================== */}

      {selectedStudent && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={() =>
            setSelectedStudent(null)
          }
        >
          <div
            style={{
              width: "100%",
              maxWidth: "600px",
              background: "#fff",
              borderRadius: "16px",
              padding: "24px",
              boxShadow:
                "0 15px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom: "20px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "19px",
                    fontWeight: 700,
                    color:
                      "#0f172a",
                  }}
                >
                  Lịch sử xét duyệt
                </h2>

                <div
                  style={{
                    marginTop: "5px",
                    fontSize:
                      "14px",
                    color:
                      "#64748b",
                  }}
                >
                  {selectedStudent.ho_ten} ·{" "}
                  {selectedStudent.mssv}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedStudent(
                    null
                  )
                }
                style={{
                  border: "none",
                  background:
                    "transparent",
                  fontSize: "26px",
                  color:
                    "#64748b",
                  cursor:
                    "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                border:
                  "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px",
                background:
                  "#f8fafc",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gap: "16px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#334155",
                      marginBottom: "8px",
                    }}
                  >
                    Trạng thái hồ sơ
                  </div>

                  <select
                    value={selectedStudent.trang_thai || "chua_danh_gia"}
                    onChange={(e) =>
                      updateTrangThai(
                        selectedStudent.id,
                        e.target.value
                      )
                    }
                    disabled={savingStatus}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      background: "#fff",
                      color: "#0f172a",
                      fontSize: "14px",
                      cursor: savingStatus ? "not-allowed" : "pointer",
                    }}
                  >
                    <option value="chua_danh_gia">Chưa đánh giá</option>
                    <option value="can_xem_xet">Cần xem xét</option>
                    <option value="da_dat">Hồ sơ đã đạt</option>
                    <option value="khong_dat">Hồ sơ không đạt</option>
                  </select>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#334155",
                      marginBottom: "8px",
                    }}
                  >
                    Ghi chú
                  </div>

                  <textarea
                    value={selectedStudent.ghi_chu || ""}
                    onChange={(e) =>
                      setSelectedStudent((prev: any) =>
                        prev
                          ? { ...prev, ghi_chu: e.target.value }
                          : prev
                      )
                    }
                    rows={6}
                    placeholder="Nhập ghi chú xét duyệt..."
                    style={{
                      width: "100%",
                      resize: "vertical",
                      border: "1px solid #cbd5e1",
                      borderRadius: "10px",
                      padding: "10px 12px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                      color: "#0f172a",
                      background: "#fff",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "13px",
                    color: "#64748b",
                  }}
                >
                  <span>
                    <>
                      Trạng thái duyệt: <strong>{approvalLabel(selectedStudent)}</strong>
                    </>
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      updateGhiChu(
                        selectedStudent.id,
                        selectedStudent.ghi_chu || ""
                      )
                    }
                    disabled={savingNote}
                    style={{
                      padding: "9px 14px",
                      borderRadius: "9px",
                      border: "1px solid #2563eb",
                      background: savingNote ? "#bfdbfe" : "#2563eb",
                      color: "#fff",
                      fontWeight: 600,
                      cursor: savingNote ? "not-allowed" : "pointer",
                    }}
                  >
                    {savingNote ? "Đang lưu..." : "Lưu ghi chú"}
                  </button>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent:
                  "flex-end",
                marginTop: "20px",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setSelectedStudent(
                    null
                  )
                }
                style={{
                  padding:
                    "9px 18px",
                  borderRadius:
                    "9px",
                  border:
                    "1px solid #d1d5db",
                  background:
                    "#fff",
                  color:
                    "#374151",
                  fontWeight: 600,
                  cursor:
                    "pointer",
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CRITERIA */}

      {showCriteria && (
        <CriteriaModal
          onClose={() =>
            setShowCriteria(false)
          }
        />
      )}

      <Footer />
    </div>
  );
}