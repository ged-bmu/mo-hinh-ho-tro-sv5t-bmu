"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Spinner from "../components/Spinner";
import Header from "../components/Header";
import CriteriaModal from "../components/CriteriaModal";
import Footer from "../components/Footer";

export default function BCHPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
const [selectedStudent, setSelectedStudent] = useState<any>(null);
const [tab, setTab] = useState("");
const [showCriteria, setShowCriteria] = useState(false);
const [showProfile, setShowProfile] = useState(false);
const [ghiChu, setGhiChu] = useState("");
const [approvers, setApprovers] = useState<Record<string, string>>({});
const [bchProfile, setBchProfile] = useState<any>(null);
const [studentProfile, setStudentProfile] = useState<any>(null);
const [studentSearch, setStudentSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("all");

  const isReviewedStatus = (status?: string) =>
    (status || "chua_danh_gia") !== "chua_danh_gia";
useEffect(() => {
  checkAccount();
}, []);

async function checkAccount() {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      window.location.href = "/introduce";
      return;
    }

    // ==============================
    // LẤY THÔNG TIN BCH ĐANG ĐĂNG NHẬP
    // ==============================
    const { data: profileData, error: profileError } =
      await supabase
        .from("profiles")
        .select("id, ho_ten, email, roles")
        .eq("id", user.id)
        .single();

    if (profileError || !profileData) {
      console.error("Lỗi lấy thông tin BCH:", profileError);
      window.location.href = "/";
      return;
    }

    setBchProfile(profileData);

    // ==============================
    // LẤY DANH SÁCH SINH VIÊN
    // ==============================
    const {
      data: submittedStudents,
      error: studentsError,
    } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "student")
      .eq("is_submitted", true)
      .order("lop", { ascending: true })
      .order("mssv", { ascending: true });

    if (studentsError) {
      console.error("Lỗi lấy danh sách hồ sơ:", studentsError);
      setStudents([]);
      return;
    }

    const studentList = submittedStudents || [];

    setStudents(studentList);

    // ==============================
    // LẤY TÊN NGƯỜI DUYỆT
    // ==============================
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
          "Lỗi lấy thông tin người duyệt:",
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
  } catch (error) {
    console.error("Lỗi:", error);
  } finally {
    setLoading(false);
  }
}

// =====================================================
// CẬP NHẬT TRẠNG THÁI + NGƯỜI DUYỆT
// =====================================================
async function updateTrangThai(
  studentId: string,
  value: string
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    alert("Không xác định được tài khoản BCH.");
    return;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      trang_thai: value,
    })
    .eq("id", studentId)
    .select("id, trang_thai, nguoi_duyet_id, ghi_chu")
    .single();

  if (error) {
    console.error("LỖI CẬP NHẬT TRẠNG THÁI:", error);
    alert("Cập nhật trạng thái thất bại: " + error.message);
    return;
  }

  setStudents((prev) =>
    prev.map((student) =>
      student.id === studentId
        ? {
            ...student,
            ...data,
            nguoi_duyet_id: student.nguoi_duyet_id ?? data?.nguoi_duyet_id ?? null,
          }
        : student
    )
  );

  setSelectedStudent((prev: any) =>
    prev?.id === studentId
      ? {
          ...prev,
          ...data,
          nguoi_duyet_id: prev?.nguoi_duyet_id ?? data?.nguoi_duyet_id ?? null,
        }
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

// =====================================================
// TỰ ĐỘNG LƯU GHI CHÚ
// =====================================================
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

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ghi_chu: value,
    })
    .eq("id", studentId)
    .select("id, ghi_chu, nguoi_duyet_id")
    .single();

  if (error) {
    console.error("LỖI TỰ ĐỘNG LƯU GHI CHÚ:", error);
    return;
  }

  setStudents((prev) =>
    prev.map((student) =>
      student.id === studentId
        ? {
            ...student,
            ...data,
            nguoi_duyet_id: student.nguoi_duyet_id ?? data?.nguoi_duyet_id ?? null,
          }
        : student
    )
  );

  setSelectedStudent((prev: any) =>
    prev?.id === studentId
      ? {
          ...prev,
          ...data,
          nguoi_duyet_id: prev?.nguoi_duyet_id ?? data?.nguoi_duyet_id ?? null,
        }
      : prev
  );

  setGhiChu(value);

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

