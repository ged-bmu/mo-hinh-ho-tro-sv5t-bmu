"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Spinner from "../../components/Spinner";
import Header from "../../components/Header";
import CriteriaModal from "../../components/CriteriaModal";
import Footer from "../../components/Footer";
import SidebarChutichhsv from "../sidebarchutichhsv/page";

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterMajor, setFilterMajor] = useState("");
  const [tab, setTab] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);
  const [statsMode, setStatsMode] = useState<"major" | "course">("major");

  // =========================================================
  // KIỂM TRA TÀI KHOẢN + TẢI DỮ LIỆU
  // =========================================================

  useEffect(() => {
    checkAccount();
  }, []);

  async function checkAccount() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/introduce";
        return;
      }

      // Lấy thông tin người dùng
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

      // =====================================================
      // CHỈ LẤY HỒ SƠ ĐÃ NỘP
      // =====================================================

      const {
        data,
        error,
      } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "student")
        .eq("is_submitted", true)
        .order("lop", {
          ascending: true,
        })
        .order("mssv", {
          ascending: true,
        });

      if (error) {
        console.error(
          "Lỗi tải hồ sơ:",
          error
        );

        setStudents([]);
      } else {
        setStudents(data || []);
      }
    } catch (error) {
      console.error(
        "Lỗi kiểm tra tài khoản:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // XÁC ĐỊNH NGÀNH TỪ LỚP
  //
  // Lớp cũ:
  // 22YA  -> Y khoa
  // 22DA  -> Dược học
  // 22ĐD  -> Điều dưỡng
  // 22YTA -> Y tế công cộng
  //
  // Lớp mới:
  // YK25  -> Y khoa
  // DH25  -> Dược học
  // DDA25 -> Điều dưỡng
  // YC25  -> Y tế công cộng
  // YTA25 -> Y tế công cộng
  // =========================================================

  const getMajor = (lop: string) => {
    const value = (lop || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");

    // -------------------------
    // Y KHOA
    // -------------------------

    if (
      value.includes("YA") ||
      value.startsWith("YK")
    ) {
      return "Y khoa";
    }


    // -------------------------
    // ĐIỀU DƯỠNG
    // -------------------------

    if (
      value.includes("ĐD") ||
      value.includes("DD") ||
      value.startsWith("DDA")
    ) {
      return "Điều dưỡng";
    }
     // -------------------------
    // DƯỢC HỌC
    // -------------------------

    if (
      value.includes("DA") ||
      value.startsWith("DH")
    ) {
      return "Dược học";
    }

    // -------------------------
    // Y TẾ CÔNG CỘNG
    // -------------------------

    if (
      value.startsWith("YTA") ||
      value.startsWith("YC")
    ) {
      return "Y tế công cộng";
    }

    return "Khác";
  };

  // =========================================================
  // KIỂM TRA TRẠNG THÁI THEO XÉT DUYỆT
  // Trạng thái 'da_dat' = Đạt
  // Trạng thái khác = Chưa đạt / Chưa đánh giá
  // =========================================================

  const isPassed = (sv: any) => {
    return (sv?.trang_thai || "chua_danh_gia") === "da_dat";
  };

  // =========================================================
  // TỔNG HỒ SƠ ĐÃ NỘP
  // =========================================================

  const totalSubmitted = students.length;

  // =========================================================
  // THỐNG KÊ THEO NGÀNH
  // =========================================================

  const majorStats = [
    {
      label: "Y khoa",
      list: students.filter(
        (sv) =>
          getMajor(sv.lop) === "Y khoa"
      ),
    },
    {
      label: "Dược học",
      list: students.filter(
        (sv) =>
          getMajor(sv.lop) === "Dược học"
      ),
    },
    {
      label: "Điều dưỡng",
      list: students.filter(
        (sv) =>
          getMajor(sv.lop) === "Điều dưỡng"
      ),
    },
    {
      label: "Y tế công cộng",
      list: students.filter(
        (sv) =>
          getMajor(sv.lop) ===
          "Y tế công cộng"
      ),
    },
  ];
// =========================================================
// THỐNG KÊ THEO KHÓA
// =========================================================

const getCourse = (lop: string) => {
  const value = (lop || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  // Lớp mới: YK25, DH25, DDA25, YC25, YTA25...
  const newCourseMatch = value.match(
    /^(?:YTA|DDA|YK|DH|ĐD|DD|YC)(\d{2})/
  );

  if (newCourseMatch) {
    return Number(newCourseMatch[1]);
  }

  // Lớp cũ: 21YA, 22DA, 22DDA, 22YTA...
  const oldCourseMatch = value.match(
    /^(\d{2})(?:DDA|YTA|YA|DA)/
  );

  if (oldCourseMatch) {
    return Number(oldCourseMatch[1]);
  }

  return null;
};

const courseNumbers = Array.from(
  new Set(
    students
      .map((sv) => getCourse(sv.lop))
      .filter((course): course is number => course !== null)
  )
).sort((a, b) => b - a);

const courseStats = courseNumbers.map((course) => {
  const list = students.filter(
    (sv) => getCourse(sv.lop) === course
  );

  const passed = list.filter((sv) => isPassed(sv));
  const failed = list.filter((sv) => !isPassed(sv));

  return {
    course,
    list,
    passed,
    failed,
  };
});
  // =========================================================
  // THỐNG KÊ TRẠNG THÁI
  // =========================================================

  const passedStudents =
    students.filter((sv) =>
      isPassed(sv)
    );

  const failedStudents =
    students.filter(
      (sv) => !isPassed(sv)
    );

  const statusStats = [
    {
      label: "Đạt",
      list: passedStudents,
    },
    {
      label: "Chưa đạt",
      list: failedStudents,
    },
  ];

  // =========================================================
  // HIỂN THỊ DANH SÁCH
  // =========================================================

  const showStudents = (
    title: string,
    list: any[]
  ) => {
    setSelectedTitle(title);
    setSelectedStudents(list);
    setStudentSearch("");
  };

  // =========================================================
  // DANH SÁCH SAU KHI TÌM KIẾM
  // =========================================================

  const sortedStudents = [
  ...selectedStudents,
]
  .filter((sv) => {
    // LỌC THEO KHÓA
    if (
      filterCourse &&
      String(getCourse(sv.lop)) !== filterCourse
    ) {
      return false;
    }

    // LỌC THEO NGÀNH
    if (
      filterMajor &&
      getMajor(sv.lop) !== filterMajor
    ) {
      return false;
    }

    // TÌM KIẾM
    const keyword =
      studentSearch
        .trim()
        .toLowerCase();

    if (!keyword) {
      return true;
    }

    return (
      (sv.ho_ten || "")
        .toLowerCase()
        .includes(keyword) ||
      (sv.mssv || "")
        .toLowerCase()
        .includes(keyword) ||
      (sv.lop || "")
        .toLowerCase()
        .includes(keyword)
    );
  })
    .sort((a, b) => {
      const lopCompare =
        (a.lop || "").localeCompare(
          b.lop || "",
          undefined,
          {
            numeric: true,
          }
        );

      if (lopCompare !== 0) {
        return lopCompare;
      }

      return (a.mssv || "").localeCompare(
        b.mssv || "",
        undefined,
        {
          numeric: true,
        }
      );
    });

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
        }}
      >
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

        <div
          style={{
            display: "flex",
            minHeight:
              "calc(100vh - 90px)",
          }}
        >
          <SidebarChutichhsv />

          <main
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Spinner size={32} />
          </main>
        </div>

        <Footer />

        {showCriteria && (
          <CriteriaModal
            onClose={() =>
              setShowCriteria(false)
            }
          />
        )}
      </div>
    );
  }

  // =========================================================
  // GIAO DIỆN
  // =========================================================

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
          }}
        >
          <div
            style={{
              padding: "22px",
            }}
          >
            <div
              style={{
                maxWidth: "1200px",
                margin: "0 auto",
              }}
            >
              {/* =================================================
                  NÚT TRANG CHỦ
              ================================================= */}

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
                  gap: "7px",
                  border:
                    "1px solid #e2e8f0",
                  background: "#fff",
                  padding:
                    "8px 13px",
                  color: "#334155",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  marginBottom:
                    "16px",
                  borderRadius:
                    "9px",
                  boxShadow:
                    "0 2px 6px rgba(15,23,42,0.05)",
                }}
              >
                <span
                  style={{
                    fontSize: "16px",
                  }}
                >
                  ←
                </span>

                Trang chủ
              </button>

              {/* =================================================
                  TIÊU ĐỀ
              ================================================= */}

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
      <h1
        style={{
          margin: 0,
          fontSize: "24px",
          fontWeight: 700,
        }}
      >
        Thống kê hồ sơ Sinh viên 5 tốt
      </h1>

      <p
        style={{
          margin: "6px 0 0",
          fontSize: "13px",
          opacity: 0.9,
        }}
      >
        Chỉ thống kê các hồ sơ đã nộp
      </p>
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
      📊
    </div>
  </div>
