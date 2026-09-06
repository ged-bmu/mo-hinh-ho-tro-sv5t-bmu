"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Spinner from "../../components/Spinner";
import Header from "../../components/Header";
import CriteriaModal from "../../components/CriteriaModal";
import Footer from "../../components/Footer";
import SidebarChutichhsv from "../sidebarchutichhsv/page";

export default function ThongKeNamSinhPage() {
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
  // NĂM HỌC HIỆN TẠI
  //
  // Năm học 2026 - 2027
  //
  // Khóa 26 -> năm 1
  // Khóa 25 -> năm 2
  // Khóa 24 -> năm 3
  // Khóa 23 -> năm 4
  // Khóa 22 -> năm 5
  // Khóa 21 -> năm 6
  //
  // =========================================================

  const currentYear = 2026;

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
      // LẤY TẤT CẢ SINH VIÊN
      // =====================================================

const {
  data: studentData,
  error: studentError,
} = await supabase
  .from("profiles")
  .select("id, ho_ten, mssv, lop, role, is_submitted")
  .eq("role", "student")
  .eq("is_submitted", true)
  .order("lop", { ascending: true })
  .order("mssv", { ascending: true });

      if (studentError) {
        console.error(
          "Lỗi tải danh sách sinh viên:",
          studentError
        );

        setStudents([]);
      } else {
        setStudents(studentData || []);
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
  // XÁC ĐỊNH KHÓA TỪ TÊN LỚP
  //
  // KHÓA MỚI:
  //
  // YK25...
  // DH25...
  // ĐD25...
  // DDA25...
  // YC25...
  // YTA25...
  //
  // KHÓA CŨ:
  //
  // 21YA...
  // 22DA...
  // 22DDA...
  // 22YTA...
  //
  // =========================================================

  const getCourse = (lop: string) => {
    const value = (lop || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");

    // -------------------------------------------------------
    // KHÓA MỚI
    // -------------------------------------------------------
    //
    // Ví dụ:
    // YK25
    // DH25
    // ĐD25
    // DDA25
    // YC25
    // YTA25
    //
    const newCourseMatch = value.match(
      /^(?:YTA|DDA|YK|DH|ĐD|DD|YC)(\d{2})/
    );

    if (newCourseMatch) {
      return Number(
        newCourseMatch[1]
      );
    }

    // -------------------------------------------------------
    // KHÓA CŨ
    // -------------------------------------------------------
    //
    // Ví dụ:
    // 21YA
    // 22DA
    // 22DDA
    // 22YTA
    //
    const oldCourseMatch = value.match(
      /^(\d{2})(?:DDA|YTA|YA|DA)/
    );

    if (oldCourseMatch) {
      return Number(
        oldCourseMatch[1]
      );
    }

    return null;
  };

  // =========================================================
  // XÁC ĐỊNH NGÀNH
  // =========================================================

  const getMajor = (lop: string) => {
    const value = (lop || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");

    // -------------------------------------------------------
    // KHÓA MỚI
    // -------------------------------------------------------

    // Y khoa
    if (
      value.startsWith("YK")
    ) {
      return "Y khoa";
    }

    // Dược
    if (
      value.startsWith("DH")
    ) {
      return "Dược học";
    }

    // Điều dưỡng
    // Kiểm tra DDA trước DD
    if (
      value.startsWith("DDA") ||
      value.startsWith("ĐD") ||
      value.startsWith("DD")
    ) {
      return "Điều dưỡng";
    }

    // Y tế công cộng
    if (
      value.startsWith("YC") ||
      value.startsWith("YTA")
    ) {
      return "Y tế công cộng";
    }

    // -------------------------------------------------------
    // KHÓA CŨ
    // -------------------------------------------------------

    // Điều dưỡng
    if (
      /^\d{2}DDA/.test(value)
    ) {
      return "Điều dưỡng";
    }

    // Y tế công cộng
    if (
      /^\d{2}YTA/.test(value)
    ) {
      return "Y tế công cộng";
    }

    // Y khoa
    if (
      /^\d{2}YA/.test(value)
    ) {
      return "Y khoa";
    }

    // Dược
    if (
      /^\d{2}DA/.test(value)
    ) {
      return "Dược học";
    }

    return "Khác";
  };

  // =========================================================
  // XÁC ĐỊNH SINH VIÊN ĐANG HỌC NĂM MẤY
  //
  // Thời gian đào tạo:
  //
  // Y khoa          : 6 năm
  // Dược học        : 5 năm
  // Điều dưỡng      : 4 năm
  // Y tế công cộng  : 4 năm
  //
  // =========================================================

  const getStudyYear = (lop: string) => {
    const course = getCourse(lop);
    const major = getMajor(lop);

    if (
      course === null ||
      major === "Khác"
    ) {
      return null;
    }

    const studyYear =
      currentYear -
      2000 -
      course +
      1;

    if (studyYear < 1) {
      return null;
    }

    // Y khoa 6 năm
    if (major === "Y khoa") {
      return studyYear <= 6
        ? studyYear
        : null;
    }

    // Dược 5 năm
    if (major === "Dược học") {
      return studyYear <= 5
        ? studyYear
        : null;
    }

    // Điều dưỡng 4 năm
    if (major === "Điều dưỡng") {
      return studyYear <= 4
        ? studyYear
        : null;
    }

    // Y tế công cộng 4 năm
    if (
      major ===
      "Y tế công cộng"
    ) {
      return studyYear <= 4
        ? studyYear
        : null;
    }

    return null;
  };

  // =========================================================
  // LẤY DANH SÁCH KHÓA
  // =========================================================

  const courseNumbers = Array.from(
    new Set(
      students
        .map((sv) =>
          getCourse(sv.lop)
        )
        .filter(
          (course): course is number =>
            course !== null
        )
    )
  ).sort((a, b) => b - a);

  // =========================================================
  // THỐNG KÊ THEO KHÓA
  // =========================================================

  const courseStats =
    courseNumbers.map(
      (course) => {
        const list =
          students.filter(
            (sv) =>
              getCourse(
                sv.lop
              ) === course
          );

        return {
          course,
          list,
        };
      }
    );

  // =========================================================
  // THỐNG KÊ THEO NĂM HỌC
  // =========================================================

  const yearStats = [
    {
      year: 1,
      label: "Năm 1",
      list: students.filter(
        (sv) =>
          getStudyYear(
            sv.lop
          ) === 1
      ),
    },
    {
      year: 2,
      label: "Năm 2",
      list: students.filter(
        (sv) =>
          getStudyYear(
            sv.lop
          ) === 2
      ),
    },
    {
      year: 3,
      label: "Năm 3",
      list: students.filter(
        (sv) =>
          getStudyYear(
            sv.lop
          ) === 3
      ),
    },
    {
      year: 4,
      label: "Năm 4",
      list: students.filter(
        (sv) =>
          getStudyYear(
            sv.lop
          ) === 4
      ),
    },
    {
      year: 5,
      label: "Năm 5",
      list: students.filter(
        (sv) =>
          getStudyYear(
            sv.lop
          ) === 5
      ),
    },
    {
      year: 6,
      label: "Năm 6",
      list: students.filter(
        (sv) =>
          getStudyYear(
            sv.lop
          ) === 6
      ),
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
  // TÌM KIẾM TRONG DANH SÁCH
  // =========================================================

  const sortedStudents = [
    ...selectedStudents,
  ]
    .filter((sv) => {
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

      return (
        a.mssv || ""
      ).localeCompare(
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
              justifyContent:
                "center",
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
      {/* HEADER */}

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

      {/* SIDEBAR + CONTENT */}

      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          width: "100%",
          minHeight:
            "calc(100vh - 90px)",
        }}
      >
        <SidebarChutichhsv />

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
              {/* TRANG CHỦ */}

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

              {/* TIÊU ĐỀ */}

              <div
                style={{
                  background:
                    "linear-gradient(135deg, #1d4ed8, #2563eb)",
                  borderRadius:
                    "20px",
                  padding:
                    "20px 24px",
                  color: "#fff",
                  marginBottom:
                    "25px",
                  boxShadow:
                    "0 8px 25px rgba(37, 99, 235, 0.18)",
                }}
              >
                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "space-between",
                    gap: "10px",
                    flexWrap:
                      "wrap",
                  }}
                >
                  <div>
                    <h1
                      style={{
                        margin: 0,
                        fontSize:
                          "24px",
                        fontWeight:
                          700,
                      }}
                    >
                      Thống kê sinh viên
                      theo khóa
                    </h1>

                    <p
                      style={{
                        margin:
                          "6px 0 0",
                        fontSize:
                          "13px",
                        opacity: 0.9,
                      }}
                    >
                      Năm học{" "}
                      {currentYear} -{" "}
                      {currentYear +
                        1}
                    </p>
                  </div>

                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius:
                        "18px",
                      background:
                        "rgba(255,255,255,0.15)",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      fontSize:
                        "30px",
                      border:
                        "1px solid rgba(255,255,255,0.2)",
                      flexShrink: 0,
                    }}
                  >
                    🎓
                  </div>
                </div>
              </div>

              {/* =================================================
                  THỐNG KÊ THEO KHÓA
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
                🎓{" "}
                <b>
                  Số lượng sinh viên theo khóa
                </b>
              </h2>

              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(4, minmax(0, 1fr))",
                  gap: "12px",
                  marginBottom:
                    "25px",
                }}
              >
{courseStats.map((item) => {
  const yKhoaList = item.list.filter(
    (sv) => getMajor(sv.lop) === "Y khoa"
  );

  const duocList = item.list.filter(
    (sv) => getMajor(sv.lop) === "Dược học"
  );

  const dieuDuongList = item.list.filter(
    (sv) => getMajor(sv.lop) === "Điều dưỡng"
  );

  const ytccList = item.list.filter(
    (sv) => getMajor(sv.lop) === "Y tế công cộng"
  );

  return (
    <div
      key={item.course}
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "13px 15px",
        boxShadow:
          "0 2px 6px rgba(15,23,42,0.04)",
      }}
    >
      {/* KHÓA */}
      <div
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "#475569",
          marginBottom: "4px",
        }}
      >
        Khóa {item.course}
      </div>

      {/* TỔNG SINH VIÊN */}
      <div
        onClick={() => {
          if (item.list.length > 0) {
            showStudents(
              `Khóa ${item.course} - Danh sách sinh viên`,
              item.list
            );
          }
        }}
        style={{
          fontSize: "26px",
          lineHeight: 1.1,
          fontWeight: 700,
          color: "#2563eb",
          cursor:
            item.list.length > 0
              ? "pointer"
              : "default",
          marginBottom: "8px",
        }}
      >
        {item.list.length}

        <span
          style={{
            marginLeft: "5px",
            fontSize: "12px",
            fontWeight: 500,
            color: "#64748b",
          }}
        >
          sinh viên
        </span>
      </div>

      {/* THỐNG KÊ THEO NGÀNH */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "5px 8px",
          fontSize: "11px",
          color: "#64748b",
          lineHeight: 1.7,
        }}
      >
        {/* Y KHOA */}
        <span
          onClick={() => {
            if (yKhoaList.length > 0) {
              showStudents(
                `Khóa ${item.course} - Y khoa`,
                yKhoaList
              );
            }
          }}
          style={{
            cursor:
              yKhoaList.length > 0
                ? "pointer"
                : "default",
            color:
              yKhoaList.length > 0
                ? "#2563eb"
                : "#64748b",
            fontWeight:
              yKhoaList.length > 0
                ? 600
                : 400,
          }}
        >
          Y khoa: {yKhoaList.length}
        </span>

        <span style={{ color: "#cbd5e1" }}>
          ·
        </span>

        {/* DƯỢC */}
        <span
          onClick={() => {
            if (duocList.length > 0) {
              showStudents(
                `Khóa ${item.course} - Dược học`,
                duocList
              );
            }
          }}
          style={{
            cursor:
              duocList.length > 0
                ? "pointer"
                : "default",
            color:
              duocList.length > 0
                ? "#2563eb"
                : "#64748b",
            fontWeight:
              duocList.length > 0
                ? 600
                : 400,
          }}
        >
          Dược: {duocList.length}
        </span>

        <span style={{ color: "#cbd5e1" }}>
          ·
        </span>

        {/* ĐIỀU DƯỠNG */}
        <span
          onClick={() => {
            if (dieuDuongList.length > 0) {
              showStudents(
                `Khóa ${item.course} - Điều dưỡng`,
                dieuDuongList
              );
            }
          }}
          style={{
            cursor:
              dieuDuongList.length > 0
                ? "pointer"
                : "default",
            color:
              dieuDuongList.length > 0
                ? "#2563eb"
                : "#64748b",
            fontWeight:
              dieuDuongList.length > 0
                ? 600
                : 400,
          }}
        >
          Điều dưỡng: {dieuDuongList.length}
        </span>

        <span style={{ color: "#cbd5e1" }}>
          ·
        </span>

        {/* Y TẾ CÔNG CỘNG */}
        <span
          onClick={() => {
            if (ytccList.length > 0) {
              showStudents(
                `Khóa ${item.course} - Y tế công cộng`,
                ytccList
              );
            }
          }}
          style={{
            cursor:
              ytccList.length > 0
                ? "pointer"
                : "default",
            color:
              ytccList.length > 0
                ? "#2563eb"
                : "#64748b",
            fontWeight:
              ytccList.length > 0
                ? 600
                : 400,
          }}
        >
          YTCC: {ytccList.length}
        </span>
      </div>
    </div>
  );
})}
              </div>

              {/* =================================================
                  TỔNG
              ================================================= */}

              <div
                style={{
                  background:
                    "#fff",
                  border:
                    "1px solid #e2e8f0",
                  borderRadius:
                    "13px",
                  padding:
                    "17px 20px",
                  boxShadow:
                    "0 2px 8px rgba(15,23,42,0.04)",
                  marginBottom:
                    "22px",
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
                    gap: "10px",
                    flexWrap:
                      "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        "14px",
                      fontWeight:
                        600,
                      color:
                        "#475569",
                    }}
                  >
                    Tổng số sinh viên
                  </span>

                  <strong
                    style={{
                      fontSize:
                        "20px",
                      color:
                        "#2563eb",
                    }}
                  >
                    {
                      students.length
                    }
                  </strong>
                </div>
              </div>

              {/* =================================================
                  DANH SÁCH SINH VIÊN
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
                  {/* HEADER */}

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
                          {
                            selectedTitle
                          }
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
                          sinh viên
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
                      overflowX:
                        "auto",
                    }}
                  >
                    <table
                      style={{
                        width:
                          "100%",
                        borderCollapse:
                          "collapse",
                        minWidth:
                          "700px",
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
                              width:
                                "55px",
                              padding:
                                "12px 10px",
                              textAlign:
                                "center",
                              fontSize:
                                "14px",
                              fontWeight:
                                600,
                              color:
                                "#1e3a8a",
                            }}
                          >
                            STT
                          </th>

                          <th
                            style={{
                              padding:
                                "12px 14px",
                              textAlign:
                                "left",
                              fontSize:
                                "14px",
                              fontWeight:
                                600,
                              color:
                                "#1e3a8a",
                            }}
                          >
                            Họ tên
                          </th>

                          <th
                            style={{
                              padding:
                                "12px 14px",
                              textAlign:
                                "center",
                              fontSize:
                                "14px",
                              fontWeight:
                                600,
                              color:
                                "#1e3a8a",
                            }}
                          >
                            Lớp
                          </th>

                          <th
                            style={{
                              padding:
                                "12px 14px",
                              textAlign:
                                "center",
                              fontSize:
                                "14px",
                              fontWeight:
                                600,
                              color:
                                "#1e3a8a",
                            }}
                          >
                            MSSV
                          </th>

                          <th
                            style={{
                              padding:
                                "12px 14px",
                              textAlign:
                                "center",
                              fontSize:
                                "14px",
                              fontWeight:
                                600,
                              color:
                                "#1e3a8a",
                            }}
                          >
                            Ngành
                          </th>

                          <th
                            style={{
                              padding:
                                "12px 14px",
                              textAlign:
                                "center",
                              fontSize:
                                "14px",
                              fontWeight:
                                600,
                              color:
                                "#1e3a8a",
                            }}
                          >
                            Năm học
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {sortedStudents.map(
                          (
                            sv,
                            index
                          ) => (
                            <tr
                              key={
                                sv.id
                              }
                              style={{
                                borderTop:
                                  "1px solid #e2e8f0",
                              }}
                            >
                              <td
                                style={{
                                  padding:
                                    "12px 10px",
                                  textAlign:
                                    "center",
                                  fontSize:
                                    "16px",
                                  color:
                                    "#64748b",
                                }}
                              >
                                {index +
                                  1}
                              </td>

                              <td
                                style={{
                                  padding:
                                    "12px 14px",
                                  fontSize:
                                    "16px",
                                  fontWeight:
                                    600,
                                  color:
                                    "#0f172a",
                                }}
                              >
                                {
                                  sv.ho_ten
                                }
                              </td>

                              <td
                                style={{
                                  padding:
                                    "12px 14px",
                                  textAlign:
                                    "center",
                                  fontSize:
                                    "16px",
                                  color:
                                    "#475569",
                                }}
                              >
                                {sv.lop ||
                                  "—"}
                              </td>

                              <td
                                style={{
                                  padding:
                                    "12px 14px",
                                  textAlign:
                                    "center",
                                  fontSize:
                                    "16px",
                                  color:
                                    "#475569",
                                }}
                              >
                                {sv.mssv ||
                                  "—"}
                              </td>

                              <td
                                style={{
                                  padding:
                                    "12px 14px",
                                  textAlign:
                                    "center",
                                  fontSize:
                                    "16px",
                                  color:
                                    "#475569",
                                }}
                              >
                                {getMajor(
                                  sv.lop
                                )}
                              </td>

                              <td
                                style={{
                                  padding:
                                    "12px 14px",
                                  textAlign:
                                    "center",
                                  fontSize:
                                    "16px",
                                  color:
                                    "#475569",
                                }}
                              >
                                {getStudyYear(
                                  sv.lop
                                )
                                  ? `Năm ${getStudyYear(
                                      sv.lop
                                    )}`
                                  : "—"}
                              </td>
                            </tr>
                          )
                        )}
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

              {/* KHÔNG CÓ SINH VIÊN */}

              {students.length ===
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
                  Chưa có sinh viên
                  nào.
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