// =====================================================
// REALTIME PROFILES
// =====================================================
useEffect(() => {
  const channel = supabase
    .channel("bch-profiles-realtime")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "profiles",
      },
      async (payload) => {
        const updatedStudent = payload.new as any;

        // Cập nhật sinh viên trong bảng
        setStudents((prev) =>
          prev.map((student) =>
            student.id === updatedStudent.id
              ? {
                  ...student,
                  ...updatedStudent,
                }
              : student
          )
        );

        // Cập nhật modal nếu đang mở
        setSelectedStudent((prev: any) =>
          prev?.id === updatedStudent.id
            ? {
                ...prev,
                ...updatedStudent,
              }
            : prev
        );

        // Nếu có người duyệt mới thì lấy tên người đó
        if (updatedStudent.nguoi_duyet_id) {
          const { data: approverData } =
            await supabase
              .from("profiles")
              .select("id, ho_ten")
              .eq(
                "id",
                updatedStudent.nguoi_duyet_id
              )
              .single();

          if (approverData) {
            setApprovers((prev) => ({
              ...prev,
              [approverData.id]:
                approverData.ho_ten,
            }));
          }
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  const normalizedStudentSearch = studentSearch.trim().toLowerCase();

  const filteredStudents = students.filter((sv) => {
    const searchableValues = [
      sv.ho_ten,
      sv.lop,
      sv.mssv,
      sv.nganh,
      sv.chuyen_nganh,
      sv.nganh_hoc,
    ]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());

    const matchesSearch =
      !normalizedStudentSearch ||
      searchableValues.some((value) =>
        value.includes(normalizedStudentSearch)
      );

    const status = sv.trang_thai || "chua_danh_gia";
    const matchesStatus =
      statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusStats = [
    {
      label: "Nộp",
      value: filteredStudents.length,
      color: "#eff6ff",
      textColor: "#1d4ed8",
    },
    {
      label: "Đạt",
      value: filteredStudents.filter(
        (sv) => (sv.trang_thai || "chua_danh_gia") === "da_dat"
      ).length,
      color: "#dcfce7",
      textColor: "#15803d",
    },
    {
      label: "Chưa duyệt",
      value: filteredStudents.filter(
        (sv) => (sv.trang_thai || "chua_danh_gia") === "chua_danh_gia"
      ).length,
      color: "#fef3c7",
      textColor: "#92400e",
    },
    {
      label: "Cần xét",
      value: filteredStudents.filter(
        (sv) => (sv.trang_thai || "chua_danh_gia") === "can_xem_xet"
      ).length,
      color: "#dbeafe",
      textColor: "#1d4ed8",
    },
    {
      label: "Không đạt",
      value: filteredStudents.filter(
        (sv) => (sv.trang_thai || "chua_danh_gia") === "khong_dat"
      ).length,
      color: "#fee2e2",
      textColor: "#b91c1c",
    },
  ];

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
        }}
      >
        <Spinner size={44} />
      </div>
    );
  }
const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Lỗi đăng xuất:", error);
    return;
  }

  window.location.href = "/introduce";
};
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        display: "flex",
        flexDirection: "column",
      }}
    >
          <Header
            tab={tab}
            setTab={setTab}
            openCriteria={() => setShowCriteria(true)}
            openProfile={() => setShowProfile(true)}
          />
    {/* MAIN */}
    <main
      style={{
        width: "100%",
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "32px",
        boxSizing: "border-box",
        flex: 1,
      }}
    >
{/* PROFILE CARD */}
<div
  style={{
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "16px 18px",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
  }}
