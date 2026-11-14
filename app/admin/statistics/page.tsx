
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Student = {
  id: string;
  ho_ten: string | null;
  mssv: string | null;
  lop: string | null;
  hasYearProfile: boolean;
  is_submitted: boolean;
  hasCriteria: boolean;
  criteriaSubmitted: boolean;
  "dao-duc": boolean;
  "hoc-tap": boolean;
  "the-luc": boolean;
  "tinh-nguyen": boolean;
  "hoi-nhap": boolean;
};

type FilterType =
  | "all"
  | "submitted"
  | "pending"
  | "no-profile"
  | "no-criteria";

const CRITERIA = [
  { key: "dao-duc", label: "Đạo đức", icon: "◆" },
  { key: "hoc-tap", label: "Học tập", icon: "▤" },
  { key: "the-luc", label: "Thể lực", icon: "♡" },
  { key: "tinh-nguyen", label: "Tình nguyện", icon: "✦" },
  { key: "hoi-nhap", label: "Hội nhập", icon: "◎" },
] as const;

const numberFormat = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value);

export default function StatisticsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");

  const [selectedTitle, setSelectedTitle] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Student[] | null>(
    null
  );
  const [detailSearch, setDetailSearch] = useState("");

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
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
        setCurrentAcademicYear(null);
        setStudents([]);
        setError("Chưa thiết lập năm học hiện tại.");
        return;
      }

      setCurrentAcademicYear(year);

      const [profilesResult, yearProfilesResult, criteriaResult] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, ho_ten, mssv, lop, role")
            .eq("role", "student"),

          supabase
            .from("student_year_profiles")
            .select("user_id, is_submitted")
            .eq("academic_year_id", year.id),

          supabase
            .from("student_criteria_results")
            .select(
              "user_id, is_submitted, dao_duc, hoc_tap, the_luc, tinh_nguyen, hoi_nhap"
            )
            .eq("academic_year_id", year.id),
        ]);

      if (profilesResult.error) throw profilesResult.error;
      if (yearProfilesResult.error) throw yearProfilesResult.error;
      if (criteriaResult.error) throw criteriaResult.error;

      const yearProfileMap = new Map<string, any>();
      (yearProfilesResult.data || []).forEach((item) => {
        yearProfileMap.set(item.user_id, item);
      });

      const criteriaMap = new Map<string, any>();
      (criteriaResult.data || []).forEach((item) => {
        criteriaMap.set(item.user_id, item);
      });

      const result: Student[] = (profilesResult.data || []).map(
        (student: any) => {
          const yearProfile = yearProfileMap.get(student.id);
          const criteria = criteriaMap.get(student.id);

          return {
            id: student.id,
            ho_ten: student.ho_ten,
            mssv: student.mssv,
            lop: student.lop,

            hasYearProfile: !!yearProfile,
            is_submitted: yearProfile?.is_submitted === true,

            hasCriteria: !!criteria,
            criteriaSubmitted: criteria?.is_submitted === true,

            "dao-duc": criteria?.dao_duc === true,
            "hoc-tap": criteria?.hoc_tap === true,
            "the-luc": criteria?.the_luc === true,
            "tinh-nguyen": criteria?.tinh_nguyen === true,
            "hoi-nhap": criteria?.hoi_nhap === true,
          };
        }
      );

      setStudents(result);
    } catch (err: any) {
      console.error("Lỗi tải thống kê:", err);
      setError(err?.message || "Không thể tải dữ liệu thống kê.");
      setStudents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // =====================================================
  // TỔNG QUAN DỮ LIỆU
  // =====================================================

  const overview = useMemo(() => {
    const total = students.length;
    const submitted = students.filter((s) => s.is_submitted);
    const pending = students.filter(
      (s) => s.hasYearProfile && !s.is_submitted
    );
    const noProfile = students.filter((s) => !s.hasYearProfile);
    const hasCriteria = students.filter((s) => s.hasCriteria);

    const submittedWithCriteria = students.filter(
      (s) => s.is_submitted && s.hasCriteria && s.criteriaSubmitted
    );

    const submittedWithoutCriteria = students.filter(
      (s) => s.is_submitted && !s.hasCriteria
    );

    const criteriaNotSubmitted = students.filter(
      (s) => s.is_submitted && s.hasCriteria && !s.criteriaSubmitted
    );

    return {
      total,
      submitted: submitted.length,
      pending: pending.length,
      noProfile: noProfile.length,
      hasCriteria: hasCriteria.length,
      submittedWithCriteria: submittedWithCriteria.length,
      submittedWithoutCriteria: submittedWithoutCriteria.length,
      criteriaNotSubmitted: criteriaNotSubmitted.length,
      completion:
        total === 0 ? 0 : (submitted.length / total) * 100,
      profileRate:
        total === 0
          ? 0
          : ((submitted.length + pending.length) / total) * 100,
    };
  }, [students]);

  // =====================================================
  // LỌC SINH VIÊN
  // =====================================================

  const classes = useMemo(() => {
    return Array.from(
      new Set(students.map((s) => s.lop?.trim()).filter(Boolean))
    ).sort((a, b) =>
      String(a).localeCompare(String(b), "vi", {
        numeric: true,
        sensitivity: "base",
      })
    ) as string[];
  }, [students]);

  const filteredStudents = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return students.filter((s) => {
      const matchesSearch =
        !keyword ||
        `${s.ho_ten || ""} ${s.mssv || ""} ${s.lop || ""}`
          .toLowerCase()
          .includes(keyword);

      const matchesClass =
        classFilter === "all" || s.lop?.trim() === classFilter;

      let matchesFilter = true;

      switch (filter) {
        case "submitted":
          matchesFilter = s.is_submitted;
          break;
        case "pending":
          matchesFilter = s.hasYearProfile && !s.is_submitted;
          break;
        case "no-profile":
          matchesFilter = !s.hasYearProfile;
          break;
        case "no-criteria":
          matchesFilter = s.is_submitted && !s.hasCriteria;
          break;
        default:
          matchesFilter = true;
      }

      return matchesSearch && matchesClass && matchesFilter;
    });
  }, [students, search, classFilter, filter]);

  // =====================================================
  // THỐNG KÊ THEO LỚP
  // =====================================================

  const classStats = useMemo(() => {
    return classes
      .map((className) => {
        const list = students.filter(
          (s) => s.lop?.trim() === className
        );

        const submitted = list.filter((s) => s.is_submitted).length;
        const pending = list.filter(
          (s) => s.hasYearProfile && !s.is_submitted
        ).length;
        const noProfile = list.filter(
          (s) => !s.hasYearProfile
        ).length;

        return {
          name: className,
          total: list.length,
          submitted,
          pending,
          noProfile,
          rate:
            list.length === 0
              ? 0
              : Math.round((submitted / list.length) * 100),
          list,
        };
      })
      .sort((a, b) => {
        if (a.rate !== b.rate) return a.rate - b.rate;
        return b.total - a.total;
      });
  }, [students, classes]);

  // =====================================================
  // PHÂN TÍCH TIÊU CHÍ
  // Chỉ đánh giá khi hồ sơ năm học và bản ghi tiêu chí
  // đều được xác nhận đã nộp.
  // =====================================================

  const eligibleCriteriaStudents = useMemo(
    () =>
      students.filter(
        (s) => s.is_submitted && s.hasCriteria && s.criteriaSubmitted
      ),
    [students]
  );

  const criteriaStats = useMemo(() => {
    return CRITERIA.map((item) => {
      const passed = eligibleCriteriaStudents.filter(
        (s) => s[item.key]
      );

      const notPassed = eligibleCriteriaStudents.filter(
        (s) => !s[item.key]
      );

      const total = eligibleCriteriaStudents.length;

      return {
        ...item,
        passed,
        notPassed,
        total,
        rate:
          total === 0 ? 0 : Math.round((passed.length / total) * 100),
      };
    });
  }, [eligibleCriteriaStudents]);

  // =====================================================
  // DANH SÁCH CHI TIẾT
  // =====================================================

  const showStudents = (title: string, list: Student[]) => {
    setSelectedTitle(title);
    setSelectedStudents(list);
    setDetailSearch("");
  };

  const closeStudents = () => {
    setSelectedStudents(null);
    setDetailSearch("");
  };

  const sortedSelectedStudents = useMemo(() => {
    if (!selectedStudents) return [];

    const keyword = detailSearch.trim().toLowerCase();

    return selectedStudents
      .filter((s) =>
        `${s.ho_ten || ""} ${s.mssv || ""} ${s.lop || ""}`
          .toLowerCase()
          .includes(keyword)
      )
      .sort((a, b) => {
        const classCompare = (a.lop || "").localeCompare(
          b.lop || "",
          "vi",
          { numeric: true, sensitivity: "base" }
        );

        if (classCompare !== 0) return classCompare;

        return (a.mssv || "").localeCompare(b.mssv || "", "vi", {
          numeric: true,
        });
      });
  }, [selectedStudents, detailSearch]);

  // =====================================================
  // CẢNH BÁO DỮ LIỆU
  // =====================================================

  const dataWarnings = useMemo(() => {
    const submittedWithoutCriteria = students.filter(
      (s) => s.is_submitted && !s.hasCriteria
    );

    const mismatch = students.filter(
      (s) => s.is_submitted && s.hasCriteria && !s.criteriaSubmitted
    );

    const classNames = students
      .map((s) => s.lop?.trim())
      .filter(Boolean) as string[];

    const normalizedClasses = new Map<string, Set<string>>();

    classNames.forEach((name) => {
      const key = name.toLowerCase();
      if (!normalizedClasses.has(key)) {
        normalizedClasses.set(key, new Set());
      }
      normalizedClasses.get(key)!.add(name);
    });

    const possibleClassDuplicates = Array.from(
      normalizedClasses.values()
    ).filter((set) => set.size > 1);

    return {
      submittedWithoutCriteria,
      mismatch,
      possibleClassDuplicates,
    };
  }, [students]);

  const percent = (value: number, total: number) =>
    total === 0 ? 0 : Math.round((value / total) * 100);

  const filterLabels: Record<FilterType, string> = {
    all: "Tất cả sinh viên",
    submitted: "Đã nộp hồ sơ",
    pending: "Có hồ sơ - chưa nộp",
    "no-profile": "Chưa tạo hồ sơ",
    "no-criteria": "Thiếu dữ liệu tiêu chí",
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <main className="statistics-page">
      <style jsx>{`
        .statistics-page {
          min-height: 100vh;
          padding: 28px 32px 60px;
          background: #f5f7fb;
          color: #172033;
        }

        .container {
          max-width: 1500px;
          margin: 0 auto;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 26px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 10px 15px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: white;
          color: #475569;
          text-decoration: none;
          font-size: 13px;
          font-weight: 650;
          transition: 0.2s;
        }

        .back-link:hover {
          border-color: #93c5fd;
          color: #2563eb;
          transform: translateY(-1px);
        }

        .refresh-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 15px;
          border: 1px solid #dbeafe;
          border-radius: 10px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
        }

        .refresh-button:hover {
          background: #dbeafe;
        }

        .refresh-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .page-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 25px;
        }

        .eyebrow {
          color: #2563eb;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 1.3px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .page-heading h1 {
          margin: 0;
          font-size: 27px;
          font-weight: 800;
          letter-spacing: -0.8px;
          color: #172033;
        }

        .page-description {
          color: #64748b;
          font-size: 13px;
          margin-top: 8px;
        }

        .year-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          color: #334155;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }

        .year-dot {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          box-shadow: 0 0 0 4px #dcfce7;
        }

        .loading-box,
        .error-box {
          padding: 35px;
          text-align: center;
          border-radius: 16px;
          background: white;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .error-box {
          color: #b91c1c;
          background: #fef2f2;
          border-color: #fecaca;
        }

        .section {
          margin-top: 28px;
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 15px;
        }

        .section-heading h2 {
          margin: 0;
          font-size: 17px;
          font-weight: 800;
          color: #1e293b;
        }

        .section-subtitle {
          color: #94a3b8;
          font-size: 14px;
          margin-top: 5px;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 15px;
        }

        .metric-card {
          position: relative;
          overflow: hidden;
          padding: 18px;
          border: 1px solid #e8edf5;
          border-radius: 16px;
          background: white;
          text-align: left;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
          min-width: 0;
        }

        .metric-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.07);
          border-color: #bfdbfe;
        }

        .metric-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .metric-label {
          color: #64748b;
          font-size: 13px;
          font-weight: 650;
        }

        .metric-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          font-size: 17px;
          font-weight: 800;
        }

        .metric-value {
          font-size: 28px;
          line-height: 1.2;
          font-weight: 850;
          letter-spacing: -1px;
          margin-top: 17px;
          color: #172033;
        }

        .metric-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: #94a3b8;
          font-size: 14px;
          margin-top: 8px;
        }

        .metric-blue .metric-icon {
          background: #eff6ff;
          color: #2563eb;
        }

        .metric-green .metric-icon {
          background: #ecfdf5;
          color: #059669;
        }

        .metric-orange .metric-icon {
          background: #fff7ed;
          color: #ea580c;
        }

        .metric-red .metric-icon {
          background: #fef2f2;
          color: #dc2626;
        }

        .progress-panel {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 20px;
          padding: 20px;
          background: white;
          border: 1px solid #e8edf5;
          border-radius: 17px;
        }

        .progress-main {
          min-width: 0;
        }

        .progress-title {
          font-size: 13px;
          color: #64748b;
          font-weight: 650;
        }

        .progress-number {
          display: flex;
          align-items: baseline;
          gap: 9px;
          margin-top: 13px;
        }

        .progress-number strong {
          font-size: 32px;
          letter-spacing: -1.5px;
          color: #172033;
        }

        .progress-number span {
          color: #94a3b8;
          font-size: 14px;
        }

        .progress-track {
          height: 11px;
          overflow: hidden;
          background: #edf2f7;
          border-radius: 20px;
          margin-top: 15px;
        }

        .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #2563eb, #60a5fa);
          transition: width 0.7s ease;
        }

        .progress-note {
          margin-top: 11px;
          color: #94a3b8;
          font-size: 14px;
        }

        .progress-breakdown {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 15px;
          border-left: 1px solid #edf0f5;
          padding-left: 24px;
        }

        .breakdown-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          font-size: 14px;
        }

        .breakdown-label {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #64748b;
        }

        .legend-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .breakdown-value {
          color: #1e293b;
          font-weight: 800;
          white-space: nowrap;
        }

        .content-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.85fr);
          gap: 18px;
          align-items: start;
        }

        .panel {
          min-width: 0;
          padding: 19px;
          background: white;
          border: 1px solid #e8edf5;
          border-radius: 16px;
        }

        .panel-title {
          font-size: 14px;
          font-weight: 800;
          color: #1e293b;
          margin: 0;
        }

        .panel-description {
          color: #94a3b8;
          font-size: 14px;
          margin-top: 5px;
        }

        .class-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 21px;
        }

        .class-row {
          display: grid;
          grid-template-columns: minmax(75px, 0.7fr) minmax(100px, 1.5fr) 42px;
          align-items: center;
          gap: 12px;
        }

        .class-name {
          color: #475569;
          font-size: 14px;
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .class-track {
          height: 9px;
          background: #f1f5f9;
          border-radius: 20px;
          overflow: hidden;
        }

        .class-fill {
          height: 100%;
          border-radius: 20px;
          background: linear-gradient(90deg, #2563eb, #60a5fa);
          transition: width 0.5s ease;
        }

        .class-rate {
          text-align: right;
          font-size: 14px;
          color: #334155;
          font-weight: 800;
        }

        .class-meta {
          grid-column: 2 / 4;
          margin-top: -9px;
          color: #94a3b8;
          font-size: 14px;
        }

        .empty-state {
          padding: 28px 12px;
          text-align: center;
          color: #94a3b8;
          font-size: 14px;
        }

        .insight-card {
          padding: 14px;
          border-radius: 13px;
          background: #f8fafc;
          border: 1px solid #edf2f7;
          margin-top: 15px;
        }

        .insight-card.warning {
          background: #fff7ed;
          border-color: #fed7aa;
        }

        .insight-card.info {
          background: #eff6ff;
          border-color: #dbeafe;
        }

        .insight-heading {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #334155;
          font-size: 13px;
          font-weight: 800;
        }

        .insight-text {
          color: #64748b;
          font-size: 14px;
          line-height: 1.65;
          margin-top: 8px;
        }

        .insight-number {
          font-size: 20px;
          font-weight: 850;
          color: #1e293b;
          margin-top: 8px;
        }

        .criteria-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 12px;
          margin-top: 17px;
        }

        .criteria-card {
          padding: 14px 12px;
          border: 1px solid #e8edf5;
          border-radius: 13px;
          background: #fbfdff;
          min-width: 0;
        }

        .criteria-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 15px;
          font-weight: 800;
        }

        .criteria-name {
          margin-top: 11px;
          color: #475569;
          font-size: 14px;
          font-weight: 750;
        }

        .criteria-value {
          margin-top: 8px;
          color: #172033;
          font-size: 22px;
          font-weight: 850;
        }

        .criteria-sub {
          color: #94a3b8;
          font-size: 14px;
          margin-top: 3px;
        }

        .criteria-track {
          height: 5px;
          border-radius: 10px;
          background: #e9eef5;
          overflow: hidden;
          margin-top: 12px;
        }

        .criteria-fill {
          height: 100%;
          background: #10b981;
          border-radius: inherit;
        }

        .criteria-empty {
          padding: 24px;
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          border-radius: 13px;
          color: #64748b;
          text-align: center;
          font-size: 14px;
          line-height: 1.7;
          margin-top: 17px;
        }

        .toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin: 18px 0;
        }

        .toolbar-left,
        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 9px;
          flex-wrap: wrap;
        }

        .search-input,
        .select-input {
          height: 40px;
          border: 1px solid #dbe2ea;
          border-radius: 9px;
          padding: 0 12px;
          background: white;
          color: #334155;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .search-input {
          width: 260px;
        }

        .select-input {
          min-width: 165px;
        }

        .search-input:focus,
        .select-input:focus {
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px #dbeafe;
        }

        .filter-tabs {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .filter-tab {
          padding: 8px 11px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          color: #64748b;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
        }

        .filter-tab:hover {
          border-color: #93c5fd;
          color: #2563eb;
        }

        .filter-tab.active {
          color: white;
          background: #2563eb;
          border-color: #2563eb;
        }

        .table-panel {
          padding: 20px;
          background: white;
          border: 1px solid #e8edf5;
          border-radius: 16px;
        }

        .table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 650px;
        }

        .data-table th {
          padding: 13px 12px;
          background: #f8fafc;
          color: #64748b;
          font-size: 14px;
          font-weight: 800;
          text-align: left;
          white-space: nowrap;
          border-bottom: 1px solid #e8edf5;
        }

        .data-table td {
          padding: 13px 12px;
          color: #475569;
          font-size: 14px;
          border-bottom: 1px solid #f1f5f9;
        }

        .data-table tbody tr {
          transition: background 0.15s;
        }

        .data-table tbody tr:hover {
          background: #f8fbff;
        }

        .data-table tbody tr:last-child td {
          border-bottom: none;
        }

        .student-name {
          color: #1e293b;
          font-weight: 750;
        }

        .student-code {
          color: #64748b;
          font-variant-numeric: tabular-nums;
        }

        .status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 750;
          white-space: nowrap;
        }

        .status-green {
          color: #047857;
          background: #d1fae5;
        }

        .status-orange {
          color: #c2410c;
          background: #ffedd5;
        }

        .status-red {
          color: #b91c1c;
          background: #fee2e2;
        }

        .status-gray {
          color: #64748b;
          background: #f1f5f9;
        }

        .detail-button {
          border: none;
          background: transparent;
          color: #2563eb;
          font-size: 14px;
          font-weight: 750;
          cursor: pointer;
        }

        .detail-button:hover {
          text-decoration: underline;
        }

        .table-footer {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          padding-top: 15px;
          color: #94a3b8;
          font-size: 14px;
        }

        .warning-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 16px;
        }

        .warning-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 13px;
          background: #fffaf3;
          border: 1px solid #ffedd5;
          border-radius: 11px;
        }

        .warning-icon {
          color: #ea580c;
          font-size: 15px;
          flex-shrink: 0;
        }

        .warning-content {
          flex: 1;
          min-width: 0;
        }

        .warning-title {
          color: #9a3412;
          font-size: 14px;
          font-weight: 800;
        }

        .warning-description {
          color: #9a6b4c;
          font-size: 14px;
          line-height: 1.6;
          margin-top: 4px;
        }

        .warning-action {
          border: none;
          background: transparent;
          color: #c2410c;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 22px;
          background: rgba(15, 23, 42, 0.48);
          backdrop-filter: blur(4px);
          animation: fadeIn 0.18s ease;
        }

        .modal {
          width: 100%;
          max-width: 900px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: white;
          border-radius: 18px;
          box-shadow: 0 25px 70px rgba(15, 23, 42, 0.2);
          animation: slideUp 0.22s ease;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 20px 23px;
          border-bottom: 1px solid #edf0f5;
        }

        .modal-title {
          color: #172033;
          font-size: 16px;
          font-weight: 850;
        }

        .modal-subtitle {
          color: #94a3b8;
          font-size: 14px;
          margin-top: 5px;
        }

        .close-button {
          width: 34px;
          height: 34px;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          background: white;
          color: #64748b;
          font-size: 18px;
          cursor: pointer;
        }

        .modal-toolbar {
          padding: 13px 22px;
          border-bottom: 1px solid #edf0f5;
        }

        .modal-body {
          padding: 0 22px 18px;
          overflow: auto;
        }

        .modal-body .data-table {
          min-width: 570px;
        }

        .modal-body .data-table th {
          position: sticky;
          top: 0;
          z-index: 1;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 1050px) {
          .overview-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .content-grid {
            grid-template-columns: 1fr;
          }

          .criteria-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 650px) {
          .statistics-page {
            padding: 16px 13px 40px;
          }

          .topbar {
            margin-bottom: 22px;
          }

          .page-heading {
            align-items: flex-start;
            flex-direction: column;
            gap: 13px;
          }

          .page-heading h1 {
            font-size: 22px;
          }

          .year-badge {
            font-size: 14px;
          }

          .overview-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 9px;
          }

          .metric-card {
            padding: 12px;
            border-radius: 13px;
          }

          .metric-label {
            font-size: 14px;
            line-height: 1.4;
          }

          .metric-icon {
            width: 30px;
            height: 30px;
            font-size: 14px;
          }

          .metric-value {
            font-size: 23px;
            margin-top: 12px;
          }

          .metric-foot {
            font-size: 10px;
          }

          .progress-panel {
            grid-template-columns: 1fr;
            gap: 20px;
            padding: 17px;
          }

          .progress-number strong {
            font-size: 28px;
          }

          .progress-breakdown {
            border-left: none;
            border-top: 1px solid #edf0f5;
            padding: 16px 0 0;
          }

          .section {
            margin-top: 23px;
          }

          .section-heading h2 {
            font-size: 15px;
          }

          .panel,
          .table-panel {
            padding: 15px;
            border-radius: 13px;
          }

          .class-row {
            grid-template-columns: minmax(70px, 0.8fr) minmax(70px, 1fr) 38px;
            gap: 8px;
          }

          .class-name {
            font-size: 14px;
          }

          .class-meta {
            font-size: 10px;
          }

          .criteria-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 9px;
          }

          .criteria-card {
            padding: 12px;
          }

          .criteria-value {
            font-size: 20px;
          }

          .toolbar {
            align-items: stretch;
          }

          .toolbar-left,
          .toolbar-right {
            width: 100%;
          }

          .search-input,
          .select-input {
            width: 100%;
            flex: 1;
          }

          .filter-tabs {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            width: 100%;
          }

          .filter-tab {
            text-align: center;
            padding: 9px 5px;
            font-size: 14px;
          }

          .table-footer {
            align-items: flex-start;
            flex-direction: column;
          }

          .modal-backdrop {
            padding: 8px;
          }

          .modal {
            max-height: 90vh;
            border-radius: 14px;
          }

          .modal-header {
            padding: 15px;
          }

          .modal-toolbar {
            padding: 10px 15px;
          }

          .modal-body {
            padding: 0 12px 14px;
          }
        }
      `}</style>

      <div className="container">
        {/* HEADER */}
        <div className="topbar">
          <Link href="/admin" className="back-link">
            <span>←</span>
            Trang chủ
          </Link>

          <button
            className="refresh-button"
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
          >
            <span>{refreshing ? "◌" : "↻"}</span>
            {refreshing ? "Đang cập nhật..." : "Làm mới dữ liệu"}
          </button>
        </div>

        <div className="page-heading">
          <div>
            <h1>Thống kê và quản lý hồ sơ</h1>
          </div>

          {currentAcademicYear && (
            <div className="year-badge">
              <span className="year-dot" />
              Năm học {currentAcademicYear.name}
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading-box">Đang tải dữ liệu thống kê...</div>
        ) : error ? (
          <div className="error-box">
            <strong>Không thể tải dữ liệu</strong>
            <div style={{ marginTop: 8 }}>{error}</div>
            <button
              className="refresh-button"
              style={{ marginTop: 16 }}
              onClick={() => loadData()}
            >
              Thử tải lại
            </button>
          </div>
        ) : (
          <>
            {/* TỔNG QUAN */}
            <section className="section">
              <div className="section-heading">
                <div>
                  <h2>Tổng quan năm học</h2>
                  
                </div>
              </div>

              <div className="overview-grid">
                <button
                  className="metric-card metric-blue"
                  onClick={() =>
                    showStudents("Toàn bộ sinh viên", students)
                  }
                >
                  <div className="metric-top">
                    <span className="metric-label">Tổng sinh viên</span>
                    <span className="metric-icon">♙</span>
                  </div>
                  <div className="metric-value">
                    {numberFormat(overview.total)}
                  </div>
                  <div className="metric-foot">
                    <span>Quy mô dữ liệu hiện tại</span>
                    <span>Chi tiết →</span>
                  </div>
                </button>

                <button
                  className="metric-card metric-green"
                  onClick={() =>
                    showStudents(
                      "Sinh viên đã nộp hồ sơ",
                      students.filter((s) => s.is_submitted)
                    )
                  }
                >
                  <div className="metric-top">
                    <span className="metric-label">Đã nộp hồ sơ</span>
                    <span className="metric-icon">✓</span>
                  </div>
                  <div className="metric-value">
                    {numberFormat(overview.submitted)}
                  </div>
                  <div className="metric-foot">
                    <span>
                      {percent(overview.submitted, overview.total)}% tổng sinh viên
                    </span>
                    <span>Chi tiết →</span>
                  </div>
                </button>

                <button
                  className="metric-card metric-orange"
                  onClick={() =>
                    showStudents(
                      "Sinh viên có hồ sơ nhưng chưa nộp",
                      students.filter(
                        (s) => s.hasYearProfile && !s.is_submitted
                      )
                    )
                  }
                >
                  <div className="metric-top">
                    <span className="metric-label">Có hồ sơ - chưa nộp</span>
                    <span className="metric-icon">◷</span>
                  </div>
                  <div className="metric-value">
                    {numberFormat(overview.pending)}
                  </div>
                  <div className="metric-foot">
                    <span>Cần tiếp tục hoàn thiện</span>
                    <span>Chi tiết →</span>
                  </div>
                </button>

                <button
                  className="metric-card metric-red"
                  onClick={() =>
                    showStudents(
                      "Sinh viên chưa tạo hồ sơ năm học",
                      students.filter((s) => !s.hasYearProfile)
                    )
                  }
                >
                  <div className="metric-top">
                    <span className="metric-label">Chưa tạo hồ sơ</span>
                    <span className="metric-icon">!</span>
                  </div>
                  <div className="metric-value">
                    {numberFormat(overview.noProfile)}
                  </div>
                  <div className="metric-foot">
                    <span>Cần hướng dẫn đăng ký</span>
                    <span>Chi tiết →</span>
                  </div>
                </button>
              </div>
            </section>

            {/* TIẾN ĐỘ */}
            <section className="section">
              <div className="section-heading">
                <div>
                  <h2>Tiến độ thực hiện</h2>
                  <div className="section-subtitle">
                    Tỷ lệ hồ sơ đã nộp trên tổng số sinh viên
                  </div>
                </div>
              </div>

              <div className="progress-panel">
                <div className="progress-main">
                  <div className="progress-title">
                    Tỷ lệ sinh viên hoàn thành nộp hồ sơ
                  </div>

                  <div className="progress-number">
                    <strong>{overview.completion.toFixed(1)}%</strong>
                    <span>
                      {numberFormat(overview.submitted)} /{" "}
                      {numberFormat(overview.total)} sinh viên
                    </span>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(overview.completion, 100)}%`,
                      }}
                    />
                  </div>

                  <div className="progress-note">
                    Tỷ lệ được tính trên toàn bộ sinh viên có vai trò student
                    trong hệ thống.
                  </div>
                </div>

                <div className="progress-breakdown">
                  <div className="breakdown-row">
                    <div className="breakdown-label">
                      <span
                        className="legend-dot"
                        style={{ background: "#10b981" }}
                      />
                      Đã nộp hồ sơ
                    </div>
                    <span className="breakdown-value">
                      {numberFormat(overview.submitted)}
                    </span>
                  </div>

                  <div className="breakdown-row">
                    <div className="breakdown-label">
                      <span
                        className="legend-dot"
                        style={{ background: "#f59e0b" }}
                      />
                      Có hồ sơ nhưng chưa nộp
                    </div>
                    <span className="breakdown-value">
                      {numberFormat(overview.pending)}
                    </span>
                  </div>

                  <div className="breakdown-row">
                    <div className="breakdown-label">
                      <span
                        className="legend-dot"
                        style={{ background: "#ef4444" }}
                      />
                      Chưa tạo hồ sơ
                    </div>
                    <span className="breakdown-value">
                      {numberFormat(overview.noProfile)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* PHÂN TÍCH THEO LỚP */}
            <section className="section">
              <div className="section-heading">
                <div>
                  <h2>Tiến độ theo lớp</h2>
                  <div className="section-subtitle">
                    Ưu tiên những lớp có tỷ lệ nộp thấp để triển khai đôn đốc
                  </div>
                </div>
              </div>

              <div className="content-grid">
                <div className="panel">
                  <h3 className="panel-title">Tỷ lệ nộp hồ sơ theo lớp</h3>
                  <div className="panel-description">
                    Sắp xếp từ tỷ lệ hoàn thành thấp đến cao
                  </div>

                  {classStats.length === 0 ? (
                    <div className="empty-state">
                      Chưa có dữ liệu lớp học.
                    </div>
                  ) : (
                    <div className="class-list">
                      {classStats.slice(0, 12).map((item) => (
                        <button
                          key={item.name}
                          className="class-row"
                          style={{
                            width: "100%",
                            border: "none",
                            background: "transparent",
                            padding: 0,
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setClassFilter(item.name);
                            setFilter("all");
                            setSelectedStudents(null);
                          }}
                        >
                          <span className="class-name">{item.name}</span>

                          <span className="class-track">
                            <span
                              className="class-fill"
                              style={{ width: `${item.rate}%` }}
                            />
                          </span>

                          <span className="class-rate">{item.rate}%</span>

                          <span className="class-meta">
                            {item.submitted}/{item.total} đã nộp ·{" "}
                            {item.pending} chưa nộp · {item.noProfile} chưa tạo
                            hồ sơ
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {classStats.length > 12 && (
                    <div className="progress-note">
                      Đang hiển thị 12 lớp có tỷ lệ nộp thấp nhất. Xem đầy đủ
                      trong bảng quản lý bên dưới.
                    </div>
                  )}
                </div>

                <div className="panel">
                  <h3 className="panel-title">Nhận định điều hành</h3>
                  <div className="panel-description">
                    Các chỉ số cần Ban Chủ nhiệm quan tâm
                  </div>

                  <div className="insight-card warning">
                    <div className="insight-heading">
                      <span>⚑</span>
                      Khối lượng hồ sơ cần đôn đốc
                    </div>
                    <div className="insight-number">
                      {numberFormat(overview.pending + overview.noProfile)}
                    </div>
                    <div className="insight-text">
                      Sinh viên chưa hoàn thành nộp hồ sơ, gồm người đã tạo hồ
                      sơ nhưng chưa nộp và người chưa tạo hồ sơ.
                    </div>
                  </div>

                  <div className="insight-card info">
                    <div className="insight-heading">
                      <span>▦</span>
                      Mức độ tạo hồ sơ
                    </div>
                    <div className="insight-number">
                      {overview.profileRate.toFixed(1)}%
                    </div>
                    <div className="insight-text">
                      {numberFormat(overview.pending + overview.submitted)} sinh
                      viên đã có hồ sơ năm học trên tổng số{" "}
                      {numberFormat(overview.total)} sinh viên.
                    </div>
                  </div>

                  <div className="insight-card">
                    <div className="insight-heading">
                      <span>◎</span>
                      Dữ liệu tiêu chí
                    </div>
                    <div className="insight-number">
                      {numberFormat(overview.hasCriteria)}
                    </div>
                    <div className="insight-text">
                      Sinh viên có bản ghi tiêu chí trong năm học hiện tại.
                      Chưa sử dụng dữ liệu này để kết luận đạt/chưa đạt khi
                      hồ sơ chưa được xác nhận nộp.
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* TIÊU CHÍ */}
            <section className="section">
              <div className="section-heading">
                <div>
                  <h2>Phân tích 5 tiêu chí</h2>
                  <div className="section-subtitle">
                    Chỉ tính trên hồ sơ năm học đã nộp và bản ghi tiêu chí đã
                    được xác nhận nộp
                  </div>
                </div>
              </div>

              {eligibleCriteriaStudents.length === 0 ? (
                <div className="criteria-empty">
                  <strong>Chưa đủ dữ liệu để phân tích kết quả 5 tiêu chí.</strong>
                  <br />
                  Hiện chưa có sinh viên nào đồng thời có hồ sơ năm học đã nộp
                  và bản ghi tiêu chí được xác nhận đã nộp.
                  <br />
                  Khi dữ liệu được cập nhật, hệ thống sẽ tự động hiển thị tỷ lệ
                  đạt của từng tiêu chí tại đây.
                </div>
              ) : (
                <div className="criteria-grid">
                  {criteriaStats.map((item) => (
                    <div className="criteria-card" key={item.key}>
                      <div className="criteria-icon">{item.icon}</div>
                      <div className="criteria-name">{item.label}</div>
                      <div className="criteria-value">{item.rate}%</div>
                      <div className="criteria-sub">
                        {item.passed.length}/{item.total} đạt
                      </div>
                      <div className="criteria-track">
                        <div
                          className="criteria-fill"
                          style={{ width: `${item.rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* DANH SÁCH QUẢN LÝ */}
            <section className="section">
              <div className="section-heading">
                <div>
                  <h2>Quản lý danh sách sinh viên</h2>
                  <div className="section-subtitle">
                    Tìm kiếm, lọc và truy xuất danh sách phục vụ công tác theo
                    dõi
                  </div>
                </div>
              </div>

              <div className="table-panel">
                <div className="toolbar">
                  <div className="toolbar-left">
                    <input
                      className="search-input"
                      placeholder="⌕  Tìm họ tên, MSSV, lớp..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />

                    <select
                      className="select-input"
                      value={classFilter}
                      onChange={(e) => setClassFilter(e.target.value)}
                    >
                      <option value="all">Tất cả lớp</option>
                      {classes.map((className) => (
                        <option key={className} value={className}>
                          {className}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="toolbar">
                  <div className="filter-tabs">
                    {(
                      [
                        "all",
                        "submitted",
                        "pending",
                        "no-profile",
                        "no-criteria",
                      ] as FilterType[]
                    ).map((item) => (
                      <button
                        key={item}
                        className={`filter-tab ${
                          filter === item ? "active" : ""
                        }`}
                        onClick={() => setFilter(item)}
                      >
                        {filterLabels[item]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 55 }}>STT</th>
                        <th>Họ và tên</th>
                        <th>MSSV</th>
                        <th>Lớp</th>
                        <th>Trạng thái hồ sơ</th>
                        <th>Dữ liệu tiêu chí</th>
                        <th style={{ textAlign: "right" }}>Chi tiết</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={7}>
                            <div className="empty-state">
                              Không tìm thấy sinh viên phù hợp.
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((s, index) => (
                          <tr key={s.id}>
                            <td>{index + 1}</td>
                            <td>
                              <span className="student-name">
                                {s.ho_ten || "Chưa cập nhật"}
                              </span>
                            </td>
                            <td>
                              <span className="student-code">
                                {s.mssv || "—"}
                              </span>
                            </td>
                            <td>{s.lop || "Chưa phân lớp"}</td>
                            <td>
                              {s.is_submitted ? (
                                <span className="status status-green">
                                  ✓ Đã nộp
                                </span>
                              ) : s.hasYearProfile ? (
                                <span className="status status-orange">
                                  ◷ Chưa nộp
                                </span>
                              ) : (
                                <span className="status status-red">
                                  ! Chưa tạo hồ sơ
                                </span>
                              )}
                            </td>
                            <td>
                              {s.hasCriteria ? (
                                s.criteriaSubmitted ? (
                                  <span className="status status-green">
                                    Đã nộp tiêu chí
                                  </span>
                                ) : (
                                  <span className="status status-orange">
                                    Chưa xác nhận nộp
                                  </span>
                                )
                              ) : (
                                <span className="status status-gray">
                                  Chưa có dữ liệu
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                className="detail-button"
                                onClick={() =>
                                  showStudents(
                                    `Thông tin sinh viên: ${s.ho_ten || s.mssv}`,
                                    [s]
                                  )
                                }
                              >
                                Xem →
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="table-footer">
                  <span>
                    Hiển thị {numberFormat(filteredStudents.length)} /{" "}
                    {numberFormat(students.length)} sinh viên
                  </span>
                  <span>
                    Bộ lọc: {filterLabels[filter]}
                    {classFilter !== "all" ? ` · Lớp ${classFilter}` : ""}
                  </span>
                </div>
              </div>
            </section>

            {/* KIỂM SOÁT CHẤT LƯỢNG DỮ LIỆU */}
            <section className="section">
              <div className="section-heading">
                <div>
                  <h2>Kiểm soát chất lượng dữ liệu</h2>
                  <div className="section-subtitle">
                    Những vấn đề cần rà soát để bảo đảm báo cáo chính xác
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="warning-list">
                  <div className="warning-row">
                    <span className="warning-icon">⚠</span>
                    <div className="warning-content">
                      <div className="warning-title">
                        Hồ sơ đã nộp nhưng thiếu bản ghi tiêu chí
                      </div>
                      <div className="warning-description">
                        Có {dataWarnings.submittedWithoutCriteria.length} sinh
                        viên đã nộp hồ sơ năm học nhưng chưa có bản ghi trong
                        student_criteria_results.
                      </div>
                    </div>
                    <button
                      className="warning-action"
                      onClick={() =>
                        showStudents(
                          "Đã nộp hồ sơ nhưng thiếu dữ liệu tiêu chí",
                          dataWarnings.submittedWithoutCriteria
                        )
                      }
                    >
                      Xem danh sách →
                    </button>
                  </div>

                  <div className="warning-row">
                    <span className="warning-icon">⚠</span>
                    <div className="warning-content">
                      <div className="warning-title">
                        Trạng thái nộp giữa hai bảng chưa đồng nhất
                      </div>
                      <div className="warning-description">
                        Có {dataWarnings.mismatch.length} sinh viên đã nộp hồ
                        sơ năm học nhưng bản ghi tiêu chí chưa được xác nhận
                        nộp. Cần kiểm tra quy trình cập nhật dữ liệu.
                      </div>
                    </div>
                    <button
                      className="warning-action"
                      onClick={() =>
                        showStudents(
                          "Trạng thái nộp giữa hai bảng chưa đồng nhất",
                          dataWarnings.mismatch
                        )
                      }
                    >
                      Xem danh sách →
                    </button>
                  </div>

                  <div className="warning-row">
                    <span className="warning-icon">ⓘ</span>
                    <div className="warning-content">
                      <div className="warning-title">
                        Tên lớp có thể chưa được chuẩn hóa
                      </div>
                      <div className="warning-description">
                        Phát hiện{" "}
                        {dataWarnings.possibleClassDuplicates.length} nhóm tên
                        lớp có khác biệt chữ hoa/thường. Cần rà soát trước khi
                        sử dụng báo cáo tổng hợp theo lớp.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {/* MODAL DANH SÁCH SINH VIÊN */}
      {selectedStudents !== null && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeStudents();
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-title">{selectedTitle}</div>
                <div className="modal-subtitle">
                  {numberFormat(selectedStudents.length)} sinh viên trong danh
                  sách
                </div>
              </div>

              <button
                className="close-button"
                onClick={closeStudents}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="modal-toolbar">
              <input
                className="search-input"
                style={{ width: "100%" }}
                placeholder="⌕  Tìm theo họ tên, MSSV hoặc lớp..."
                value={detailSearch}
                onChange={(e) => setDetailSearch(e.target.value)}
              />
            </div>

            <div className="modal-body">
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Họ tên</th>
                      <th>MSSV</th>
                      <th>Lớp</th>
                      <th>Trạng thái hồ sơ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSelectedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5}>
                          <div className="empty-state">
                            Không tìm thấy sinh viên.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      sortedSelectedStudents.map((s, index) => (
                        <tr key={s.id}>
                          <td>{index + 1}</td>
                          <td>
                            <span className="student-name">
                              {s.ho_ten || "Chưa cập nhật"}
                            </span>
                          </td>
                          <td>{s.mssv || "—"}</td>
                          <td>{s.lop || "—"}</td>
                          <td>
                            {s.is_submitted ? (
                              <span className="status status-green">
                                Đã nộp
                              </span>
                            ) : s.hasYearProfile ? (
                              <span className="status status-orange">
                                Chưa nộp
                              </span>
                            ) : (
                              <span className="status status-red">
                                Chưa tạo hồ sơ
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="table-footer">
                <span>
                  Hiển thị {sortedSelectedStudents.length} /{" "}
                  {selectedStudents.length} sinh viên
                </span>
                <button
                  className="detail-button"
                  onClick={closeStudents}
                >
                  Đóng danh sách
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}