
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Header from "../../components/Header";
import AdminSidebar from "../../components/AdminSidebar";
import Footer from "../../components/Footer";

type CriterionKey =
  | "dao-duc"
  | "hoc-tap"
  | "the-luc"
  | "tinh-nguyen"
  | "hoi-nhap";

type Student = {
  id: string;
  ho_ten: string;
  mssv: string;
  lop: string;
  hasYearProfile: boolean;
  is_submitted: boolean;
  criteria: Record<CriterionKey, number | null>;
  overall: number | null;
  evaluatedCount: number;
  totalItems: number;
};

type CriterionItem = {
  id: string;
  criterion: string;
  content: string;
  item_type: string;
  sort_order: number;
};

type Evaluation = {
  user_id: string;
  criterion_item_id: string;
  completion_percent: number | null;
  comment: string | null;
};

type FilterType =
  | "all"
  | "submitted"
  | "pending"
  | "no-profile"
  | "not-evaluated"
  | "in-progress"
  | "achieved";

const CRITERIA: {
  key: CriterionKey;
  label: string;
  icon: string;
  color: string;
}[] = [
  {
    key: "dao-duc",
    label: "Đạo đức tốt",
    icon: "✦",
    color: "#8b5cf6",
  },
  {
    key: "hoc-tap",
    label: "Học tập tốt",
    icon: "▤",
    color: "#2563eb",
  },
  {
    key: "the-luc",
    label: "Thể lực tốt",
    icon: "♡",
    color: "#10b981",
  },
  {
    key: "tinh-nguyen",
    label: "Tình nguyện tốt",
    icon: "♥",
    color: "#f97316",
  },
  {
    key: "hoi-nhap",
    label: "Hội nhập tốt",
    icon: "◎",
    color: "#06b6d4",
  },
];

const numberFormat = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value);

const percentFormat = (value: number | null) =>
  value === null ? "—" : `${value.toFixed(1)}%`;