>
  {/* LEFT - PROFILE */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "14px",
      minWidth: 0,
    }}
  >
    <div
      style={{
        width: "52px",
        height: "52px",
        flexShrink: 0,
        borderRadius: "14px",
        background: "#eff6ff",
        color: "#2563eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "15px",
        fontWeight: 800,
        border: "1px solid #dbeafe",
      }}
    >
      BCH
    </div>

    <div
      style={{
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: "12px",
          color: "#64748b",
          marginBottom: "2px",
        }}
      >
        Ban Chấp hành Hội Sinh viên Trường
      </div>

      <h1
        style={{
          margin: 0,
          fontSize: "19px",
          lineHeight: 1.35,
          fontWeight: 750,
          color: "#0f172a",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        Đồng chí {bchProfile?.ho_ten}
      </h1>
    </div>
  </div>

  {/* LOGOUT */}
  <button
    onClick={handleLogout}
    style={{
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "7px",
      padding: "9px 13px",
      borderRadius: "10px",
      border: "1px solid #e2e8f0",
      background: "#fff",
      color: "#475569",
      fontSize: "13px",
      fontWeight: 650,
      cursor: "pointer",
      transition: "all 0.2s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "#fef2f2";
      e.currentTarget.style.color = "#dc2626";
      e.currentTarget.style.borderColor = "#fecaca";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "#fff";
      e.currentTarget.style.color = "#475569";
      e.currentTarget.style.borderColor = "#e2e8f0";
    }}
  >
    Đăng xuất
  </button>
</div>

      {/* TITLE */}
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "20px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: 750,
              color: "#0f172a",
            }}
          >
            Danh sách hồ sơ sinh viên
          </h2>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "flex-end",
            gap: "8px",
          }}
        >
          {statusStats.map((item) => (
            <div
              key={item.label}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: item.color,
                border: "1px solid rgba(148, 163, 184, 0.25)",
                color: item.textColor,
                borderRadius: "999px",
                padding: "6px 10px",
                fontSize: "12px",
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              <span>{item.label}</span>
              <span style={{ fontSize: "13px" }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* TABLE CARD */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "18px",
          overflow: "hidden",
          boxShadow: "0 3px 12px rgba(15,23,42,0.04)",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: "17px",
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            Hồ sơ đã nộp
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              justifyContent: "flex-end",
              width: "100%",
              maxWidth: "560px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "#f8fafc",
                border: "1px solid #dbeafe",
                borderRadius: "10px",
                padding: "8px 12px",
                minWidth: "220px",
                flex: "1 1 260px",
                maxWidth: "360px",
              }}
            >
              <span style={{ fontSize: "15px" }}>🔎</span>
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Tìm theo tên, lớp, MSSV, ngành"
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  width: "100%",
                  color: "#0f172a",
                  fontSize: "14px",
                }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                border: "1px solid #dbeafe",
                borderRadius: "10px",
                background: "#fff",
                color: "#0f172a",
                fontSize: "14px",
                padding: "9px 12px",
                minWidth: "170px",
                outline: "none",
                cursor: "pointer",
                height: "42px",
                boxSizing: "border-box",
              }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="chua_danh_gia">Chưa đánh giá</option>
              <option value="can_xem_xet">Cần xem xét</option>
              <option value="da_dat">Hồ sơ đã đạt</option>
              <option value="khong_dat">Hồ sơ không đạt</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "1100px",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#eff6ff",
                }}
              >
                <th style={thCenter}>STT</th>
                <th style={thLeft}>Họ tên</th>
                <th style={thCenter}>Lớp</th>
                <th style={thCenter}>MSSV</th>
                <th style={thCenter}>Trạng thái hồ sơ</th>
                <th style={thCenter}>Người duyệt hồ sơ</th>
                <th style={thCenter}>Ghi chú</th>
                <th style={thCenter}>Xét hồ sơ</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.map((sv, index) => (
                <tr
                  key={sv.id}
                  style={{
                    borderTop: "1px solid #e2e8f0",
                  }}
                >
                  <td style={tdCenterLarge}>
                    {index + 1}
                  </td>

                  <td
                    style={{
                      padding: "18px 18px",
                      fontSize: "16px",
                      fontWeight: 650,
                      color: "#0f172a",
                    }}
                  >
                    {sv.ho_ten}
                  </td>

                  <td style={tdCenterLarge}>
                    {sv.lop}
                  </td>

                  <td style={tdCenterLarge}>
                    {sv.mssv}
                  </td>

                 <td style={tdCenterLarge}>
  {(() => {
    const status = sv.trang_thai || "chua_danh_gia";

    const statusMap: Record<
      string,
      { label: string; background: string; color: string }
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

    const current = statusMap[status] || statusMap.chua_danh_gia;

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "7px 13px",
          borderRadius: "999px",
          background: current.background,
          color: current.color,
          fontSize: "14px",
          fontWeight: 650,
          whiteSpace: "nowrap",
        }}
      >
        {current.label}
      </span>
    );
  })()}
</td>

<td style={tdCenterLarge}>
  <span
    style={{
      color: sv.nguoi_duyet_id ? "#15803d" : "#64748b",
      fontSize: "15px",
      fontWeight: 600,
      whiteSpace: "normal",
    }}
  >
    {sv.nguoi_duyet_id
      ? approvers[sv.nguoi_duyet_id] || "Đang tải..."
      : "Chưa có"}
  </span>