</div>

{/* =================================================
    THỐNG KÊ NGÀNH / KHÓA
================================================= */}

<div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "12px",
  }}
>
  <h2
    style={{
      margin: 0,
      fontSize: "16px",
      color: "#0f172a",
    }}
  >
    {statsMode === "major" ? "🎓" : "📚"}{" "}
    <b>
      {statsMode === "major"
        ? "Thống kê hồ sơ đã nộp theo ngành"
        : "Thống kê hồ sơ đã nộp theo khóa"}
    </b>
  </h2>

  {/* NÚT CHUYỂN */}
<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px",
    background: "#fff",
    border: "1px solid #dbe2ea",
    borderRadius: "11px",
    boxShadow: "0 2px 6px rgba(15,23,42,0.06)",
  }}
>
  {/* THEO NGÀNH */}
  <button
    type="button"
    onClick={() => setStatsMode("major")}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      minWidth: "112px",
      height: "36px",
      padding: "0 14px",
      border: "none",
      borderRadius: "8px",
      background:
        statsMode === "major"
          ? "#2563eb"
          : "transparent",
      color:
        statsMode === "major"
          ? "#fff"
          : "#475569",
      fontSize: "12px",
      fontWeight:
        statsMode === "major"
          ? 700
          : 600,
      cursor: "pointer",
      boxShadow:
        statsMode === "major"
          ? "0 2px 5px rgba(37,99,235,0.25)"
          : "none",
      transition: "all 0.2s ease",
    }}
  >
    <span style={{ fontSize: "15px" }}>
      🎓
    </span>

    <span>Thống kê ngành</span>
  </button>

  {/* THEO KHÓA */}
  <button
    type="button"
    onClick={() => setStatsMode("course")}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      minWidth: "112px",
      height: "36px",
      padding: "0 14px",
      border: "none",
      borderRadius: "8px",
      background:
        statsMode === "course"
          ? "#2563eb"
          : "transparent",
      color:
        statsMode === "course"
          ? "#fff"
          : "#475569",
      fontSize: "12px",
      fontWeight:
        statsMode === "course"
          ? 700
          : 600,
      cursor: "pointer",
      boxShadow:
        statsMode === "course"
          ? "0 2px 5px rgba(37,99,235,0.25)"
          : "none",
      transition: "all 0.2s ease",
    }}
  >
    <span style={{ fontSize: "15px" }}>
      📚
    </span>

    <span>Thống kê khóa</span>
  </button>
