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
  const [tab, setTab] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);

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

      // Kiểm tra quyền Chủ tịch HSV
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
      const keyword =
        studentSearch
          .trim()
          .toLowerCase();

      if (!keyword) return true;

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
                  background: "#fff",
                  border:
                    "1px solid #e2e8f0",
                  borderRadius:
                    "14px",
                  padding:
                    "20px 22px",
                  marginBottom:
                    "18px",
                  boxShadow:
                    "0 2px 8px rgba(15,23,42,0.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    gap: "15px",
                    flexWrap:
                      "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize:
                          "12px",
                        color:
                          "#64748b",
                        marginBottom:
                          "5px",
                      }}
                    >
                      Chủ tịch Hội Sinh
                      viên Trường
                    </div>

                    <h1
                      style={{
                        margin: 0,
                        fontSize:
                          "22px",
                        fontWeight: 700,
                        color:
                          "#0f172a",
                      }}
                    >
                      📊 Thống kê hồ sơ
                      Sinh viên 5 tốt
                    </h1>

                    <p
                      style={{
                        margin:
                          "6px 0 0",
                        color:
                          "#64748b",
                        fontSize:
                          "13px",
                      }}
                    >
                      Chỉ thống kê các hồ
                      sơ đã nộp
                    </p>
                  </div>

                  {/* TỔNG ĐÃ NỘP */}

                  <div
                    style={{
                      background:
                        "#dbeafe",
                      color:
                        "#1e40af",
                      padding:
                        "10px 16px",
                      borderRadius:
                        "10px",
                      textAlign:
                        "center",
                      minWidth:
                        "125px",
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          "12px",
                        marginBottom:
                          "3px",
                      }}
                    >
                      Hồ sơ đã nộp
                    </div>

                    <div
                      style={{
                        fontSize:
                          "25px",
                        fontWeight: 700,
                      }}
                    >
                      {totalSubmitted}
                    </div>
                  </div>
                </div>
              </div>
{/* =================================================
    THỐNG KÊ THEO NGÀNH
================================================= */}

<h2
  style={{
    margin: "0 0 12px",
    fontSize: "16px",
    color: "#0f172a",
  }}
>
  🎓{" "}
  <b>Thống kê hồ sơ đã nộp theo ngành</b>
</h2>

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
        {/* TÊN NGÀNH */}
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

        {/* TỔNG SỐ */}
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

        {/* ĐẠT / CHƯA ĐẠT */}
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

        {/* TỶ LỆ TRÊN TỔNG */}
        <div
          style={{
            fontSize: "11px",
            color: "#64748b",
          }}
        >
          {percent}% tổng hồ sơ
        </div>

        {/* THANH TỶ LỆ ĐẠT */}
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
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: "8px",
                        }}
                      >
                        <input
                          placeholder="🔍 Tìm MSSV, họ tên, lớp..."
                          value={
                            studentSearch
                          }
                          onChange={(
                            e
                          ) =>
                            setStudentSearch(
                              e.target
                                .value
                            )
                          }
                          style={{
                            width:
                              "280px",
                            maxWidth:
                              "100%",
                            padding:
                              "8px 10px",
                            border:
                              "1px solid #dbe2ea",
                            borderRadius:
                              "8px",
                            outline:
                              "none",
                            fontSize:
                              "13px",
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudents(
                              []
                            );
                            setSelectedTitle(
                              ""
                            );
                            setStudentSearch(
                              ""
                            );
                          }}
                          style={{
                            padding:
                              "8px 12px",
                            border:
                              "1px solid #e2e8f0",
                            borderRadius:
                              "8px",
                            background:
                              "#f8fafc",
                            cursor:
                              "pointer",
                            color:
                              "#475569",
                            fontWeight:
                              600,
                            fontSize:
                              "13px",
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