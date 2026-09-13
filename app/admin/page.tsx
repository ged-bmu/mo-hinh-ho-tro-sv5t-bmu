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
import { authFetch } from "@/lib/auth-fetch";

export default function AdminPage() {
  const [profile, setProfile] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<any>(null);
  const [criteriaResults, setCriteriaResults] = useState<Record<string, any>>(
    {}
  );
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationContent, setNotificationContent] = useState("");
  const [selectedPassed, setSelectedPassed] = useState<string[] | null>(null);
  const totalStudents = students.length;
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [filterResult, setFilterResult] = useState("all");

  const keyword = search.toLowerCase();
  const pathname = usePathname();

  const filteredStudents = students.filter((sv) => {
    const matchSearch =
      sv.ho_ten?.toLowerCase().includes(keyword) ||
      sv.mssv?.toLowerCase().includes(keyword);

    const result = criteriaResults[sv.id];

    const isPassed =
      result?.dao_duc &&
      result?.hoc_tap &&
      result?.the_luc &&
      result?.tinh_nguyen &&
      result?.hoi_nhap;

    const matchFilter =
      filterResult === "all"
        ? true
        : filterResult === "passed"
        ? isPassed
        : filterResult === "failed"
        ? !isPassed
        : filterResult === "submitted"
        ? result?.is_submitted === true
        : true;

    return matchSearch && matchFilter;
  });

  useEffect(() => {
    checkAdmin();
    loadAcademicYears();

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

  async function sendGeneralNotification() {
    if (!notificationContent.trim()) {
      alert("Vui lòng nhập nội dung thông báo.");
      return;
    }

    try {
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

      const title = notificationTitle.trim() || "🔔 SV5T BMU";
      const content = notificationContent.trim();

      const notifications = profiles.map((profile) => ({
        user_id: profile.id,
        type: "general",
        title,
        content,
        target_url: "/thongbaouser",
        is_read: false,
      }));

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notificationError) {
        console.error(notificationError);

        alert(
          "Không thể lưu thông báo: " + notificationError.message
        );

        return;
      }

      let successCount = 0;
      let failureCount = 0;

      await Promise.all(
        profiles.map(async (profile) => {
          try {
            const response = await authFetch(
              "/api/send-notification",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  type: "general",
                  title,
                  message: content,
                  url: "/thongbaouser",
                  userId: profile.id,
                }),
              }
            );

            const result = await response.json();

            if (response.ok && result.success) {
              successCount++;
            } else {
              failureCount++;

              console.error(
                "Không gửi được push cho user:",
                profile.id,
                result
              );
            }
          } catch (error) {
            failureCount++;

            console.error(
              "Lỗi gửi push cho user:",
              profile.id,
              error
            );
          }
        })
      );

      alert(
        `Đã gửi thông báo cho ${profiles.length} sinh viên.\n\n` +
          `📱 Thiết bị nhận được: ${successCount}\n` +
          `⚠️ Không gửi được/không có thiết bị: ${failureCount}`
      );

      setNotificationTitle("");
      setNotificationContent("");
      setShowNotificationModal(false);
    } catch (error) {
      console.error("Lỗi gửi thông báo chung:", error);

      alert("Đã xảy ra lỗi khi gửi thông báo.");
    }
  }

  async function loadAcademicYears() {
    const { data, error } = await supabase
      .from("academic_years")
      .select("id, name, is_current")
      .order("id", { ascending: true });

    if (error) {
      console.error("Lỗi lấy năm học:", error);
      return;
    }

    setAcademicYears(data || []);

    const current = data?.find((year) => year.is_current);

    setCurrentAcademicYear(current || null);

    if (current?.id) {
      await loadCriteriaResults(current.id);
    }
  }

  async function loadCriteriaResults(yearId: number) {
    if (!yearId) return;

    const { data, error } = await supabase
      .from("student_criteria_results")
      .select(`
        user_id,
        dao_duc,
        hoc_tap,
        the_luc,
        tinh_nguyen,
        hoi_nhap,
        is_submitted,
        submitted_at
      `)
      .eq("academic_year_id", yearId);

    if (error) {
      console.error("Lỗi lấy kết quả tiêu chí:", error);
      return;
    }

    const mapped: Record<string, any> = {};

    (data || []).forEach((item) => {
      mapped[item.user_id] = item;
    });

    setCriteriaResults(mapped);
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
  ) {
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
  };

  return (
    <>
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        .admin-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
        }

        .admin-main {
          flex: 1;
          width: 100%;
          padding: 40px clamp(16px, 4vw, 60px);
        }

        .admin-container {
          width: 100%;
          max-width: 1700px;
          margin: 0 auto;
        }

        .admin-header {
          text-align: center;
          margin-bottom: 25px;
        }

        .admin-logo-wrap {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .admin-logo {
          width: min(220px, 30vw);
          height: auto;
          margin-top: 10px;
        }

       .admin-title {
  margin: 0 0 10px;
  font-size: 18px;
  line-height: 1.4;
  font-weight: 500;
  color: #0f172a;
}

.admin-subtitle {
  margin: 0;
  font-size: 24px;
  line-height: 1.4;
  font-weight: 700;
  color: #0f65de;
}

        .admin-divider {
          margin: 20px 0 25px;
          border: 0;
          border-top: 1px solid #e5e7eb;
        }

        .admin-toolbar {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          margin-bottom: 20px;
        }

        .admin-search-group {
          display: flex;
          width: min(100%, 480px);
          min-width: 0;
        }

        .admin-search {
          flex: 1;
          min-width: 0;
          height: 46px;
          padding: 12px 14px;
          border: 1px solid #dbe2ea;
          border-right: none;
          border-radius: 12px 0 0 12px;
          outline: none;
          font-size: 14px;
          background: #fff;
        }

        .admin-filter {
          width: 135px;
          height: 46px;
          padding: 10px;
          border: 1px solid #dbe2ea;
          border-radius: 0 12px 12px 0;
          background: #fff;
          cursor: pointer;
          font-size: 14px;
        }

        .admin-actions {
          flex: 1;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          min-width: 0;
        }

        .admin-action-button,
        .admin-year-select {
          height: 44px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .admin-add-year {
          padding: 10px 16px;
          border: 1px solid #16a34a;
          background: #fff;
          color: #16a34a;
        }

        .admin-year-select {
          min-width: 190px;
          padding: 10px 14px;
          border: 1px solid #2563eb;
          background: #fff;
          color: #2563eb;
        }

        .admin-notification-button {
          padding: 10px 16px;
          border: 1px solid #2563eb;
          background: #fff;
          color: #2563eb;
          transition: all 0.2s ease;
        }

        .admin-notification-button:hover {
          background: #eff6ff;
        }

        .admin-export-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .admin-export-button {
          padding: 10px 18px;
          border: none;
          background: #16a34a;
          color: #fff;
        }

        .admin-export-menu {
          position: absolute;
          top: 110%;
          right: 0;
          width: 220px;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 999;
          overflow: hidden;
        }

        .admin-export-item {
          padding: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .admin-export-item:first-child {
          border-bottom: 1px solid #eee;
        }

        .admin-table-card {
          width: 100%;
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        }

        .admin-table-scroll {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .admin-table {
          width: 100%;
          min-width: 850px;
          border-collapse: collapse;
        }

        .admin-table th {
  padding: 16px 16px;
  background: #dbeafe;
  color: #0f172a;
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
}

.admin-table td {
  padding: 15px 16px;
  border-top: 1px solid #e2e8f0;
  font-size: 16px;
}

        .admin-table-name {
          min-width: 180px;
        }

        .admin-table-class,
        .admin-table-mssv,
        .admin-table-count,
        .admin-table-status,
        .admin-table-result,
        .admin-table-view {
          text-align: center;
          white-space: nowrap;
        }

        .admin-count {
          color: #111827;
          cursor: pointer;
          font-weight: 600;
          transition: color 0.2s ease;
        }

        .admin-count:hover {
          color: #2563eb;
        }

        .admin-status {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 999px;
          font-weight: 600;
          font-size: 14px;
        }

        .admin-status-submitted {
          background: #dcfce7;
          color: #166534;
        }

        .admin-status-not-submitted {
          background: #fef3c7;
          color: #92400e;
        }

        .admin-result {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 999px;
          font-weight: 600;
        }

        .admin-result-passed {
          background: #dcfce7;
          color: #166534;
        }

        .admin-result-failed {
          background: #fee2e2;
          color: #991b1b;
        }

        .admin-view-button {
          background: #2563eb;
          color: #fff;
          padding: 8px 14px;
          border-radius: 8px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .admin-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .admin-modal {
          background: #fff;
          border-radius: 14px;
          padding: 20px;
          width: 320px;
          max-width: 100%;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
        }

        .admin-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .admin-modal-title {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
        }

        .admin-modal-close {
          border: none;
          background: transparent;
          font-size: 24px;
          cursor: pointer;
          color: #64748b;
          line-height: 1;
        }

        .admin-passed-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .admin-passed-item {
          padding: 10px 12px;
          border-radius: 8px;
          background: #f0fdf4;
          color: #166534;
          font-size: 14px;
          font-weight: 500;
        }

        .admin-empty {
          color: #64748b;
          font-size: 14px;
        }

        .notification-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }

        .notification-modal {
          width: 100%;
          max-width: 520px;
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
        }

        .notification-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .notification-modal-title {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #111827;
        }

        .notification-close {
          border: none;
          background: transparent;
          font-size: 26px;
          color: #64748b;
          cursor: pointer;
          line-height: 1;
        }

        .notification-label {
          display: block;
          margin-bottom: 7px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .notification-textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 14px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          font-size: 14px;
          outline: none;
          resize: vertical;
        }

        .notification-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .notification-cancel,
        .notification-save {
          padding: 10px 18px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
        }

        .notification-cancel {
          border: 1px solid #d1d5db;
          background: #fff;
          color: #374151;
        }

        .notification-save {
          padding-left: 20px;
          padding-right: 20px;
          border: none;
          background: #2563eb;
          color: #fff;
        }

        @media (max-width: 1100px) {
          .admin-toolbar {
            flex-direction: column;
          }

          .admin-search-group {
            width: 100%;
            max-width: 600px;
          }

          .admin-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .admin-export-wrap {
            margin-left: auto;
          }
        }

        @media (max-width: 700px) {
          .admin-main {
            padding: 20px 10px 30px;
          }

          .admin-header {
            margin-bottom: 18px;
          }

          .admin-logo-wrap {
            margin-bottom: 14px;
            padding-bottom: 10px;
          }

          .admin-logo {
            width: min(180px, 55vw);
          }

          .admin-title {
            font-size: 14px;
          }

          .admin-subtitle {
            font-size: 18px;
          }

          .admin-divider {
            margin: 15px 0 18px;
          }

          .admin-toolbar {
            gap: 12px;
          }

          .admin-search-group {
            width: 100%;
          }

          .admin-search {
            height: 44px;
            font-size: 13px;
          }

          .admin-filter {
            width: 115px;
            height: 44px;
            font-size: 13px;
          }

          .admin-actions {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }

          .admin-action-button,
          .admin-year-select {
            width: 100%;
            min-width: 0;
            font-size: 13px;
          }

          .admin-add-year {
            grid-column: span 2;
          }

          .admin-year-select {
            grid-column: span 2;
          }

          .admin-notification-button {
            width: 100%;
          }

          .admin-export-wrap {
            width: 100%;
            margin-left: 0;
          }

          .admin-export-button {
            width: 100%;
          }

          .admin-export-menu {
            left: 0;
            right: auto;
            width: 100%;
          }

          .admin-table-card {
            border-radius: 12px;
          }

          .admin-table {
            min-width: 820px;
          }

          .admin-table th,
          .admin-table td {
            padding: 12px 10px;
          }

          .notification-modal-overlay {
            padding: 12px;
          }

          .notification-modal {
            padding: 18px;
            border-radius: 14px;
          }

          .notification-modal-title {
            font-size: 18px;
          }

          .notification-buttons {
            flex-direction: column-reverse;
          }

          .notification-cancel,
          .notification-save {
            width: 100%;
          }

          .admin-modal-overlay {
            padding: 15px;
          }

          .admin-modal {
            width: 100%;
          }
        }

        @media (max-width: 400px) {
          .admin-main {
            padding-left: 8px;
            padding-right: 8px;
          }

          .admin-search-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .admin-search {
            width: 100%;
            border-right: 1px solid #dbe2ea;
            border-radius: 10px;
          }

          .admin-filter {
            width: 100%;
            border-radius: 10px;
          }

          .admin-actions {
            grid-template-columns: 1fr;
          }

          .admin-add-year,
          .admin-year-select {
            grid-column: auto;
          }

          .admin-table {
            min-width: 800px;
          }
        }
      `}</style>

      <div className="admin-page">
        <div style={{ flex: 1 }}>
          <AdminSidebar />
          <NotificationBell />

          <main className="admin-main">
            <div className="admin-container">

              {/* HEADER */}
              <div className="admin-header">
                <div className="admin-logo-wrap">
                  <Image
                    src="/logo-header.png"
                    alt="Logo"
                    width={220}
                    height={80}
                    className="admin-logo"
                  />
                </div>

                <h1 className="admin-title">
                  <b>
                    CÂU LẠC BỘ SINH VIÊN 5 TỐT TRƯỜNG ĐẠI HỌC Y DƯỢC
                    BUÔN MA THUỘT
                  </b>
                </h1>

                <p className="admin-subtitle">
                  Mô Hình hỗ trợ sinh viên phấn đấu đạt danh hiệu Sinh
                  viên 5 tốt các cấp
                </p>
              </div>

              <hr className="admin-divider" />

              {/* TOOLBAR */}
              <div className="admin-toolbar">

                {/* SEARCH */}
                <div className="admin-search-group">
                  <input
                    className="admin-search"
                    placeholder="🔍 Tìm MSSV hoặc họ tên..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />

                  <select
                    className="admin-filter"
                    value={filterResult}
                    onChange={(e) =>
                      setFilterResult(e.target.value)
                    }
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

                {/* ACTIONS */}
                <div className="admin-actions">

                  <button
                    type="button"
                    className="admin-action-button admin-add-year"
                    onClick={async () => {
                      const name = window.prompt(
                        "Nhập tên năm học mới:",
                        "2027 - 2028"
                      );

                      if (!name?.trim()) return;

                      const { error } = await supabase
                        .from("academic_years")
                        .insert({
                          name: name.trim(),
                          is_current: false,
                          submission_open: false,
                        });

                      if (error) {
                        console.error(
                          "Lỗi thêm năm học:",
                          error
                        );

                        alert(
                          "Không thể thêm năm học: " +
                            error.message
                        );

                        return;
                      }

                      await loadAcademicYears();

                      alert(
                        `Đã thêm năm học ${name.trim()}`
                      );
                    }}
                  >
                    ＋ Thêm năm học
                  </button>

                  <select
                    className="admin-year-select"
                    value={currentAcademicYear?.id || ""}
                    onChange={async (e) => {
                      const selected =
                        academicYears.find(
                          (year) =>
                            year.id ===
                            Number(e.target.value)
                        );

                      if (!selected) return;

                      const confirmed =
                        window.confirm(
                          `Chuyển năm học mặc định sang ${selected.name}?`
                        );

                      if (!confirmed) {
                        return;
                      }

                      const {
                        error: resetError,
                      } = await supabase
                        .from("academic_years")
                        .update({
                          is_current: false,
                        })
                        .neq(
                          "id",
                          selected.id
                        );

                      if (resetError) {
                        console.error(
                          "Lỗi tắt năm học cũ:",
                          resetError
                        );

                        alert(
                          "Không thể thay đổi năm học."
                        );

                        return;
                      }

                      const {
                        error: updateError,
                      } = await supabase
                        .from("academic_years")
                        .update({
                          is_current: true,
                        })
                        .eq(
                          "id",
                          selected.id
                        );

                      if (updateError) {
                        console.error(
                          "Lỗi cập nhật năm học:",
                          updateError
                        );

                        alert(
                          "Không thể thay đổi năm học."
                        );

                        return;
                      }

                      setCurrentAcademicYear(
                        selected
                      );

                      await loadCriteriaResults(
                        selected.id
                      );

                      alert(
                        `Đã chuyển sang năm học ${selected.name}`
                      );
                    }}
                  >
                    {academicYears.map(
                      (year) => (
                        <option
                          key={year.id}
                          value={year.id}
                        >
                          📅 Năm học: {year.name}
                        </option>
                      )
                    )}
                  </select>

                  <button
                    type="button"
                    className="admin-action-button admin-notification-button"
                    onClick={() =>
                      setShowNotificationModal(
                        true
                      )
                    }
                  >
                    Gửi thông báo
                  </button>

                  {/* EXPORT */}
                  <div className="admin-export-wrap">
                    <button
                      type="button"
                      className="admin-action-button admin-export-button"
                      onClick={() =>
                        setShowExportMenu(
                          !showExportMenu
                        )
                      }
                    >
                      Xuất
                    </button>

                    {showExportMenu && (
                      <div className="admin-export-menu">

                        <div
                          className="admin-export-item"
                          onClick={() => {
                            exportExcel();
                            setShowExportMenu(
                              false
                            );
                          }}
                        >
                          📊 Xuất Excel
                        </div>

                        <div
                          className="admin-export-item"
                          onClick={async () => {
                            if (exporting) return;

                            setExporting(true);

                            try {
                              const response =
                                await authFetch(
                                  `/api/export-all-student?filter=${filterResult}&search=${encodeURIComponent(
                                    search
                                  )}`
                                );

                              if (!response.ok) {
                                throw new Error(
                                  "Không thể xuất toàn bộ hồ sơ"
                                );
                              }

                              const blob =
                                await response.blob();

                              const url =
                                URL.createObjectURL(
                                  blob
                                );

                              const link =
                                document.createElement(
                                  "a"
                                );

                              link.href = url;
                              link.download =
                                "Ho-So-SV5T.zip";

                              link.click();

                              URL.revokeObjectURL(
                                url
                              );

                              setShowExportMenu(
                                false
                              );
                            } catch (error) {
                              console.error(
                                "Export all error:",
                                error
                              );

                              alert(
                                "Không thể xuất toàn bộ hồ sơ"
                              );
                            } finally {
                              setExporting(
                                false
                              );
                            }
                          }}
                        >
                          {exporting && (
                            <Spinner size={16} />
                          )}

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
              </div>

              {/* TABLE CARD */}
              <div className="admin-table-card">
                <div className="admin-table-scroll">
                  <table className="admin-table">

                    <thead>
                      <tr>
                        <th>STT</th>

                        <th className="admin-table-name">
                          Họ tên
                        </th>

                        <th className="admin-table-class">
                          Lớp
                        </th>

                        <th className="admin-table-mssv">
                          MSSV
                        </th>

                        <th className="admin-table-count">
                          Các tiêu chí đã đạt
                        </th>

                        <th className="admin-table-status">
                          Trạng thái hồ sơ
                        </th>

                        <th className="admin-table-result">
                          Kết quả
                        </th>

                        <th className="admin-table-view">
                          Xem hồ sơ
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredStudents.map(
                        (sv, index) => {
                          const criteria = [
                            {
                              field: "dao-duc",
                              name: "Đạo đức tốt",
                            },
                            {
                              field: "hoc-tap",
                              name: "Học tập tốt",
                            },
                            {
                              field: "the-luc",
                              name: "Thể lực tốt",
                            },
                            {
                              field: "tinh-nguyen",
                              name: "Tình nguyện tốt",
                            },
                            {
                              field: "hoi-nhap",
                              name: "Hội nhập tốt",
                            },
                          ];

                          const result =
                            criteriaResults[
                              sv.id
                            ];

                          const notPassed =
                            criteria.filter(
                              (item) => {
                                if (
                                  item.field ===
                                  "dao-duc"
                                )
                                  return !result?.dao_duc;

                                if (
                                  item.field ===
                                  "hoc-tap"
                                )
                                  return !result?.hoc_tap;

                                if (
                                  item.field ===
                                  "the-luc"
                                )
                                  return !result?.the_luc;

                                if (
                                  item.field ===
                                  "tinh-nguyen"
                                )
                                  return !result?.tinh_nguyen;

                                if (
                                  item.field ===
                                  "hoi-nhap"
                                )
                                  return !result?.hoi_nhap;

                                return true;
                              }
                            );

                          return (
                            <tr key={sv.id}>

                              <td
                                style={{
                                  textAlign:
                                    "center",
                                }}
                              >
                                {index + 1}
                              </td>

                              <td className="admin-table-name">
                                {sv.ho_ten}
                              </td>

                              <td className="admin-table-class">
                                {sv.lop}
                              </td>

                              <td className="admin-table-mssv">
                                {sv.mssv}
                              </td>

                              {/* TIÊU CHÍ */}
                              <td className="admin-table-count">
                                <span
                                  className="admin-count"
                                  onClick={() => {
                                    const passed =
                                      criteria
                                        .filter(
                                          (item) => {
                                            if (
                                              item.field ===
                                              "dao-duc"
                                            )
                                              return result?.dao_duc;

                                            if (
                                              item.field ===
                                              "hoc-tap"
                                            )
                                              return result?.hoc_tap;

                                            if (
                                              item.field ===
                                              "the-luc"
                                            )
                                              return result?.the_luc;

                                            if (
                                              item.field ===
                                              "tinh-nguyen"
                                            )
                                              return result?.tinh_nguyen;

                                            if (
                                              item.field ===
                                              "hoi-nhap"
                                            )
                                              return result?.hoi_nhap;

                                            return false;
                                          }
                                        )
                                        .map(
                                          (item) =>
                                            item.name
                                        );

                                    setSelectedPassed(
                                      passed
                                    );
                                  }}
                                >
                                  {5 -
                                    notPassed.length}
                                  /5
                                </span>
                              </td>

                              {/* TRẠNG THÁI */}
                              <td className="admin-table-status">
                                {criteriaResults[
                                  sv.id
                                ]?.is_submitted ? (
                                  <span className="admin-status admin-status-submitted">
                                    Đã nộp
                                  </span>
                                ) : (
                                  <span className="admin-status admin-status-not-submitted">
                                    Chưa nộp
                                  </span>
                                )}
                              </td>

                              {/* KẾT QUẢ */}
                              <td className="admin-table-result">
                                {result?.dao_duc &&
                                result?.hoc_tap &&
                                result?.the_luc &&
                                result?.tinh_nguyen &&
                                result?.hoi_nhap ? (
                                  <span className="admin-result admin-result-passed">
                                    Đạt
                                  </span>
                                ) : (
                                  <span className="admin-result admin-result-failed">
                                    Chưa đạt
                                  </span>
                                )}
                              </td>

                              {/* XEM */}
                              <td className="admin-table-view">
                                <a
                                  href={`/admin/students/${sv.id}`}
                                  className="admin-view-button"
                                >
                                  <Image
                                    src="/iconxem2.png"
                                    width={20}
                                    height={20}
                                    alt="Xem"
                                  />
                                </a>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>

                {/* MODAL TIÊU CHÍ */}
                {selectedPassed && (
                  <div
                    className="admin-modal-overlay"
                    onClick={() =>
                      setSelectedPassed(null)
                    }
                  >
                    <div
                      className="admin-modal"
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                    >
                      <div className="admin-modal-header">
                        <h3 className="admin-modal-title">
                          Tiêu chí đã đạt
                        </h3>

                        <button
                          type="button"
                          className="admin-modal-close"
                          onClick={() =>
                            setSelectedPassed(
                              null
                            )
                          }
                        >
                          ×
                        </button>
                      </div>

                      {selectedPassed.length >
                      0 ? (
                        <div className="admin-passed-list">
                          {selectedPassed.map(
                            (name) => (
                              <div
                                key={name}
                                className="admin-passed-item"
                              >
                                ✅ {name}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="admin-empty">
                          Chưa đạt tiêu chí nào.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* MODAL THÔNG BÁO */}
                {showNotificationModal && (
                  <div
                    className="notification-modal-overlay"
                    onClick={() =>
                      setShowNotificationModal(
                        false
                      )
                    }
                  >
                    <div
                      className="notification-modal"
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                    >
                      <div className="notification-modal-header">
                        <h2 className="notification-modal-title">
                          📢 Gửi thông báo chung
                        </h2>

                        <button
                          type="button"
                          className="notification-close"
                          onClick={() => {
                            setShowNotificationModal(
                              false
                            );

                            setNotificationTitle(
                              ""
                            );

                            setNotificationContent(
                              ""
                            );
                          }}
                        >
                          ×
                        </button>
                      </div>

                      <div
                        style={{
                          marginBottom:
                            "22px",
                        }}
                      >
                        <label className="notification-label">
                          Nội dung
                        </label>

                        <textarea
                          className="notification-textarea"
                          value={
                            notificationContent
                          }
                          onChange={(e) =>
                            setNotificationContent(
                              e.target.value
                            )
                          }
                          placeholder="Nhập nội dung thông báo..."
                          rows={5}
                        />
                      </div>

                      <div className="notification-buttons">
                        <button
                          type="button"
                          className="notification-cancel"
                          onClick={() => {
                            setShowNotificationModal(
                              false
                            );

                            setNotificationTitle(
                              ""
                            );

                            setNotificationContent(
                              ""
                            );
                          }}
                        >
                          Hủy
                        </button>

                        <button
                          type="button"
                          className="notification-save"
                          onClick={
                            sendGeneralNotification
                          }
                        >
                          Lưu
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

        <Footer />
      </div>
    </>
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