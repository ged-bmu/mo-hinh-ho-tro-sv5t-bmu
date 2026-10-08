"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { supabase } from "../../lib/supabase";
import Spinner from "../components/Spinner";
import Header from "../components/Header";
import CriteriaModal from "../components/CriteriaModal";
import Footer from "../components/Footer";

// =====================================================
// TYPES
// =====================================================

type BCHProfile = {
  id: string;
  ho_ten: string | null;
  email: string | null;
  roles: string[] | null;
};

type AcademicYear = {
  id: number;
  name: string;
  is_current: boolean;
  submission_open: boolean;
};

type YearProfile = {
  id: number;
  user_id: string;
  academic_year_id: number;
  is_submitted: boolean;
  submitted_at: string | null;
  trang_thai: string | null;
  ghi_chu: string | null;
  nguoi_duyet_id: string | null;
  created_at: string | null;
};

type StudentProfile = {
  id: string;
  ho_ten?: string | null;
  lop?: string | null;
  mssv?: string | null;
  nganh?: string | null;
  chuyen_nganh?: string | null;
  nganh_hoc?: string | null;

  [key: string]: unknown;
};

type Student = StudentProfile & {
  user_id: string;
  year_profile_id: number;
  academic_year_id: number;
  is_submitted: boolean;
  submitted_at: string | null;
  trang_thai: string;
  ghi_chu: string;
  nguoi_duyet_id: string | null;
  created_at: string | null;
};

type ApproverMap = Record<string, string>;

type StatusInfo = {
  label: string;
  background: string;
  color: string;
};

type StatusMap = Record<string, StatusInfo>;

// =====================================================
// COMPONENT
// =====================================================