</td>

                  <td style={tdCenterLarge}>
                    <button
                      type="button"
                      onClick={async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select("ghi_chu")
    .eq("id", sv.id)
    .single();

  if (error) {
    console.error("Lỗi lấy ghi chú:", error);
    return;
  }

  setSelectedStudent({
    ...sv,
    ghi_chu: data?.ghi_chu || "",
  });
}}
                      style={{
                        border: "1px solid #2563eb",
                        background: "#fff",
                        color: "#2563eb",
                        padding: "9px 14px",
                        borderRadius: "9px",
                        fontSize: "14px",
                        fontWeight: 650,
                        cursor: "pointer",
                      }}
                    >
                      Xem ghi chú
                    </button>
                  </td>

                  <td style={tdCenterLarge}>
                    <button
                      type="button"
                      onClick={() =>
                        (window.location.href =
                          `/bch/students/${sv.id}`)
                      }
                      style={{
                        border: "none",
                        background: "#2563eb",
                        color: "#fff",
                        padding: "9px 16px",
                        borderRadius: "9px",
                        fontSize: "14px",
                        fontWeight: 650,
                        cursor: "pointer",
                      }}
                    >
                      Xét hồ sơ
                    </button>
                  </td>
                </tr>
              ))}

              {filteredStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: "70px 20px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "40px",
                        marginBottom: "12px",
                      }}
                    >
                      📂
                    </div>

                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 650,
                        color: "#334155",
                      }}
                    >
                      {studentSearch ? "Không tìm thấy hồ sơ phù hợp" : "Chưa có hồ sơ"}
                    </div>

                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "14px",
                        color: "#94a3b8",
                      }}
                    >
                      {studentSearch || statusFilter !== "all"
                        ? "Thử tìm theo tên, lớp, MSSV, ngành hoặc thay đổi trạng thái lọc."
                        : "Chưa có sinh viên nào nộp hồ sơ."}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>

    {/* MODAL LỊCH SỬ */}
    {selectedStudent && (
      <div
        onClick={() => setSelectedStudent(null)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,23,42,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          zIndex: 9999,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: "620px",
            background: "#fff",
            borderRadius: "18px",
            padding: "28px",
            boxSizing: "border-box",
            boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "22px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "21px",
                  fontWeight: 750,
                  color: "#0f172a",
                }}
              >
                Ghi chú 
              </h2>

              <div
                style={{
                  marginTop: "6px",
                  fontSize: "14px",
                  color: "#64748b",
                }}
              >
                {selectedStudent.ho_ten} ·{" "}
                {selectedStudent.mssv}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedStudent(null)}
              style={{
                width: "36px",
                height: "36px",
                border: "none",
                borderRadius: "9px",
                background: "#f1f5f9",
                color: "#475569",
                fontSize: "23px",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>

<div
  style={{
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "18px",
    background: "#f8fafc",
  }}
>
  <div
    style={{
      fontSize: "15px",
      fontWeight: 650,
      color: "#334155",
      marginBottom: "7px",
    }}
  >
    Ghi chú
  </div>

  <div
    style={{
      fontSize: "14px",
      color: "#64748b",
      lineHeight: 1.5,
      whiteSpace: "pre-wrap",
    }}
  >
    {selectedStudent.ghi_chu || "Chưa có ghi chú"}
  </div>
</div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "22px",
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedStudent(null)}
              style={{
                padding: "10px 20px",
                borderRadius: "9px",
                border: "1px solid #cbd5e1",
                background: "#fff",
                color: "#334155",
                fontSize: "14px",
                fontWeight: 650,
                cursor: "pointer",
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    )}
    {showCriteria && (
      <CriteriaModal
        onClose={() => setShowCriteria(false)}
      />
    )}
    <Footer />
  </div>
);
}

const thCenter = {
  padding: "16px 18px",
  textAlign: "center" as const,
  whiteSpace: "nowrap" as const,
  fontSize: "14px",
  fontWeight: 750,
  color: "#334155",
};

const thLeft = {
  padding: "16px 18px",
  textAlign: "left" as const,
  whiteSpace: "nowrap" as const,
  fontSize: "14px",
  fontWeight: 750,
  color: "#334155",
};

const tdCenterLarge = {
  padding: "18px",
  textAlign: "center" as const,
  color: "#475569",
  fontSize: "15px",
};