function getItemType(value: string | null | undefined) {
  const type = (value || "").trim().toLowerCase();

  if (
    type.includes("required") ||
    type.includes("bat-buoc") ||
    type.includes("bắt buộc")
  ) {
    return "required";
  }

  if (
    type.includes("additional") ||
    type.includes("optional") ||
    type.includes("khuyen-khich") ||
    type.includes("khuyến khích")
  ) {
    return "additional";
  }

  return "unknown";
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function StatisticsPage() {
  const [tab, setTab] = useState("Thống kê");

  const [students, setStudents] = useState<Student[]>([]);
  const [items, setItems] = useState<CriterionItem[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [academicYear, setAcademicYear] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState("progress");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);

  const [showAllClasses, setShowAllClasses] = useState(false);

  const loadData = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const { data: year, error: yearError } = await supabase
        .from("academic_years")
        .select("id, name")
        .eq("is_current", true)
        .maybeSingle();

      if (yearError) throw yearError;

      if (!year) {
        setAcademicYear(null);
        setStudents([]);
        setItems([]);
        setEvaluations([]);
        setError("Chưa thiết lập năm học hiện tại.");
        return;
      }

      setAcademicYear(year);

      const [
        profilesResult,
        yearProfilesResult,
        itemsResult,
        evaluationsResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, ho_ten, mssv, lop, role")
          .eq("role", "student"),

        supabase
          .from("student_year_profiles")
          .select("user_id, is_submitted")
          .eq("academic_year_id", year.id),

        supabase
          .from("sv5t_criterion_items")
          .select(
            "id, criterion, content, item_type, sort_order"
          )
          .eq("academic_year_id", year.id)
          .order("sort_order", { ascending: true }),

        supabase
          .from("sv5t_student_criterion_evaluations")
          .select(
            "user_id, criterion_item_id, completion_percent, comment"
          )
          .eq("academic_year_id", year.id),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (yearProfilesResult.error) throw yearProfilesResult.error;
      if (itemsResult.error) throw itemsResult.error;
      if (evaluationsResult.error) throw evaluationsResult.error;

      const profileMap = new Map<string, any>();
      (yearProfilesResult.data || []).forEach((row: any) => {
        profileMap.set(row.user_id, row);
      });

      const itemList = (itemsResult.data || []) as CriterionItem[];
      const evaluationList =
        (evaluationsResult.data || []) as Evaluation[];

      const itemMap = new Map<string, CriterionItem>();
      itemList.forEach((item) => itemMap.set(item.id, item));

      const evaluationMap = new Map<string, Evaluation>();
      evaluationList.forEach((evaluation) => {
        evaluationMap.set(
          `${evaluation.user_id}_${evaluation.criterion_item_id}`,
          evaluation
        );
      });

      const result: Student[] = (profilesResult.data || []).map(
        (profile: any) => {
          const yearProfile = profileMap.get(profile.id);

          const criterionScores = {} as Record<
            CriterionKey,
            number | null
          >;

          let evaluatedCount = 0;
          let totalItems = 0;

          CRITERIA.forEach((criterion) => {
            const criterionItems = itemList.filter(
              (item) => item.criterion === criterion.key
            );

            const requiredItems = criterionItems.filter(
              (item) => getItemType(item.item_type) === "required"
            );

            const additionalItems = criterionItems.filter(
              (item) => getItemType(item.item_type) === "additional"
            );

            const validItems = [
              ...requiredItems,
              ...additionalItems,
            ];

            totalItems += validItems.length;

            if (validItems.length === 0) {
              criterionScores[criterion.key] = null;
              return;
            }

            const getCompletion = (item: CriterionItem) => {
              const evaluation = evaluationMap.get(
                `${profile.id}_${item.id}`
              );

              if (
                evaluation &&
                evaluation.completion_percent !== null
              ) {
                evaluatedCount++;
                return clampPercent(
                  Number(evaluation.completion_percent) || 0
                );
              }

              return 0;
            };

            let requiredScore = 100;
            let additionalScore = 100;

            if (requiredItems.length > 0) {
              const total = requiredItems.reduce(
                (sum, item) => sum + getCompletion(item),
                0
              );

              requiredScore = total / requiredItems.length;
            }

            if (additionalItems.length > 0) {
              additionalScore = Math.max(
                ...additionalItems.map(getCompletion)
              );
            }

            criterionScores[criterion.key] =
              requiredItems.length > 0 &&
              additionalItems.length > 0
                ? requiredScore * 0.5 + additionalScore * 0.5
                : requiredItems.length > 0
                  ? requiredScore
                  : additionalScore;
          });

          const availableScores = CRITERIA.map(
            (criterion) => criterionScores[criterion.key]
          ).filter((value): value is number => value !== null);

          const overall =
            availableScores.length === 5
              ? availableScores.reduce((sum, value) => sum + value, 0) /
                5
              : null;

          return {
            id: profile.id,
            ho_ten: profile.ho_ten || "",
            mssv: profile.mssv || "",
            lop: profile.lop || "",
            hasYearProfile: !!yearProfile,
            is_submitted: yearProfile?.is_submitted === true,
            criteria: criterionScores,
            overall,
            evaluatedCount,
            totalItems,
          };
        }
      );

      setItems(itemList);
      setEvaluations(evaluationList);
      setStudents(result);
      setPage(1);
    } catch (err: any) {
      console.error("Lỗi tải thống kê:", err);
      setError(err?.message || "Không thể tải dữ liệu thống kê.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const classes = useMemo(() => {
    return Array.from(
      new Set(
        students
          .map((student) => student.lop.trim())
          .filter(Boolean)
      )
    ).sort((a, b) =>
      a.localeCompare(b, "vi", {
        numeric: true,
        sensitivity: "base",
      })
    );
  }, [students]);

  const overview = useMemo(() => {
    const total = students.length;
    const submitted = students.filter((s) => s.is_submitted).length;
    const pending = students.filter(
      (s) => s.hasYearProfile && !s.is_submitted
    ).length;
    const noProfile = students.filter(
      (s) => !s.hasYearProfile
    ).length;

    const evaluated = students.filter(
      (s) => s.evaluatedCount > 0
    ).length;

    const fullyEvaluated = students.filter(
      (s) => s.overall !== null
    ).length;

    const achieved = students.filter(
      (s) =>
        s.overall !== null &&
        s.criteria &&
        CRITERIA.every(
          (criterion) => s.criteria[criterion.key] === 100
        )
    ).length;

    const averageProgress =
      fullyEvaluated === 0
        ? 0
        : students
            .filter((s) => s.overall !== null)
            .reduce((sum, s) => sum + (s.overall || 0), 0) /
          fullyEvaluated;

    return {
      total,
      submitted,
      pending,
      noProfile,
      evaluated,
      fullyEvaluated,
      achieved,
      averageProgress,
      submissionRate:
        total === 0 ? 0 : (submitted / total) * 100,
      evaluationRate:
        total === 0 ? 0 : (fullyEvaluated / total) * 100,
    };
  }, [students]);

  const criterionStats = useMemo(() => {
    return CRITERIA.map((criterion) => {
      const available = students.filter(
        (student) => student.criteria[criterion.key] !== null
      );

      const achieved = available.filter(
        (student) => student.criteria[criterion.key] === 100
      );

      const average =
        available.length === 0
          ? 0
          : available.reduce(
              (sum, student) =>
                sum + (student.criteria[criterion.key] || 0),
              0
            ) / available.length;

      return {
        ...criterion,
        total: available.length,
        achieved: achieved.length,
        average,
        rate:
          available.length === 0
            ? 0
            : (achieved.length / available.length) * 100,
      };
    });
  }, [students]);

  const classStats = useMemo(() => {
    return classes
      .map((name) => {
        const list = students.filter(
          (student) => student.lop.trim() === name
        );

        const submitted = list.filter(
          (student) => student.is_submitted
        ).length;

        const evaluated = list.filter(
          (student) => student.overall !== null
        );

        const average =
          evaluated.length === 0
            ? 0
            : evaluated.reduce(
                (sum, student) => sum + (student.overall || 0),
                0
              ) / evaluated.length;

        return {
          name,
          total: list.length,
          submitted,
          pending: list.filter(
            (student) =>
              student.hasYearProfile && !student.is_submitted
          ).length,
          noProfile: list.filter(
            (student) => !student.hasYearProfile
          ).length,
          average,
          submissionRate:
            list.length === 0
              ? 0
              : (submitted / list.length) * 100,
          list,
        };
      })
      .sort((a, b) => a.submissionRate - b.submissionRate);
  }, [students, classes]);

  const taskLists = useMemo(() => {
    return {
      notSubmitted: students.filter(
        (s) => !s.is_submitted
      ),
      notEvaluated: students.filter(
        (s) => s.is_submitted && s.evaluatedCount === 0
      ),
      inProgress: students.filter(
        (s) =>
          s.overall !== null &&
          s.overall < 100 &&
          s.evaluatedCount > 0
      ),
      achieved: students.filter(
        (s) =>
          s.overall !== null &&
          CRITERIA.every(
            (criterion) => s.criteria[criterion.key] === 100
          )
      ),
    };
  }, [students]);

  const filteredStudents = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    let result = students.filter((student) => {
      const matchesSearch =
        !keyword ||
        `${student.ho_ten} ${student.mssv} ${student.lop}`
          .toLowerCase()
          .includes(keyword);

      const matchesClass =
        classFilter === "all" || student.lop === classFilter;

      let matchesFilter = true;

      switch (filter) {
        case "submitted":
          matchesFilter = student.is_submitted;
          break;
        case "pending":
          matchesFilter =
            student.hasYearProfile && !student.is_submitted;
          break;
        case "no-profile":
          matchesFilter = !student.hasYearProfile;
          break;
        case "not-evaluated":
          matchesFilter =
            student.is_submitted && student.evaluatedCount === 0;
          break;
        case "in-progress":
          matchesFilter =
            student.overall !== null &&
            student.overall < 100 &&
            student.evaluatedCount > 0;
          break;
        case "achieved":
          matchesFilter =
            student.overall !== null &&
            CRITERIA.every(
              (criterion) => student.criteria[criterion.key] === 100
            );
          break;
        default:
          matchesFilter = true;
      }

      return matchesSearch && matchesClass && matchesFilter;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === "name") {
        return a.ho_ten.localeCompare(b.ho_ten, "vi");
      }

      if (sortBy === "class") {
        return a.lop.localeCompare(b.lop, "vi", {
          numeric: true,
        });
      }

      if (sortBy === "submitted") {
        return Number(b.is_submitted) - Number(a.is_submitted);
      }

      return (b.overall ?? -1) - (a.overall ?? -1);
    });

    return result;
  }, [students, search, classFilter, filter, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / pageSize)
  );

  const pageStudents = filteredStudents.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [search, classFilter, filter, sortBy]);

  const filterLabels: Record<FilterType, string> = {
    all: "Tất cả",
    submitted: "Đã nộp hồ sơ",
    pending: "Có hồ sơ - chưa nộp",
    "no-profile": "Chưa tạo hồ sơ",
    "not-evaluated": "Chưa đánh giá",
    "in-progress": "Đang hoàn thiện",
    achieved: "Đạt đủ 5 tiêu chí",
  };

  const applyFilter = (nextFilter: FilterType) => {
    setFilter(nextFilter);
    setClassFilter("all");
    setSearch("");
  };

  const exportCsv = () => {
    const headers = [
      "STT",
      "Họ và tên",
      "MSSV",
      "Lớp",
      "Trạng thái hồ sơ",
      ...CRITERIA.map((criterion) => criterion.label),
      "Tiến độ tổng",
      "Số mục đã đánh giá",
      "Tổng số mục",
    ];

    const rows = filteredStudents.map((student, index) => [
      index + 1,
      student.ho_ten,
      student.mssv,
      student.lop,
      student.is_submitted
        ? "Đã nộp"
        : student.hasYearProfile
          ? "Chưa nộp"
          : "Chưa tạo hồ sơ",
      ...CRITERIA.map((criterion) =>
        student.criteria[criterion.key] === null
          ? "Chưa có tiêu chí"
          : `${student.criteria[criterion.key]}%`
      ),
      student.overall === null
        ? "Chưa đủ dữ liệu"
        : `${student.overall.toFixed(1)}%`,
      student.evaluatedCount,
      student.totalItems,
    ]);

    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\r\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ThongKeSV5T_${academicYear?.name || "NamHoc"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatus = (student: Student) => {
    if (!student.hasYearProfile) {
      return { label: "Chưa tạo hồ sơ", type: "red" };
    }

    if (!student.is_submitted) {
      return { label: "Chưa nộp hồ sơ", type: "orange" };
    }

    if (student.evaluatedCount === 0) {
      return { label: "Chờ đánh giá", type: "blue" };
    }

    if (student.overall === null) {
      return { label: "Đang cập nhật", type: "gray" };
    }

    if (
      CRITERIA.every(
        (criterion) => student.criteria[criterion.key] === 100
      )
    ) {
      return { label: "Đạt 5 tiêu chí", type: "green" };
    }

    return { label: "Đang hoàn thiện", type: "purple" };
  };

  const formatProgress = (value: number | null) =>
    value === null ? "Chưa có dữ liệu" : `${value.toFixed(1)}%`;

  return (
    <>
      <Header
        tab={tab}
        setTab={setTab}
        openCriteria={() => {
          window.location.href = "/admin/criteria";
        }}
        openProfile={() => {
          window.location.href = "/admin/users";
        }}
      />

      <AdminSidebar />

      <main className="sv5t-stat">
        <style jsx>{`
          .sv5t-stat {
            min-height: 100vh;
            padding: 30px 32px 55px;
            background:
              radial-gradient(circle at 90% 0%, #dbeafe 0, transparent 28%),
              #f4f7fc;
            color: #172033;
          }

          .container {
            max-width: 1550px;
            margin: 0 auto;
          }

          .hero {
            position: relative;
            overflow: hidden;
            padding: 30px;
            border-radius: 24px;
            color: white;
            background: linear-gradient(120deg, #172554, #1d4ed8 65%, #0891b2);
            box-shadow: 0 18px 45px rgba(30, 64, 175, 0.18);
            animation: rise 0.45s ease both;
          }

          .hero::after {
            content: "";
            position: absolute;
            width: 280px;
            height: 280px;
            right: -65px;
            top: -125px;
            border: 35px solid rgba(255,255,255,.08);
            border-radius: 50%;
          }

          .hero-top {
            position: relative;
            z-index: 1;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
          }

          .eyebrow {
            color: #bfdbfe;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 2px;
            text-transform: uppercase;
          }

          .hero h1 {
            margin: 10px 0 8px;
            font-size: clamp(23px, 3vw, 34px);
            font-weight: 900;
            letter-spacing: -.8px;
          }

          .hero p {
            margin: 0;
            color: #dbeafe;
            font-size: 13px;
            line-height: 1.7;
          }

          .year-pill {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 14px;
            border: 1px solid rgba(255,255,255,.25);
            border-radius: 12px;
            background: rgba(255,255,255,.12);
            font-size: 12px;
            font-weight: 800;
            white-space: nowrap;
          }

          .hero-actions {
            position: relative;
            z-index: 1;
            display: flex;
            gap: 9px;
            flex-wrap: wrap;
            margin-top: 22px;
          }

          .hero-button {
            padding: 10px 14px;
            border: 1px solid rgba(255,255,255,.25);
            border-radius: 10px;
            color: white;
            background: rgba(255,255,255,.13);
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            transition: .2s;
          }

          .hero-button:hover {
            background: rgba(255,255,255,.24);
            transform: translateY(-2px);
          }

          .hero-button:disabled {
            opacity: .55;
            cursor: not-allowed;
            transform: none;
          }

          .section {
            margin-top: 26px;
            animation: rise .45s ease both;
          }

          .section-head {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 14px;
            margin-bottom: 14px;
          }

          .section-head h2 {
            margin: 0;
            font-size: 17px;
            font-weight: 900;
            color: #172554;
          }

          .section-head p {
            margin: 5px 0 0;
            color: #8491a7;
            font-size: 12px;
          }

          .metrics {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
          }

          .metric {
            position: relative;
            overflow: hidden;
            min-width: 0;
            padding: 19px;
            border: 1px solid #e7edf6;
            border-radius: 17px;
            background: white;
            text-align: left;
            cursor: pointer;
            transition: .22s;
            box-shadow: 0 4px 15px rgba(15,23,42,.025);
          }

          .metric:hover {
            transform: translateY(-4px);
            box-shadow: 0 13px 28px rgba(15,23,42,.08);
          }

          .metric::after {
            content: "";
            position: absolute;
            width: 75px;
            height: 75px;
            right: -25px;
            bottom: -30px;
            border-radius: 50%;
            background: var(--soft);
          }

          .metric-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
          }

          .metric-label {
            color: #64748b;
            font-size: 12px;
            font-weight: 750;
          }

          .metric-icon {
            display: grid;
            place-items: center;
            width: 36px;
            height: 36px;
            border-radius: 11px;
            color: var(--accent);
            background: var(--soft);
            font-size: 17px;
            font-weight: 900;
          }

          .metric-value {
            margin-top: 14px;
            color: #172033;
            font-size: 30px;
            font-weight: 950;
            letter-spacing: -1px;
          }

          .metric-note {
            margin-top: 5px;
            color: #94a3b8;
            font-size: 11px;
          }

          .dashboard-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.25fr) minmax(300px, .75fr);
            gap: 16px;
          }

          .panel {
            min-width: 0;
            padding: 21px;
            border: 1px solid #e7edf6;
            border-radius: 17px;
            background: white;
            box-shadow: 0 4px 15px rgba(15,23,42,.025);
          }

          .panel-title {
            margin: 0;
            color: #1e293b;
            font-size: 14px;
            font-weight: 900;
          }

          .panel-subtitle {
            margin-top: 5px;
            color: #94a3b8;
            font-size: 11px;
          }

          .progress-large {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 10px;
            margin-top: 20px;
          }

          .progress-large strong {
            color: #1d4ed8;
            font-size: 35px;
            font-weight: 950;
          }

          .progress-large span {
            color: #94a3b8;
            font-size: 11px;
          }

          .track {
            overflow: hidden;
            height: 12px;
            margin-top: 12px;
            border-radius: 20px;
            background: #edf2f8;
          }

          .fill {
            height: 100%;
            border-radius: inherit;
            background: linear-gradient(90deg, #2563eb, #06b6d4);
            transition: width .7s ease;
          }

          .breakdown {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-top: 19px;
          }

          .breakdown-item {
            padding: 11px;
            border-radius: 11px;
            background: #f8fafc;
          }

          .breakdown-item strong {
            display: block;
            color: #1e293b;
            font-size: 19px;
            font-weight: 900;
          }

          .breakdown-item span {
            display: block;
            margin-top: 4px;
            color: #8491a7;
            font-size: 10px;
          }

          .insight {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 13px;
            padding: 13px;
            border: 1px solid #e8edf6;
            border-radius: 12px;
            background: #f8fafc;
          }

          .insight-icon {
            display: grid;
            place-items: center;
            flex-shrink: 0;
            width: 37px;
            height: 37px;
            border-radius: 11px;
            color: var(--accent);
            background: var(--soft);
            font-size: 17px;
          }

          .insight strong {
            display: block;
            color: #334155;
            font-size: 12px;
          }

          .insight span {
            display: block;
            margin-top: 4px;
            color: #94a3b8;
            font-size: 10px;
            line-height: 1.5;
          }

          .task-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px;
          }

          .task {
            padding: 16px;
            border: 1px solid #e7edf6;
            border-radius: 15px;
            background: white;
            text-align: left;
            cursor: pointer;
            transition: .2s;
          }

          .task:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 24px rgba(15,23,42,.07);
          }

          .task-label {
            color: #64748b;
            font-size: 11px;
            font-weight: 750;
          }

          .task-value {
            margin-top: 10px;
            color: #172033;
            font-size: 27px;
            font-weight: 950;
          }

          .task-action {
            margin-top: 6px;
            color: #2563eb;
            font-size: 10px;
            font-weight: 800;
          }

          .criteria-grid {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 11px;
          }

          .criterion {
            padding: 15px;
            border: 1px solid #e7edf6;
            border-radius: 14px;
            background: white;
            min-width: 0;
          }

          .criterion-icon {
            display: grid;
            place-items: center;
            width: 32px;
            height: 32px;
            border-radius: 10px;
            color: white;
            background: var(--accent);
            font-weight: 900;
          }

          .criterion-name {
            min-height: 30px;
            margin-top: 10px;
            color: #475569;
            font-size: 11px;
            font-weight: 850;
          }

          .criterion-value {
            margin-top: 8px;
            color: #172033;
            font-size: 23px;
            font-weight: 950;
          }

          .criterion-sub {
            margin-top: 4px;
            color: #94a3b8;
            font-size: 10px;
          }

          .class-list {
            display: flex;
            flex-direction: column;
            gap: 13px;
            margin-top: 18px;
          }

          .class-row {
            display: grid;
            grid-template-columns: minmax(85px, .7fr) minmax(80px, 1.5fr) 43px;
            align-items: center;
            gap: 10px;
            width: 100%;
            padding: 0;
            border: 0;
            background: transparent;
            text-align: left;
            cursor: pointer;
          }

          .class-name {
            color: #475569;
            font-size: 11px;
            font-weight: 850;
            overflow-wrap: anywhere;
          }

          .class-track {
            height: 9px;
            overflow: hidden;
            border-radius: 20px;
            background: #edf2f8;
          }

          .class-fill {
            height: 100%;
            border-radius: inherit;
            background: linear-gradient(90deg, #0ea5e9, #2563eb);
          }

          .class-rate {
            color: #1e293b;
            text-align: right;
            font-size: 11px;
            font-weight: 900;
          }

          .class-meta {
            grid-column: 2 / 4;
            margin-top: -8px;
            color: #94a3b8;
            font-size: 10px;
          }

          .toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
            margin: 15px 0;
          }

          .toolbar-left,
          .toolbar-right {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
          }

          .input,
          .select {
            height: 40px;
            min-width: 145px;
            padding: 0 12px;
            border: 1px solid #dbe3ef;
            border-radius: 10px;
            outline: none;
            color: #334155;
            background: white;
            font-size: 12px;
          }

          .input {
            width: 270px;
          }

          .input:focus,
          .select:focus {
            border-color: #60a5fa;
            box-shadow: 0 0 0 3px #dbeafe;
          }

          .filter-list {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }

          .filter-button {
            padding: 8px 11px;
            border: 1px solid #e2e8f0;
            border-radius: 9px;
            color: #64748b;
            background: white;
            font-size: 10px;
            font-weight: 800;
            cursor: pointer;
            transition: .2s;
          }

          .filter-button.active {
            border-color: #2563eb;
            color: white;
            background: #2563eb;
          }

          .export-button {
            height: 40px;
            padding: 0 14px;
            border: 0;
            border-radius: 10px;
            color: white;
            background: #059669;
            font-size: 11px;
            font-weight: 850;
            cursor: pointer;
          }

          .table-wrap {
            width: 100%;
            overflow-x: auto;
            border: 1px solid #edf1f6;
            border-radius: 12px;
          }

          table {
            width: 100%;
            min-width: 850px;
            border-collapse: collapse;
          }

          th {
            padding: 13px 12px;
            color: #64748b;
            background: #f8fafc;
            text-align: left;
            font-size: 10px;
            white-space: nowrap;
          }

          td {
            padding: 13px 12px;
            border-top: 1px solid #f0f3f7;
            color: #475569;
            font-size: 11px;
          }

          tbody tr:hover {
            background: #f8fbff;
          }

          .student-name {
            color: #1e293b;
            font-weight: 850;
          }

          .student-code {
            color: #64748b;
            font-variant-numeric: tabular-nums;
          }

          .status {
            display: inline-flex;
            padding: 5px 8px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 850;
            white-space: nowrap;
          }

          .green { color: #047857; background: #d1fae5; }
          .orange { color: #c2410c; background: #ffedd5; }
          .red { color: #b91c1c; background: #fee2e2; }
          .blue { color: #1d4ed8; background: #dbeafe; }
          .purple { color: #7e22ce; background: #f3e8ff; }
          .gray { color: #64748b; background: #f1f5f9; }

          .detail-button {
            border: 0;
            color: #2563eb;
            background: transparent;
            font-size: 11px;
            font-weight: 850;
            cursor: pointer;
          }

          .pagination {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            margin-top: 14px;
            color: #94a3b8;
            font-size: 11px;
          }

          .page-buttons {
            display: flex;
            gap: 6px;
          }

          .page-button {
            min-width: 34px;
            height: 34px;
            padding: 0 9px;
            border: 1px solid #e2e8f0;
            border-radius: 9px;
            color: #475569;
            background: white;
            cursor: pointer;
          }

          .page-button:disabled {
            opacity: .4;
            cursor: not-allowed;
          }

          .page-button.active {
            border-color: #2563eb;
            color: white;
            background: #2563eb;
          }

          .empty {
            padding: 35px 12px;
            color: #94a3b8;
            text-align: center;
            font-size: 12px;
          }

          .modal-backdrop {
            position: fixed;
            inset: 0;
            z-index: 2000;
            display: grid;
            place-items: center;
            padding: 16px;
            background: rgba(15,23,42,.55);
            backdrop-filter: blur(5px);
            animation: fade .2s ease;
          }

          .modal {
            width: 100%;
            max-width: 760px;
            max-height: 88vh;
            overflow: auto;
            padding: 23px;
            border-radius: 19px;
            background: white;
            box-shadow: 0 25px 80px rgba(0,0,0,.2);
            animation: rise .25s ease;
          }

          .modal-head {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
          }

          .modal-head h2 {
            margin: 0;
            color: #172033;
            font-size: 19px;
          }

          .modal-close {
            width: 34px;
            height: 34px;
            border: 1px solid #e2e8f0;
            border-radius: 9px;
            color: #64748b;
            background: white;
            font-size: 19px;
            cursor: pointer;
          }

          .detail-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-top: 18px;
          }

          .detail-box {
            padding: 13px;
            border: 1px solid #edf1f6;
            border-radius: 11px;
            background: #f8fafc;
          }

          .detail-box span {
            display: block;
            color: #94a3b8;
            font-size: 10px;
          }

          .detail-box strong {
            display: block;
            margin-top: 6px;
            color: #1e293b;
            font-size: 13px;
          }

          .detail-criterion {
            display: grid;
            grid-template-columns: minmax(100px, 1fr) 2fr 50px;
            align-items: center;
            gap: 10px;
            margin-top: 14px;
          }

          .detail-criterion span {
            color: #475569;
            font-size: 11px;
            font-weight: 750;
          }

          .detail-track {
            height: 8px;
            overflow: hidden;
            border-radius: 20px;
            background: #edf2f8;
          }

          .detail-fill {
            height: 100%;
            border-radius: inherit;
            background: linear-gradient(90deg, #2563eb, #06b6d4);
          }

          .error-box {
            margin-top: 20px;
            padding: 20px;
            border: 1px solid #fecaca;
            border-radius: 14px;
            color: #b91c1c;
            background: #fef2f2;
          }

          @keyframes rise {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes fade {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @media (max-width: 1100px) {
            .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .criteria-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .task-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .dashboard-grid { grid-template-columns: 1fr; }
          }

          @media (max-width: 650px) {
            .sv5t-stat { padding: 15px 12px 35px; }
            .hero { padding: 21px 17px; border-radius: 17px; }
            .hero-top { flex-direction: column; }
            .year-pill { white-space: normal; }
            .metrics { gap: 9px; }
            .metric { padding: 13px; border-radius: 13px; }
            .metric-value { font-size: 25px; }
            .metric-label { font-size: 10px; }
            .metric-note { font-size: 9px; }
            .panel { padding: 15px; }
            .breakdown { gap: 6px; }
            .breakdown-item { padding: 9px; }
            .breakdown-item strong { font-size: 16px; }
            .task-grid { gap: 8px; }
            .task { padding: 12px; }
            .task-value { font-size: 23px; }
            .criteria-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .criterion { padding: 12px; }
            .toolbar { align-items: stretch; }
            .toolbar-left, .toolbar-right { width: 100%; }
            .input, .select { width: 100%; min-width: 0; }
            .filter-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .filter-button { min-height: 36px; }
            .export-button { width: 100%; }
            .pagination { align-items: flex-start; flex-direction: column; }
            .detail-grid { grid-template-columns: 1fr; }
            .modal { padding: 17px; }
            .detail-criterion { grid-template-columns: 95px minmax(40px, 1fr) 42px; }
          }

          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              animation-duration: .01ms !important;
              transition-duration: .01ms !important;
            }
          }
        `}</style>

        <div className="container">
          <section className="hero">
            <div className="hero-top">
              <div>
                <div className="eyebrow">
                  BMU · STUDENT FIVE-GOOD TRACKING
                </div>
                <h1>Trung tâm điều hành SV5T</h1>
                <p>
                  Theo dõi tiến độ hồ sơ, phân tích kết quả tiêu chí
                  và xác định những nội dung cần ưu tiên xử lý.
                </p>
              </div>

              {academicYear && (
                <div className="year-pill">
                  <span>●</span>
                  Năm học {academicYear.name}
                </div>
              )}
            </div>

            <div className="hero-actions">
              <button
                className="hero-button"
                onClick={() => loadData(true)}
                disabled={loading || refreshing}
              >
                {refreshing ? "◌ Đang cập nhật..." : "↻ Làm mới dữ liệu"}
              </button>

              <button
                className="hero-button"
                onClick={exportCsv}
                disabled={loading || filteredStudents.length === 0}
              >
                ↓ Xuất danh sách đang lọc
              </button>
            </div>
          </section>

          {loading ? (
            <div className="panel section" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 25 }}>◌</div>
              <strong>Đang tổng hợp dữ liệu SV5T...</strong>
            </div>
          ) : error ? (
            <div className="error-box">
              <strong>Không thể tải dữ liệu thống kê</strong>
              <p>{error}</p>
              <button
                className="hero-button"
                style={{
                  color: "#1d4ed8",
                  background: "white",
                  borderColor: "#bfdbfe",
                }}
                onClick={() => loadData()}
              >
                Thử tải lại
              </button>
            </div>
          ) : (
            <>
              <section className="section">
                <div className="section-head">
                  <div>
                    <h2>Bức tranh tổng thể</h2>
                    <p>Các chỉ số trọng tâm của năm học hiện tại</p>
                  </div>
                </div>

                <div className="metrics">
                  <button
                    className="metric"
                    style={{ "--accent": "#2563eb", "--soft": "#dbeafe" } as React.CSSProperties}
                    onClick={() => applyFilter("all")}
                  >
                    <div className="metric-top">
                      <span className="metric-label">Tổng sinh viên</span>
                      <span className="metric-icon">♙</span>
                    </div>
                    <div className="metric-value">
                      {numberFormat(overview.total)}
                    </div>
                    <div className="metric-note">Quy mô sinh viên trong hệ thống</div>
                  </button>

                  <button
                    className="metric"
                    style={{ "--accent": "#059669", "--soft": "#d1fae5" } as React.CSSProperties}
                    onClick={() => applyFilter("submitted")}
                  >
                    <div className="metric-top">
                      <span className="metric-label">Đã nộp hồ sơ</span>
                      <span className="metric-icon">✓</span>
                    </div>
                    <div className="metric-value">
                      {numberFormat(overview.submitted)}
                    </div>
                    <div className="metric-note">
                      {overview.submissionRate.toFixed(1)}% tổng sinh viên
                    </div>
                  </button>

                  <button
                    className="metric"
                    style={{ "--accent": "#d97706", "--soft": "#fef3c7" } as React.CSSProperties}
                    onClick={() => applyFilter("pending")}
                  >
                    <div className="metric-top">
                      <span className="metric-label">Có hồ sơ - chưa nộp</span>
                      <span className="metric-icon">◷</span>
                    </div>
                    <div className="metric-value">
                      {numberFormat(overview.pending)}
                    </div>
                    <div className="metric-note">Cần nhắc nhở hoàn thiện</div>
                  </button>

                  <button
                    className="metric"
                    style={{ "--accent": "#dc2626", "--soft": "#fee2e2" } as React.CSSProperties}
                    onClick={() => applyFilter("no-profile")}
                  >
                    <div className="metric-top">
                      <span className="metric-label">Chưa tạo hồ sơ</span>
                      <span className="metric-icon">!</span>
                    </div>
                    <div className="metric-value">
                      {numberFormat(overview.noProfile)}
                    </div>
                    <div className="metric-note">Cần hướng dẫn đăng ký</div>
                  </button>
                </div>
              </section>

              <section className="section dashboard-grid">
                <div className="panel">
                  <h3 className="panel-title">Tiến độ nộp hồ sơ</h3>
                  <div className="panel-subtitle">
                    Tỷ lệ sinh viên đã nộp trên tổng số sinh viên
                  </div>

                  <div className="progress-large">
                    <strong>{overview.submissionRate.toFixed(1)}%</strong>
                    <span>
                      {numberFormat(overview.submitted)} / {numberFormat(overview.total)}
                    </span>
                  </div>

                  <div className="track">
                    <div
                      className="fill"
                      style={{
                        width: `${Math.min(overview.submissionRate, 100)}%`,
                      }}
                    />
                  </div>

                  <div className="breakdown">
                    <div className="breakdown-item">
                      <strong>{numberFormat(overview.submitted)}</strong>
                      <span>Đã nộp</span>
                    </div>
                    <div className="breakdown-item">
                      <strong>{numberFormat(overview.pending)}</strong>
                      <span>Chưa nộp</span>
                    </div>
                    <div className="breakdown-item">
                      <strong>{numberFormat(overview.noProfile)}</strong>
                      <span>Chưa tạo</span>
                    </div>
                  </div>
                </div>

                <div className="panel">
                  <h3 className="panel-title">Chỉ số đánh giá</h3>
                  <div className="panel-subtitle">
                    Tiến độ đánh giá dựa trên các mục tiêu chí đã cấu hình
                  </div>

                  <div className="insight" style={{ "--accent": "#2563eb", "--soft": "#dbeafe" } as React.CSSProperties}>
                    <div className="insight-icon">◉</div>
                    <div>
                      <strong>{numberFormat(overview.fullyEvaluated)} sinh viên đủ dữ liệu 5 tiêu chí</strong>
                      <span>
                        {overview.evaluationRate.toFixed(1)}% tổng sinh viên
                      </span>
                    </div>
                  </div>

                  <div className="insight" style={{ "--accent": "#059669", "--soft": "#d1fae5" } as React.CSSProperties}>
                    <div className="insight-icon">★</div>
                    <div>
                      <strong>{numberFormat(overview.achieved)} sinh viên đạt đủ 5 tiêu chí</strong>
                      <span>Đạt 100% ở cả năm tiêu chí</span>
                    </div>
                  </div>

                  <div className="insight" style={{ "--accent": "#d97706", "--soft": "#fef3c7" } as React.CSSProperties}>
                    <div className="insight-icon">↗</div>
                    <div>
                      <strong>Tiến độ đánh giá trung bình</strong>
                      <span>{overview.averageProgress.toFixed(1)}% trên các hồ sơ đủ dữ liệu</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="section">
                <div className="section-head">
                  <div>
                    <h2>Danh sách công việc cần ưu tiên</h2>
                    <p>Bấm vào từng nhóm để lọc sinh viên cần theo dõi</p>
                  </div>
                </div>

                <div className="task-grid">
                  <button className="task" onClick={() => applyFilter("pending")}>
                    <div className="task-label">Hồ sơ chưa nộp</div>
                    <div className="task-value">{numberFormat(taskLists.notSubmitted.length)}</div>
                    <div className="task-action">Xem danh sách →</div>
                  </button>

                  <button className="task" onClick={() => applyFilter("not-evaluated")}>
                    <div className="task-label">Chờ đánh giá</div>
                    <div className="task-value">{numberFormat(taskLists.notEvaluated.length)}</div>
                    <div className="task-action">Xem danh sách →</div>
                  </button>

                  <button className="task" onClick={() => applyFilter("in-progress")}>
                    <div className="task-label">Đang hoàn thiện tiêu chí</div>
                    <div className="task-value">{numberFormat(taskLists.inProgress.length)}</div>
                    <div className="task-action">Xem danh sách →</div>
                  </button>

                  <button className="task" onClick={() => applyFilter("achieved")}>
                    <div className="task-label">Đạt đủ 5 tiêu chí</div>
                    <div className="task-value">{numberFormat(taskLists.achieved.length)}</div>
                    <div className="task-action">Xem danh sách →</div>
                  </button>
                </div>
              </section>

              <section className="section">
                <div className="section-head">
                  <div>
                    <h2>Phân tích 5 tiêu chí SV5T</h2>
                    <p>Tỷ lệ sinh viên đạt 100% ở từng tiêu chí</p>
                  </div>
                </div>

                <div className="criteria-grid">
                  {criterionStats.map((criterion) => (
                    <div className="criterion" key={criterion.key}>
                      <div
                        className="criterion-icon"
                        style={{ "--accent": criterion.color } as React.CSSProperties}
                      >
                        {criterion.icon}
                      </div>
                      <div className="criterion-name">{criterion.label}</div>
                      <div className="criterion-value">
                        {criterion.rate.toFixed(1)}%
                      </div>
                      <div className="criterion-sub">
                        {criterion.achieved}/{criterion.total} đạt
                      </div>
                      <div className="track" style={{ height: 6 }}>
                        <div
                          className="fill"
                          style={{
                            width: `${criterion.rate}%`,
                            background: criterion.color,
                          }}
                        />
                      </div>
                      <div className="criterion-sub">
                        Trung bình: {criterion.average.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="section dashboard-grid">
                <div className="panel">
                  <div className="section-head">
                    <div>
                      <h2>Xếp hạng tiến độ theo lớp</h2>
                      <p>Ưu tiên các lớp có tỷ lệ nộp thấp</p>
                    </div>
                    <button
                      className="detail-button"
                      onClick={() => setShowAllClasses(!showAllClasses)}
                    >
                      {showAllClasses ? "Thu gọn" : "Xem tất cả"}
                    </button>
                  </div>

                  <div className="class-list">
                    {(showAllClasses ? classStats : classStats.slice(0, 8)).map(
                      (item) => (
                        <button
                          className="class-row"
                          key={item.name}
                          onClick={() => {
                            setClassFilter(item.name);
                            setFilter("all");
                            setSearch("");
                          }}
                        >
                          <span className="class-name">{item.name}</span>
                          <span className="class-track">
                            <span
                              className="class-fill"
                              style={{
                                display: "block",
                                width: `${item.submissionRate}%`,
                              }}
                            />
                          </span>
                          <span className="class-rate">
                            {item.submissionRate.toFixed(0)}%
                          </span>
                          <span className="class-meta">
                            {item.submitted}/{item.total} đã nộp · {item.pending} chưa nộp · {item.noProfile} chưa tạo
                          </span>
                        </button>
                      )
                    )}

                    {classStats.length === 0 && (
                      <div className="empty">Chưa có dữ liệu lớp.</div>
                    )}
                  </div>
                </div>

                <div className="panel">
                  <h3 className="panel-title">Góc nhìn điều hành</h3>
                  <div className="panel-subtitle">
                    Các chỉ số hỗ trợ phân công và đôn đốc
                  </div>

                  <div className="insight" style={{ "--accent": "#dc2626", "--soft": "#fee2e2" } as React.CSSProperties}>
                    <div className="insight-icon">!</div>
                    <div>
                      <strong>{numberFormat(overview.pending + overview.noProfile)} sinh viên chưa nộp hồ sơ</strong>
                      <span>Cần rà soát, nhắc nhở và hỗ trợ đăng ký</span>
                    </div>
                  </div>

                  <div className="insight" style={{ "--accent": "#d97706", "--soft": "#fef3c7" } as React.CSSProperties}>
                    <div className="insight-icon">◷</div>
                    <div>
                      <strong>{numberFormat(taskLists.notEvaluated.length)} sinh viên chờ đánh giá</strong>
                      <span>Đã nộp hồ sơ nhưng chưa có dữ liệu đánh giá</span>
                    </div>
                  </div>

                  <div className="insight" style={{ "--accent": "#059669", "--soft": "#d1fae5" } as React.CSSProperties}>
                    <div className="insight-icon">★</div>
                    <div>
                      <strong>{numberFormat(overview.achieved)} sinh viên đạt đủ tiêu chí</strong>
                      <span>Có thể ưu tiên rà soát, tổng hợp kết quả</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="section panel">
                <div className="section-head">
                  <div>
                    <h2>Tra cứu và quản lý sinh viên</h2>
                    <p>Tìm kiếm, lọc, xem tiến độ và xuất dữ liệu phục vụ báo cáo</p>
                  </div>
                </div>

                <div className="toolbar">
                  <div className="toolbar-left">
                    <input
                      className="input"
                      placeholder="Tìm họ tên, MSSV, lớp..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />

                    <select
                      className="select"
                      value={classFilter}
                      onChange={(e) => setClassFilter(e.target.value)}
                    >
                      <option value="all">Tất cả lớp</option>
                      {classes.map((name) => (
                        <option value={name} key={name}>{name}</option>
                      ))}
                    </select>

                    <select
                      className="select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="progress">Tiến độ cao trước</option>
                      <option value="name">Theo họ tên</option>
                      <option value="class">Theo lớp</option>
                      <option value="submitted">Đã nộp trước</option>
                    </select>
                  </div>

                  <div className="toolbar-right">
                    <button className="export-button" onClick={exportCsv}>
                      ↓ Xuất CSV ({filteredStudents.length})
                    </button>
                  </div>
                </div>

                <div className="toolbar">
                  <div className="filter-list">
                    {(Object.keys(filterLabels) as FilterType[]).map((key) => (
                      <button
                        key={key}
                        className={`filter-button ${filter === key ? "active" : ""}`}
                        onClick={() => setFilter(key)}
                      >
                        {filterLabels[key]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>HỌ VÀ TÊN</th>
                        <th>MSSV</th>
                        <th>LỚP</th>
                        <th>TRẠNG THÁI HỒ SƠ</th>
                        <th>TIẾN ĐỘ TIÊU CHÍ</th>
                        <th>KẾT QUẢ</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageStudents.length === 0 ? (
                        <tr>
                          <td colSpan={8}>
                            <div className="empty">Không tìm thấy sinh viên phù hợp.</div>
                          </td>
                        </tr>
                      ) : (
                        pageStudents.map((student, index) => {
                          const status = getStatus(student);

                          return (
                            <tr key={student.id}>
                              <td>{(page - 1) * pageSize + index + 1}</td>
                              <td>
                                <span className="student-name">
                                  {student.ho_ten || "Chưa cập nhật"}
                                </span>
                              </td>
                              <td>
                                <span className="student-code">
                                  {student.mssv || "—"}
                                </span>
                              </td>
                              <td>{student.lop || "—"}</td>
                              <td>
                                <span className={`status ${student.is_submitted ? "green" : student.hasYearProfile ? "orange" : "red"}`}>
                                  {student.is_submitted
                                    ? "Đã nộp"
                                    : student.hasYearProfile
                                      ? "Chưa nộp"
                                      : "Chưa tạo"}
                                </span>
                              </td>
                              <td>
                                {student.evaluatedCount}/{student.totalItems} mục
                              </td>
                              <td>
                                <span className={`status ${status.type}`}>
                                  {status.label}
                                </span>
                                <div style={{ marginTop: 5, fontWeight: 800 }}>
                                  {formatProgress(student.overall)}
                                </div>
                              </td>
                              <td>
                                <button
                                  className="detail-button"
                                  onClick={() => setSelectedStudent(student)}
                                >
                                  Chi tiết →
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="pagination">
                  <span>
                    Hiển thị {pageStudents.length} / {filteredStudents.length} sinh viên
                  </span>
                  <div className="page-buttons">
                    <button
                      className="page-button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      ←
                    </button>
                    <button className="page-button active">
                      {page}/{totalPages}
                    </button>
                    <button
                      className="page-button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      →
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>

        {selectedStudent && (
          <div
            className="modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedStudent(null);
              }
            }}
          >
            <div className="modal">
              <div className="modal-head">
                <div>
                  <h2>{selectedStudent.ho_ten || "Thông tin sinh viên"}</h2>
                  <div className="panel-subtitle">
                    Hồ sơ SV5T · {academicYear?.name || ""}
                  </div>
                </div>
                <button
                  className="modal-close"
                  onClick={() => setSelectedStudent(null)}
                >
                  ×
                </button>
              </div>

              <div className="detail-grid">
                <div className="detail-box">
                  <span>Mã số sinh viên</span>
                  <strong>{selectedStudent.mssv || "Chưa cập nhật"}</strong>
                </div>
                <div className="detail-box">
                  <span>Lớp</span>
                  <strong>{selectedStudent.lop || "Chưa phân lớp"}</strong>
                </div>
                <div className="detail-box">
                  <span>Trạng thái hồ sơ</span>
                  <strong>
                    {selectedStudent.is_submitted
                      ? "Đã nộp"
                      : selectedStudent.hasYearProfile
                        ? "Chưa nộp"
                        : "Chưa tạo hồ sơ"}
                  </strong>
                </div>
                <div className="detail-box">
                  <span>Tiến độ tổng</span>
                  <strong>{formatProgress(selectedStudent.overall)}</strong>
                </div>
              </div>

              <div style={{ marginTop: 22 }}>
                <h3 className="panel-title">Kết quả từng tiêu chí</h3>

                {CRITERIA.map((criterion) => {
                  const value = selectedStudent.criteria[criterion.key];

                  return (
                    <div className="detail-criterion" key={criterion.key}>
                      <span>{criterion.label}</span>
                      <div className="detail-track">
                        <div
                          className="detail-fill"
                          style={{
                            width: `${value ?? 0}%`,
                            background: criterion.color,
                          }}
                        />
                      </div>
                      <strong style={{ fontSize: 11, textAlign: "right" }}>
                        {value === null ? "—" : `${value.toFixed(1)}%`}
                      </strong>
                    </div>
                  );
                })}
              </div>

              <div className="detail-box" style={{ marginTop: 20 }}>
                <span>Tiến độ đánh giá</span>
                <strong>
                  {selectedStudent.evaluatedCount} / {selectedStudent.totalItems} mục đã đánh giá
                </strong>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