</div>
</div>

{/* =================================================
    THỐNG KÊ THEO NGÀNH
================================================= */}

{statsMode === "major" && (
  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(4, minmax(0, 1fr))",
      gap: "12px",
      marginBottom: "22px",
    }}
  >
    {majorStats.map((item) => {
      const passed = item.list.filter((sv) =>
        isPassed(sv)
      );

      const failed = item.list.filter(
        (sv) => !isPassed(sv)
      );

      const total = item.list.length;

      const percent =
        totalSubmitted === 0
          ? 0
          : Math.round(
              (total / totalSubmitted) * 100
            );

      const passedPercent =
        total === 0
          ? 0
          : Math.round(
              (passed.length / total) * 100
            );

      return (
        <div
          key={item.label}
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "13px 15px",
            boxShadow:
              "0 2px 6px rgba(15,23,42,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#475569",
              marginBottom: "4px",
            }}
          >
            {item.label}
          </div>

          <div
            onClick={() =>
              showStudents(
                `${item.label} - Hồ sơ đã nộp`,
                item.list
              )
            }
            style={{
              fontSize: "26px",
              lineHeight: 1.1,
              fontWeight: 700,
              color: "#2563eb",
              cursor:
                total > 0
                  ? "pointer"
                  : "default",
              marginBottom: "7px",
            }}
          >
            {total}
            <span
              style={{
                marginLeft: "5px",
                fontSize: "12px",
                fontWeight: 500,
                color: "#64748b",
              }}
            >
              hồ sơ
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              marginBottom: "7px",
            }}
          >
            <span
              onClick={() =>
                passed.length > 0 &&
                showStudents(
                  `${item.label} - Hồ sơ đạt`,
                  passed
                )
              }
              style={{
                color: "#15803d",
                fontWeight: 600,
                cursor:
                  passed.length > 0
                    ? "pointer"
                    : "default",
              }}
            >
              {passed.length} Đạt
            </span>

            <span
              style={{
                color: "#cbd5e1",
              }}
            >
              |
            </span>

            <span
              onClick={() =>
                failed.length > 0 &&
                showStudents(
                  `${item.label} - Hồ sơ chưa đạt`,
                  failed
                )
              }
              style={{
                color: "#dc2626",
                fontWeight: 600,
                cursor:
                  failed.length > 0
                    ? "pointer"
                    : "default",
              }}
            >
              {failed.length} Chưa đạt
            </span>
          </div>

          <div
            style={{
              fontSize: "11px",
              color: "#64748b",
            }}
          >
            {percent}% tổng hồ sơ
          </div>

          {total > 0 && (
            <div
              style={{
                marginTop: "7px",
                height: "4px",
                background: "#e2e8f0",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${passedPercent}%`,
                  height: "100%",
                  background: "#22c55e",
                  borderRadius: "999px",
                }}
              />
            </div>
          )}
        </div>
      );
    })}
  </div>
)}

{/* =================================================
    THỐNG KÊ THEO KHÓA
================================================= */}

{statsMode === "course" && (
  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(190px, 1fr))",
      gap: "12px",
      marginBottom: "22px",
    }}
  >
    {courseStats.map((item) => {
      const total = item.list.length;

      const percent =
        totalSubmitted === 0
          ? 0
          : Math.round(
              (total / totalSubmitted) * 100
            );

      const passedPercent =
        total === 0
          ? 0
          : Math.round(
              (item.passed.length / total) * 100
            );

      return (
        <div
          key={item.course}
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "15px",
            boxShadow:
              "0 2px 6px rgba(15,23,42,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#475569",
              marginBottom: "5px",
            }}
          >
            Khóa {item.course}
          </div>

          <div
            onClick={() =>
              showStudents(
                `Khóa ${item.course} - Hồ sơ đã nộp`,
                item.list
              )
            }
            style={{
              fontSize: "28px",
              lineHeight: 1.1,
              fontWeight: 700,
              color: "#2563eb",
              cursor:
                total > 0
                  ? "pointer"
                  : "default",
              marginBottom: "7px",
            }}
          >
            {total}
            <span
              style={{
                marginLeft: "5px",
                fontSize: "12px",
                fontWeight: 500,
                color: "#64748b",
              }}
            >
              hồ sơ
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              marginBottom: "7px",
            }}
          >
            <span
              onClick={() =>
                item.passed.length > 0 &&
                showStudents(
                  `Khóa ${item.course} - Hồ sơ đạt`,
                  item.passed
                )
              }
              style={{
                color: "#15803d",
                fontWeight: 600,
                cursor:
                  item.passed.length > 0
                    ? "pointer"
                    : "default",
              }}
            >
              {item.passed.length} Đạt
            </span>

            <span
              style={{
                color: "#cbd5e1",
              }}
            >
              |
            </span>

            <span
              onClick={() =>
                item.failed.length > 0 &&
                showStudents(
                  `Khóa ${item.course} - Hồ sơ chưa đạt`,
                  item.failed
                )
              }
              style={{
                color: "#dc2626",
                fontWeight: 600,
                cursor:
                  item.failed.length > 0
                    ? "pointer"
                    : "default",
              }}
            >
              {item.failed.length} Chưa đạt
            </span>
          </div>

          <div
            style={{
              fontSize: "11px",
              color: "#64748b",
            }}
          >
            {percent}% tổng hồ sơ
          </div>

          {total > 0 && (
            <div
              style={{
                marginTop: "7px",
                height: "4px",
                background: "#e2e8f0",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${passedPercent}%`,
                  height: "100%",
                  background: "#22c55e",
                  borderRadius: "999px",
                }}
              />
            </div>
          )}
        </div>
      );
    })}
  </div>
)}

              {/* =================================================
                  THỐNG KÊ TRẠNG THÁI
              ================================================= */}

              <h2
                style={{
                  margin:
                    "0 0 12px",
                  fontSize:
                    "16px",
                  color:
                    "#0f172a",
                }}
              >
                📈{" "}
                <b>
                  Thống kê trạng thái
                  hồ sơ
                </b>
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: "14px",
                  marginBottom:
                    "22px",
                }}
              >
                {statusStats.map(
                  (item) => {
                    const percent =
                      totalSubmitted ===
                      0
                        ? 0
                        : Math.round(
                            (item.list
                              .length /
                              totalSubmitted) *
                              100
                          );

                    const passed =
                      item.label ===
                      "Đạt";

                    return (
                      <div
                        key={
                          item.label
                        }
                        style={{
                          background:
                            "#fff",
                          border:
                            "1px solid #e2e8f0",
                          borderRadius:
                            "13px",
                          padding:
                            "17px",
                          boxShadow:
                            "0 2px 8px rgba(15,23,42,0.04)",
                        }}
                      >
                        <div
                          style={{
                            fontSize:
                              "13px",
                            fontWeight:
                              600,
                            color:
                              "#475569",
                            marginBottom:
                              "8px",
                          }}
                        >
                          {item.label}
                        </div>

                        <div
                          onClick={() =>
                            showStudents(
                              `${item.label} - Hồ sơ đã nộp`,
                              item.list
                            )
                          }
                          style={{
                            fontSize:
                              "28px",
                            lineHeight:
                              1.1,
                            fontWeight:
                              700,
                            cursor:
                              "pointer",
                            color:
                              passed
                                ? "#16a34a"
                                : "#dc2626",
                            marginBottom:
                              "5px",
                          }}
                        >
                          {item.list.length}
                        </div>

                        <div
                          style={{
                            fontSize:
                              "12px",
                            color:
                              "#64748b",
                          }}
                        >
                          {percent}% tổng
                          hồ sơ đã nộp
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {/* =================================================
                  DANH SÁCH KHI BẤM VÀO SỐ
              ================================================= */}

              {selectedStudents.length >
                0 && (
                <div
                  style={{
                    background:
                      "#fff",
                    border:
                      "1px solid #e2e8f0",
                    borderRadius:
                      "14px",
                    marginTop:
                      "4px",
                    marginBottom:
                      "20px",
                    overflow:
                      "hidden",
                    boxShadow:
                      "0 2px 8px rgba(15,23,42,0.04)",
                  }}
                >
                  {/* HEADER DANH SÁCH */}

                  <div
                    style={{
                      padding:
                        "17px 20px",
                      borderBottom:
                        "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        gap: "12px",
                        flexWrap:
                          "wrap",
                      }}
                    >
                      <div>
                        <h2
                          style={{
                            margin: 0,
                            fontSize:
                              "17px",
                            fontWeight:
                              700,
                            color:
                              "#0f172a",
                          }}
                        >
                          {selectedTitle}
                        </h2>

                        <div
                          style={{
                            marginTop:
                              "4px",
                            fontSize:
                              "12px",
                            color:
                              "#64748b",
                          }}
                        >
                          Có{" "}
                          <strong
                            style={{
                              color:
                                "#2563eb",
                            }}
                          >
                            {
                              selectedStudents.length
                            }
                          </strong>{" "}
                          hồ sơ
                        </div>
                      </div>
<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  }}
>
  {/* BỘ LỌC KHÓA */}
  <select
    value={filterCourse}
    onChange={(e) =>
      setFilterCourse(e.target.value)
    }
    style={{
      width: "130px",
      padding: "8px 10px",
      border: "1px solid #dbe2ea",
      borderRadius: "8px",
      outline: "none",
      fontSize: "13px",
      background: "#fff",
      color: "#334155",
      cursor: "pointer",
    }}
  >
    <option value="">Tất cả khóa</option>

    {courseNumbers.map((course) => (
      <option
        key={course}
        value={String(course)}
      >
        Khóa {course}
      </option>
    ))}
  </select>

  {/* BỘ LỌC NGÀNH */}
  <select
    value={filterMajor}
    onChange={(e) =>
      setFilterMajor(e.target.value)
    }
    style={{
      width: "155px",
      padding: "8px 10px",
      border: "1px solid #dbe2ea",
      borderRadius: "8px",
      outline: "none",
      fontSize: "13px",
      background: "#fff",
      color: "#334155",
      cursor: "pointer",
    }}
  >
    <option value="">Tất cả ngành</option>
    <option value="Y khoa">
      Y khoa
    </option>
    <option value="Dược học">
      Dược học
    </option>
    <option value="Điều dưỡng">
      Điều dưỡng
    </option>
    <option value="Y tế công cộng">
      Y tế công cộng
    </option>
  </select>

  {/* TÌM KIẾM */}
  <input
    placeholder="🔍 Tìm MSSV, họ tên, lớp..."
    value={studentSearch}
    onChange={(e) =>
      setStudentSearch(e.target.value)
    }
    style={{
      width: "280px",
      maxWidth: "100%",
      padding: "8px 10px",
      border: "1px solid #dbe2ea",
      borderRadius: "8px",
      outline: "none",
      fontSize: "13px",
    }}
  />

  {/* ĐÓNG */}
  <button
    type="button"
    onClick={() => {
      setSelectedStudents([]);
      setSelectedTitle("");
      setStudentSearch("");
      setFilterCourse("");
      setFilterMajor("");
    }}
    style={{
      padding: "8px 12px",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      background: "#f8fafc",
      cursor: "pointer",
      color: "#475569",
      fontWeight: 600,
      fontSize: "13px",
    }}
  >
    Đóng
  </button>
</div>
                    </div>
                  </div>

{/* TABLE */}
<div
  style={{
    overflowX: "auto",
  }}
>
  <table
    style={{
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "700px",
    }}
  >
    <thead>
      <tr
        style={{
          background: "#dbeafe",
        }}
      >
        <th
          style={{
            width: "55px",
            padding: "12px 10px",
            textAlign: "center",
            fontSize: "14px",
            fontWeight: 600,
            color: "#1e3a8a",
          }}
        >
          STT
        </th>

        <th
          style={{
            padding: "12px 14px",
            textAlign: "left",
            fontSize: "14px",
            fontWeight: 600,
            color: "#1e3a8a",
          }}
        >
          Họ tên
        </th>

        <th
          style={{
            padding: "12px 14px",
            textAlign: "center",
            fontSize: "14px",
            fontWeight: 600,
            color: "#1e3a8a",
          }}
        >
          Lớp
        </th>

        <th
          style={{
            padding: "12px 14px",
            textAlign: "center",
            fontSize: "14px",
            fontWeight: 600,
            color: "#1e3a8a",
          }}
        >
          MSSV
        </th>

        <th
          style={{
            padding: "12px 14px",
            textAlign: "center",
            fontSize: "14px",
            fontWeight: 600,
            color: "#1e3a8a",
          }}
        >
          Ngành
        </th>

        <th
          style={{
            padding: "12px 14px",
            textAlign: "center",
            fontSize: "14px",
            fontWeight: 600,
            color: "#1e3a8a",
          }}
        >
          Trạng thái
        </th>
      </tr>
    </thead>

    <tbody>
      {sortedStudents.map((sv, index) => (
        <tr
          key={sv.id}
          style={{
            borderTop: "1px solid #e2e8f0",
          }}
        >
          {/* STT */}
          <td
            style={{
              padding: "12px 10px",
              textAlign: "center",
              fontSize: "16px",
              color: "#64748b",
            }}
          >
            {index + 1}
          </td>

          {/* HỌ TÊN */}
          <td
            style={{
              padding: "12px 14px",
              fontSize: "16px",
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            {sv.ho_ten}
          </td>

          {/* LỚP */}
          <td
            style={{
              padding: "12px 14px",
              textAlign: "center",
              fontSize: "16px",
              color: "#475569",
            }}
          >
            {sv.lop || "—"}
          </td>

          {/* MSSV */}
          <td
            style={{
              padding: "12px 14px",
              textAlign: "center",
              fontSize: "16px",
              color: "#475569",
            }}
          >
            {sv.mssv || "—"}
          </td>

          {/* NGÀNH */}
          <td
            style={{
              padding: "12px 14px",
              textAlign: "center",
              fontSize: "16px",
              color: "#475569",
            }}
          >
            {getMajor(sv.lop)}
          </td>

          {/* TRẠNG THÁI */}
          <td
            style={{
              padding: "12px 14px",
              textAlign: "center",
              fontSize: "16px",
            }}
          >
            {isPassed(sv) ? (
              <span
                style={{
                  display: "inline-block",
                  background: "#dcfce7",
                  color: "#166534",
                  padding: "6px 11px",
                  borderRadius: "999px",
                  fontWeight: 600,
                  fontSize: "13px",
                }}
              >
                Đạt
              </span>
            ) : (
              <span
                style={{
                  display: "inline-block",
                  background: "#fee2e2",
                  color: "#991b1b",
                  padding: "6px 11px",
                  borderRadius: "999px",
                  fontWeight: 600,
                  fontSize: "13px",
                }}
              >
                Chưa đạt
              </span>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

                  {/* KHÔNG TÌM THẤY */}

                  {sortedStudents.length ===
                    0 && (
                    <div
                      style={{
                        padding:
                          "30px",
                        textAlign:
                          "center",
                        color:
                          "#64748b",
                        fontSize:
                          "13px",
                      }}
                    >
                      Không tìm thấy
                      sinh viên.
                    </div>
                  )}
                </div>
              )}
              {totalSubmitted ===
                0 && (
                <div
                  style={{
                    background:
                      "#fff",
                    border:
                      "1px solid #e2e8f0",
                    borderRadius:
                      "14px",
                    padding:
                      "40px 20px",
                    textAlign:
                      "center",
                    color:
                      "#64748b",
                    fontSize:
                      "14px",
                    boxShadow:
                      "0 2px 8px rgba(15,23,42,0.04)",
                  }}
                >
                  Chưa có hồ sơ nào
                  được nộp.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
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