export default function BCHPage() {
  const [loading, setLoading] = useState<boolean>(true);

  const [students, setStudents] = useState<Student[]>([]);

  const [academicYears, setAcademicYears] =
    useState<AcademicYear[]>([]);

  const [currentAcademicYear, setCurrentAcademicYear] =
    useState<AcademicYear | null>(null);

  const [tab, setTab] = useState<string>("");

  const [showCriteria, setShowCriteria] =
    useState<boolean>(false);

  const [approvers, setApprovers] =
    useState<ApproverMap>({});

  const [bchProfile, setBchProfile] =
    useState<BCHProfile | null>(null);

  const [studentSearch, setStudentSearch] =
    useState<string>("");

  const [statusFilter, setStatusFilter] =
    useState<string>("all");

  // =====================================================
  // KHỞI TẠO BCH
  // =====================================================

  useEffect(() => {
    initializeBCH();

    // Hàm được định nghĩa bên ngoài effect và không cần
    // đưa vào dependency vì effect chỉ chạy lúc mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function initializeBCH(): Promise<void> {
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
        .select("id, ho_ten, email, roles")
        .eq("id", user.id)
        .single();

      if (profileError || !profileData) {
        console.error(
          "Không lấy được profile BCH:",
          profileError
        );

        window.location.href = "/";
        return;
      }

      const roles = Array.isArray(profileData.roles)
        ? profileData.roles
        : [];

      const isBCH =
        roles.includes("bch_hsv");

      if (!isBCH) {
        console.error(
          "Tài khoản không có quyền bch_hsv."
        );

        window.location.href = "/";
        return;
      }

      setBchProfile({
        id: profileData.id,
        ho_ten: profileData.ho_ten,
        email: profileData.email,
        roles,
      });

      await loadAcademicYears();
    } catch (error) {
      console.error(
        "Lỗi initializeBCH:",
        error
      );

      setAcademicYears([]);
      setCurrentAcademicYear(null);
      setStudents([]);
      setApprovers({});
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // LẤY DANH SÁCH NĂM HỌC
  // =====================================================

  async function loadAcademicYears(): Promise<void> {
    try {
      const {
        data,
        error,
      } = await supabase
        .from("academic_years")
        .select(
          "id, name, is_current, submission_open"
        )
        .order("id", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Lỗi lấy năm học:",
          error
        );

        setAcademicYears([]);
        setCurrentAcademicYear(null);
        setStudents([]);
        setApprovers({});

        return;
      }

      const years: AcademicYear[] =
        (data || []).map(
          (year: {
            id: number;
            name: string;
            is_current: boolean;
            submission_open: boolean;
          }) => ({
            id: Number(year.id),
            name: year.name,
            is_current:
              Boolean(year.is_current),
            submission_open:
              Boolean(year.submission_open),
          })
        );

      setAcademicYears(years);

      if (years.length === 0) {
        setCurrentAcademicYear(null);
        setStudents([]);
        setApprovers({});
        return;
      }

      const current =
        years.find(
          (year: AcademicYear) =>
            year.is_current === true
        ) || years[0];

      setCurrentAcademicYear(current);
    } catch (error) {
      console.error(
        "Lỗi loadAcademicYears:",
        error
      );

      setAcademicYears([]);
      setCurrentAcademicYear(null);
      setStudents([]);
      setApprovers({});
    }
  }

  // =====================================================
  // LOAD HỒ SƠ KHI ĐỔI NĂM
  // =====================================================

  useEffect(() => {
    if (!currentAcademicYear?.id) {
      return;
    }

    loadStudents(
      Number(currentAcademicYear.id)
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAcademicYear?.id]);

  // =====================================================
  // LOAD HỒ SƠ SINH VIÊN
  // =====================================================

  async function loadStudents(
    yearId: number
  ): Promise<void> {
    if (!yearId) {
      return;
    }

    setLoading(true);
    setStudents([]);
    setApprovers({});

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/introduce";
        return;
      }

      // -----------------------------------------------
      // LẤY HỒ SƠ THEO NĂM
      // -----------------------------------------------

      const {
        data: yearProfilesData,
        error: yearProfilesError,
      } = await supabase
        .from("student_year_profiles")
        .select(
          `
          id,
          user_id,
          academic_year_id,
          is_submitted,
          submitted_at,
          trang_thai,
          ghi_chu,
          nguoi_duyet_id,
          created_at
        `
        )
        .eq(
          "academic_year_id",
          yearId
        )
        .eq(
          "is_submitted",
          true
        );

      if (yearProfilesError) {
        console.error(
          "Lỗi lấy student_year_profiles:",
          yearProfilesError
        );

        setStudents([]);
        setApprovers({});

        return;
      }

      const yearProfiles: YearProfile[] =
        (yearProfilesData || []) as YearProfile[];

      if (yearProfiles.length === 0) {
        setStudents([]);
        setApprovers({});
        return;
      }

      // -----------------------------------------------
      // DANH SÁCH USER ID
      // -----------------------------------------------

      const userIds: string[] = [
        ...new Set(
          yearProfiles
            .map(
              (item: YearProfile) =>
                item.user_id
            )
            .filter(
              (id): id is string =>
                Boolean(id)
            )
        ),
      ];

      if (userIds.length === 0) {
        setStudents([]);
        setApprovers({});
        return;
      }

      // -----------------------------------------------
      // LẤY PROFILE SINH VIÊN
      // -----------------------------------------------

      const {
        data: profilesData,
        error: profilesError,
      } = await supabase.rpc(
        "get_student_profiles_for_bch",
        {
          student_ids: userIds,
        }
      );

      if (profilesError) {
        console.error(
          "Lỗi get_student_profiles_for_bch:",
          profilesError
        );

        setStudents([]);
        setApprovers({});

        return;
      }

      const profiles: StudentProfile[] =
        (profilesData ||
          []) as StudentProfile[];

      // -----------------------------------------------
      // MAP PROFILE
      // -----------------------------------------------

      const profileMap: Record<
        string,
        StudentProfile
      > = {};

      profiles.forEach(
        (profile: StudentProfile) => {
          if (profile.id) {
            profileMap[profile.id] =
              profile;
          }
        }
      );

      // -----------------------------------------------
      // GHÉP HỒ SƠ NĂM + PROFILE
      // -----------------------------------------------

      const formattedStudents: Student[] =
        yearProfiles
          .map(
            (
              yearProfile: YearProfile
            ): Student | null => {
              const profile =
                profileMap[
                  yearProfile.user_id
                ];

              if (!profile) {
                console.warn(
                  "Không tìm thấy profile:",
                  yearProfile.user_id
                );

                return null;
              }

              const ghiChu =
                yearProfile.ghi_chu ??
                (typeof profile.ghi_chu ===
                "string"
                  ? profile.ghi_chu
                  : "") ??
                "";

              const nguoiDuyetId =
                yearProfile.nguoi_duyet_id ??
                (typeof profile.nguoi_duyet_id ===
                "string"
                  ? profile.nguoi_duyet_id
                  : null);

              return {
                ...profile,

                id: profile.id,

                user_id:
                  yearProfile.user_id,

                year_profile_id:
                  yearProfile.id,

                academic_year_id:
                  yearProfile.academic_year_id,

                is_submitted:
                  yearProfile.is_submitted,

                submitted_at:
                  yearProfile.submitted_at,

                trang_thai:
                  yearProfile.trang_thai ||
                  "chua_danh_gia",

                ghi_chu: ghiChu,

                nguoi_duyet_id:
                  nguoiDuyetId,

                created_at:
                  yearProfile.created_at,
              };
            }
          )
          .filter(
            (
              student
            ): student is Student =>
              student !== null
          );

      // -----------------------------------------------
      // SẮP XẾP
      // -----------------------------------------------

      formattedStudents.sort(
        (
          a: Student,
          b: Student
        ) => {
          const lopA = String(
            a.lop || ""
          );

          const lopB = String(
            b.lop || ""
          );

          if (lopA !== lopB) {
            return lopA.localeCompare(
              lopB,
              "vi"
            );
          }

          return String(
            a.mssv || ""
          ).localeCompare(
            String(b.mssv || ""),
            "vi"
          );
        }
      );

      setStudents(
        formattedStudents
      );

      // -----------------------------------------------
      // LẤY NGƯỜI DUYỆT
      // -----------------------------------------------

      const approverIds: string[] = [
        ...new Set(
          formattedStudents
            .map(
              (student: Student) =>
                student.nguoi_duyet_id
            )
            .filter(
              (id): id is string =>
                Boolean(id)
            )
        ),
      ];

      if (approverIds.length === 0) {
        setApprovers({});
        return;
      }

      const {
        data: approversData,
        error: approversError,
      } = await supabase.rpc(
        "get_profiles_by_ids_for_bch",
        {
          profile_ids:
            approverIds,
        }
      );

      if (approversError) {
        console.error(
          "Lỗi lấy người duyệt:",
          approversError
        );

        setApprovers({});
        return;
      }

      const approverMap: ApproverMap =
        {};

      (
        (approversData ||
          []) as Array<{
          id: string;
          ho_ten: string | null;
          email: string | null;
        }>
      ).forEach(
        (
          item: {
            id: string;
            ho_ten: string | null;
            email: string | null;
          }
        ) => {
          if (item.id) {
            approverMap[item.id] =
              item.ho_ten ||
              item.email ||
              "Không xác định";
          }
        }
      );

      setApprovers(
        approverMap
      );
    } catch (error) {
      console.error(
        "Lỗi loadStudents:",
        error
      );

      setStudents([]);
      setApprovers({});
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // REALTIME
  // =====================================================

  useEffect(() => {
    if (!currentAcademicYear?.id) {
      return;
    }

    const yearId = Number(
      currentAcademicYear.id
    );

    if (!yearId) {
      return;
    }

    const channel = supabase
      .channel(
        `bch-student-year-${yearId}`
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "student_year_profiles",
          filter:
            `academic_year_id=eq.${yearId}`,
        },
        async () => {
          await loadStudents(
            yearId
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAcademicYear?.id]);

  // =====================================================
  // CẬP NHẬT TRẠNG THÁI
  // =====================================================

  async function updateTrangThai(
    studentId: string,
    value: string
  ): Promise<void> {
    if (!currentAcademicYear?.id) {
      alert(
        "Chưa xác định được năm học."
      );
      return;
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert(
          "Không xác định được tài khoản BCH."
        );
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from(
          "student_year_profiles"
        )
        .update({
          trang_thai: value,
          nguoi_duyet_id:
            user.id,
        })
        .eq(
          "user_id",
          studentId
        )
        .eq(
          "academic_year_id",
          Number(
            currentAcademicYear.id
          )
        )
        .select(
          `
          id,
          user_id,
          academic_year_id,
          trang_thai,
          ghi_chu,
          nguoi_duyet_id
        `
        )
        .single();

      if (error) {
        console.error(
          "Lỗi cập nhật trạng thái:",
          error
        );

        alert(
          "Cập nhật trạng thái thất bại: " +
            error.message
        );

        return;
      }

      if (!data) {
        return;
      }

      setStudents(
        (
          prev: Student[]
        ) =>
          prev.map(
            (
              student: Student
            ) =>
              student.id ===
              studentId
                ? {
                    ...student,
                    trang_thai:
                      data.trang_thai ||
                      "chua_danh_gia",
                    ghi_chu:
                      data.ghi_chu ??
                      student.ghi_chu,
                    nguoi_duyet_id:
                      data.nguoi_duyet_id,
                  }
                : student
          )
      );

      if (
        data.nguoi_duyet_id
      ) {
        const {
          data: approverData,
          error: approverError,
        } = await supabase.rpc(
          "get_profiles_by_ids_for_bch",
          {
            profile_ids: [
              data.nguoi_duyet_id,
            ],
          }
        );

        if (
          !approverError &&
          approverData?.[0]
        ) {
          const approver =
            approverData[0] as {
              id: string;
              ho_ten: string | null;
              email: string | null;
            };

          setApprovers(
            (
              prev: ApproverMap
            ) => ({
              ...prev,
              [approver.id]:
                approver.ho_ten ||
                approver.email ||
                "Không xác định",
            })
          );
        }
      }
    } catch (error) {
      console.error(
        "Lỗi updateTrangThai:",
        error
      );
    }
  }

  // =====================================================
  // CẬP NHẬT GHI CHÚ
  // =====================================================

  async function updateGhiChu(
    studentId: string,
    value: string
  ): Promise<void> {
    if (!currentAcademicYear?.id) {
      return;
    }

    try {
      const {
        data,
        error,
      } = await supabase
        .from(
          "student_year_profiles"
        )
        .update({
          ghi_chu: value,
        })
        .eq(
          "user_id",
          studentId
        )
        .eq(
          "academic_year_id",
          Number(
            currentAcademicYear.id
          )
        )
        .select(
          `
          id,
          user_id,
          academic_year_id,
          ghi_chu,
          nguoi_duyet_id
        `
        )
        .single();

      if (error) {
        console.error(
          "Lỗi lưu ghi chú:",
          error
        );

        return;
      }

      if (!data) {
        return;
      }

      setStudents(
        (
          prev: Student[]
        ) =>
          prev.map(
            (
              student: Student
            ) =>
              student.id ===
              studentId
                ? {
                    ...student,
                    ghi_chu:
                      data.ghi_chu ??
                      "",
                    nguoi_duyet_id:
                      data.nguoi_duyet_id,
                  }
                : student
          )
      );
    } catch (error) {
      console.error(
        "Lỗi updateGhiChu:",
        error
      );
    }
  }

  // =====================================================
  // TÌM KIẾM + LỌC
  // =====================================================

  const normalizedSearch =
    studentSearch
      .trim()
      .toLowerCase();

  const filteredStudents: Student[] =
    students.filter(
      (sv: Student) => {
        const searchableValues =
          [
            sv.ho_ten,
            sv.lop,
            sv.mssv,
            sv.nganh,
            sv.chuyen_nganh,
            sv.nganh_hoc,
          ]
            .filter(
              (
                value
              ): value is string =>
                typeof value ===
                  "string" &&
                value.length > 0
            )
            .map(
              (
                value: string
              ) =>
                value.toLowerCase()
            );

        const matchesSearch =
          !normalizedSearch ||
          searchableValues.some(
            (
              value: string
            ) =>
              value.includes(
                normalizedSearch
              )
          );

        const status =
          sv.trang_thai ||
          "chua_danh_gia";

        const matchesStatus =
          statusFilter ===
            "all" ||
          status ===
            statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );

  // =====================================================
  // THỐNG KÊ
  // =====================================================

  const statusStats = [
    {
      label: "Nộp",
      value:
        filteredStudents.length,
      background: "#eff6ff",
      textColor: "#1d4ed8",
    },
    {
      label: "Đạt",
      value:
        filteredStudents.filter(
          (
            sv: Student
          ) =>
            sv.trang_thai ===
            "da_dat"
        ).length,
      background: "#dcfce7",
      textColor: "#15803d",
    },
    {
      label: "Chưa duyệt",
      value:
        filteredStudents.filter(
          (
            sv: Student
          ) =>
            sv.trang_thai ===
            "chua_danh_gia"
        ).length,
      background: "#fef3c7",
      textColor: "#92400e",
    },
    {
      label: "Cần xét",
      value:
        filteredStudents.filter(
          (
            sv: Student
          ) =>
            sv.trang_thai ===
            "can_xem_xet"
        ).length,
      background: "#dbeafe",
      textColor: "#1d4ed8",
    },
    {
      label: "Không đạt",
      value:
        filteredStudents.filter(
          (
            sv: Student
          ) =>
            sv.trang_thai ===
            "khong_dat"
        ).length,
      background: "#fee2e2",
      textColor: "#b91c1c",
    },
  ];

  // =====================================================
  // ĐĂNG XUẤT
  // =====================================================

  async function handleLogout(): Promise<void> {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "Lỗi đăng xuất:",
        error
      );
      return;
    }

    window.location.href =
      "/introduce";
  }

  // =====================================================
  // LOADING
  // =====================================================

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

  // =====================================================
  // GIAO DIỆN
  // =====================================================

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
        openCriteria={() =>
          setShowCriteria(true)
        }
        openProfile={() => {}}
      />

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
        {/* =================================================
            THÔNG TIN BCH
        ================================================= */}

        <div
          style={{
            background: "#fff",
            border:
              "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "16px 18px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: "16px",
            boxShadow:
              "0 2px 8px rgba(15,23,42,0.04)",
          }}
        >
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
                alignItems:
                  "center",
                justifyContent:
                  "center",
                fontSize: "15px",
                fontWeight: 800,
                border:
                  "1px solid #dbeafe",
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
                Ban Chấp hành Hội Sinh
                viên Trường
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "19px",
                  lineHeight: 1.35,
                  fontWeight: 750,
                  color: "#0f172a",
                  whiteSpace:
                    "nowrap",
                  overflow: "hidden",
                  textOverflow:
                    "ellipsis",
                }}
              >
                Đồng chí{" "}
                {bchProfile?.ho_ten ||
                  "BCH"}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              flexShrink: 0,
              padding: "9px 13px",
              border:
                "1px solid #e2e8f0",
              background: "#fff",
              color: "#475569",
              fontSize: "13px",
              fontWeight: 650,
              cursor: "pointer",
              borderRadius: "10px",
            }}
          >
            Đăng xuất
          </button>
        </div>

        {/* =================================================
            TIÊU ĐỀ + THỐNG KÊ
        ================================================= */}

        <div
          style={{
            marginBottom: "20px",
            display: "flex",
            alignItems:
              "flex-end",
            justifyContent:
              "space-between",
            gap: "20px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: 750,
              color: "#0f172a",
            }}
          >
            Danh sách hồ sơ sinh
            viên
          </h2>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent:
                "flex-end",
              gap: "8px",
            }}
          >
            {statusStats.map(
              (
                item: {
                  label: string;
                  value: number;
                  background: string;
                  textColor: string;
                }
              ) => (
                <div
                  key={
                    item.label
                  }
                  style={{
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    gap: "6px",
                    background:
                      item.background,
                    border:
                      "1px solid rgba(148,163,184,.25)",
                    color:
                      item.textColor,
                    borderRadius:
                      "999px",
                    padding:
                      "6px 10px",
                    fontSize:
                      "12px",
                    fontWeight: 700,
                  }}
                >
                  <span>
                    {item.label}
                  </span>
                  <span>
                    {item.value}
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        {/* =================================================
            BẢNG
        ================================================= */}

        <div
          style={{
            background: "#fff",
            border:
              "1px solid #e2e8f0",
            borderRadius: "18px",
            overflow: "hidden",
            boxShadow:
              "0 3px 12px rgba(15,23,42,0.04)",
          }}
        >
          {/* TOOLBAR */}

          <div
            style={{
              padding:
                "20px 24px",
              borderBottom:
                "1px solid #e2e8f0",
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: "16px",
              flexWrap: "wrap",
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
                alignItems:
                  "center",
                gap: "10px",
                flexWrap: "wrap",
                justifyContent:
                  "flex-end",
              }}
            >
              {/* NĂM HỌC */}

              <select
                value={
                  currentAcademicYear?.id ??
                  ""
                }
                onChange={(
                  e
                ) => {
                  const yearId =
                    Number(
                      e.target
                        .value
                    );

                  const selectedYear =
                    academicYears.find(
                      (
                        year: AcademicYear
                      ) =>
                        Number(
                          year.id
                        ) ===
                        yearId
                    );

                  if (
                    !selectedYear
                  ) {
                    return;
                  }

                  setStatusFilter(
                    "all"
                  );

                  setStudentSearch(
                    ""
                  );

                  setStudents(
                    []
                  );

                  setApprovers(
                    {}
                  );

                  setCurrentAcademicYear(
                    selectedYear
                  );
                }}
                style={
                  selectStyle
                }
              >
                {academicYears.map(
                  (
                    year: AcademicYear
                  ) => (
                    <option
                      key={
                        year.id
                      }
                      value={
                        year.id
                      }
                    >
                      Năm học{" "}
                      {year.name}
                    </option>
                  )
                )}
              </select>

              {/* TÌM KIẾM */}

              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: "10px",
                  background:
                    "#f8fafc",
                  border:
                    "1px solid #dbeafe",
                  borderRadius:
                    "10px",
                  padding:
                    "8px 12px",
                  minWidth:
                    "260px",
                }}
              >
                <span>
                  🔎
                </span>

                <input
                  type="text"
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
                  placeholder="Tìm tên, lớp, MSSV, ngành"
                  style={{
                    border: "none",
                    outline:
                      "none",
                    background:
                      "transparent",
                    width:
                      "100%",
                    color:
                      "#0f172a",
                    fontSize:
                      "14px",
                  }}
                />
              </div>

              {/* LỌC */}

              <select
                value={
                  statusFilter
                }
                onChange={(
                  e
                ) =>
                  setStatusFilter(
                    e.target
                      .value
                  )
                }
                style={
                  selectStyle
                }
              >
                <option value="all">
                  Tất cả trạng thái
                </option>

                <option value="chua_danh_gia">
                  Chưa đánh giá
                </option>

                <option value="can_xem_xet">
                  Cần xem xét
                </option>

                <option value="da_dat">
                  Hồ sơ đã đạt
                </option>

                <option value="khong_dat">
                  Hồ sơ không đạt
                </option>
              </select>
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
                width: "100%",
                borderCollapse:
                  "collapse",
                minWidth:
                  "1100px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background:
                      "#eff6ff",
                  }}
                >
                  <th
                    style={
                      thCenter
                    }
                  >
                    STT
                  </th>

                  <th
                    style={
                      thLeft
                    }
                  >
                    Họ tên
                  </th>

                  <th
                    style={
                      thCenter
                    }
                  >
                    Lớp
                  </th>

                  <th
                    style={
                      thCenter
                    }
                  >
                    MSSV
                  </th>

                  <th
                    style={
                      thCenter
                    }
                  >
                    Trạng thái hồ sơ
                  </th>

                  <th
                    style={
                      thCenter
                    }
                  >
                    Người duyệt hồ sơ
                  </th>

                  <th
                    style={
                      thCenter
                    }
                  >
                    Ghi chú
                  </th>

                  <th
                    style={
                      thCenter
                    }
                  >
                    Xét hồ sơ
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map(
                  (
                    sv: Student,
                    index: number
                  ) => {
                    const status =
                      sv.trang_thai ||
                      "chua_danh_gia";

                    const statusMap: StatusMap =
                      {
                        chua_danh_gia:
                          {
                            label:
                              "Chưa đánh giá",
                            background:
                              "#fef3c7",
                            color:
                              "#92400e",
                          },

                        can_xem_xet:
                          {
                            label:
                              "Cần xem xét",
                            background:
                              "#dbeafe",
                            color:
                              "#1d4ed8",
                          },

                        da_dat:
                          {
                            label:
                              "Hồ sơ đã đạt",
                            background:
                              "#dcfce7",
                            color:
                              "#15803d",
                          },

                        khong_dat:
                          {
                            label:
                              "Hồ sơ không đạt",
                            background:
                              "#fee2e2",
                            color:
                              "#b91c1c",
                          },
                      };

                    const currentStatus =
                      statusMap[
                        status
                      ] ||
                      statusMap[
                        "chua_danh_gia"
                      ];

                    return (
                      <tr
                        key={`${currentAcademicYear?.id}-${sv.id}`}
                        style={{
                          borderTop:
                            "1px solid #e2e8f0",
                        }}
                      >
                        <td
                          style={
                            tdCenterLarge
                          }
                        >
                          {index +
                            1}
                        </td>

                        <td
                          style={{
                            padding:
                              "18px",
                            fontSize:
                              "16px",
                            fontWeight:
                              650,
                            color:
                              "#0f172a",
                          }}
                        >
                          {
                            sv.ho_ten
                          }
                        </td>

                        <td
                          style={
                            tdCenterLarge
                          }
                        >
                          {
                            sv.lop
                          }
                        </td>

                        <td
                          style={
                            tdCenterLarge
                          }
                        >
                          {
                            sv.mssv
                          }
                        </td>

                        <td
                          style={
                            tdCenterLarge
                          }
                        >
                          <span
                            style={{
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              padding:
                                "7px 13px",
                              borderRadius:
                                "999px",
                              background:
                                currentStatus.background,
                              color:
                                currentStatus.color,
                              fontSize:
                                "14px",
                              fontWeight:
                                650,
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {
                              currentStatus.label
                            }
                          </span>
                        </td>

                        <td
                          style={
                            tdCenterLarge
                          }
                        >
                          <span
                            style={{
                              color:
                                sv.nguoi_duyet_id
                                  ? "#15803d"
                                  : "#64748b",
                              fontSize:
                                "15px",
                              fontWeight:
                                600,
                            }}
                          >
                            {sv.nguoi_duyet_id
                              ? approvers[
                                  sv.nguoi_duyet_id
                                ] ||
                                "Đang tải..."
                              : "Chưa có"}
                          </span>
                        </td>

                        <td
                          style={{
                            ...tdCenterLarge,
                            textAlign:
                              "left",
                            verticalAlign:
                              "top",
                            width:
                              "160px",
                            maxWidth:
                              "160px",
                            padding:
                              "12px",
                            whiteSpace:
                              "normal",
                            overflowWrap:
                              "break-word",
                            wordBreak:
                              "break-word",
                          }}
                        >
                          {
                            sv.ghi_chu ||
                            "—"
                          }
                        </td>

                        <td
                          style={
                            tdCenterLarge
                          }
                        >
                          <button
                            type="button"
                            onClick={() => {
                              const yearId =
                                currentAcademicYear?.id;

                              if (
                                !yearId
                              ) {
                                alert(
                                  "Chưa xác định được năm học."
                                );
                                return;
                              }

                              window.location.href =
                                `/bch/students/${sv.id}?year=${yearId}`;
                            }}
                            style={{
                              border:
                                "none",
                              background:
                                "#2563eb",
                              color:
                                "#fff",
                              padding:
                                "9px 16px",
                              borderRadius:
                                "9px",
                              fontSize:
                                "14px",
                              fontWeight:
                                650,
                              cursor:
                                "pointer",
                            }}
                          >
                            Xét hồ sơ
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )}

                {filteredStudents.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={
                        8
                      }
                      style={
                        emptyCell
                      }
                    >
                      <div
                        style={{
                          fontSize:
                            "40px",
                          marginBottom:
                            "12px",
                        }}
                      >
                        📂
                      </div>

                      <div
                        style={{
                          fontSize:
                            "16px",
                          fontWeight:
                            650,
                          color:
                            "#334155",
                        }}
                      >
                        {studentSearch ||
                        statusFilter !==
                          "all"
                          ? "Không tìm thấy hồ sơ phù hợp"
                          : "Chưa có hồ sơ"}
                      </div>

                      <div
                        style={{
                          marginTop:
                            "6px",
                          fontSize:
                            "14px",
                          color:
                            "#94a3b8",
                        }}
                      >
                        {studentSearch ||
                        statusFilter !==
                          "all"
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

      {/* MODAL TIÊU CHÍ */}

      {showCriteria && (
        <CriteriaModal
          onClose={() =>
            setShowCriteria(
              false
            )
          }
        />
      )}

      <Footer />
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const selectStyle: CSSProperties =
  {
    padding: "9px 12px",
    border:
      "1px solid #dbeafe",
    borderRadius: "10px",
    background: "#fff",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    outline: "none",
    height: "42px",
    boxSizing: "border-box",
    minWidth: "170px",
  };

const thCenter: CSSProperties =
  {
    padding: "16px 18px",
    textAlign: "center",
    whiteSpace: "nowrap",
    fontSize: "14px",
    fontWeight: 750,
    color: "#334155",
  };

const thLeft: CSSProperties =
  {
    padding: "16px 18px",
    textAlign: "left",
    whiteSpace: "nowrap",
    fontSize: "14px",
    fontWeight: 750,
    color: "#334155",
  };

const tdCenterLarge: CSSProperties =
  {
    padding: "18px",
    textAlign: "center",
    color: "#475569",
    fontSize: "15px",
  };

const emptyCell: CSSProperties =
  {
    padding: "70px 20px",
    textAlign: "center",
  };