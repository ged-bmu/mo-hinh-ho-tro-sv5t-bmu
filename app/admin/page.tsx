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
import CriteriaModal from "../components/CriteriaModal";
import { authFetch } from "@/lib/auth-fetch";

export default function AdminPage() {
    const toolbarButtonStyle: React.CSSProperties = {
    height: 42,
    padding: "0 16px",
    borderRadius: 10,
    border: "1px solid #dbe3ee",
    background: "#ffffff",
    color: "#334155",
    fontSize: 13,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    transition: "all 0.2s ease",
  };

 const toolbarAccentStyle: React.CSSProperties = {
  ...toolbarButtonStyle,
  background: "#0e7490",
  color: "#ffffff",
  border: "1px solid #0e7490",
};

const toolbarSuccessStyle: React.CSSProperties = {
  ...toolbarButtonStyle,
  background: "#15803d",
  color: "#ffffff",
  border: "1px solid #15803d",
};

const toolbarDangerStyle: React.CSSProperties = {
  ...toolbarButtonStyle,
  background: "#dc2626",
  color: "#ffffff",
  border: "1px solid #dc2626",
};
  const [profile, setProfile] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<any>(null);
  const [updatingSubmission, setUpdatingSubmission] = useState(false);
  const [criteriaResults, setCriteriaResults] = useState<Record<string, any>>({});
  const [registrationStatuses, setRegistrationStatuses] = useState<Record<string, boolean>>({});
  const [updatingRegistrationUserId, setUpdatingRegistrationUserId] = useState<string | null>(null);
  const [filterRegistration, setFilterRegistration] = useState("registered");
  const [tab, setTab] = useState("proof");
  const [showCriteria, setShowCriteria] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationTarget, setNotificationTarget] = useState<"all" | "registered">("all");
  const [notificationContent, setNotificationContent] = useState("");
  const [selectedPassed, setSelectedPassed] = useState<string[] | null>(null);
  const totalStudents = students.length;
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [filterResult, setFilterResult] = useState("all");
  const [showProfile, setShowProfile] = useState(false);
  const keyword = search.toLowerCase();
  const pathname = usePathname();
  const [sending, setSending] = useState(false);
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

const isRegistered = registrationStatuses[sv.id] === true;

const matchRegistration =
  filterRegistration === "all"
    ? true
    : filterRegistration === "registered"
    ? isRegistered
    : !isRegistered;

return matchSearch && matchFilter && matchRegistration;
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

  if (!currentAcademicYear?.id) {
    alert("Chưa có năm học được chọn.");
    return;
  }

  try {
    let studentIds: string[] = [];

    if (notificationTarget === "all") {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "student");

      if (error) throw error;

      studentIds = (data || []).map((item) => item.id);
    } else {
      const { data, error } = await supabase
        .from("student_year_profiles")
        .select("user_id")
        .eq("academic_year_id", currentAcademicYear.id)
        .eq("dang_ky_phan_dau", true);

      if (error) throw error;

      studentIds = [
        ...new Set((data || []).map((item) => item.user_id)),
      ];
    }

    if (studentIds.length === 0) {
      alert("Không có sinh viên thuộc nhóm đối tượng đã chọn.");
      return;
    }

    const title = notificationTitle.trim() || "🔔 SV5T BMU";
    const content = notificationContent.trim();

    const notifications = studentIds.map((userId) => ({
      user_id: userId,
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
      throw notificationError;
    }

    let successCount = 0;
    let failureCount = 0;

    await Promise.all(
      studentIds.map(async (userId) => {
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
                userId,
              }),
            }
          );

          const result = await response.json();

          if (response.ok && result.success) {
            successCount++;
          } else {
            failureCount++;
            console.error("Không gửi được push:", userId, result);
          }
        } catch (error) {
          failureCount++;
          console.error("Lỗi gửi push:", userId, error);
        }
      })
    );

    const targetName =
      notificationTarget === "all"
        ? "toàn bộ sinh viên"
        : `sinh viên đăng ký phấn đấu năm học ${currentAcademicYear.name}`;

    alert(
      `Đã lưu thông báo cho ${studentIds.length} sinh viên thuộc nhóm ${targetName}.\n\n` +
        `📱 Gửi push thành công: ${successCount}\n` +
        `⚠️ Push thất bại/không có thiết bị: ${failureCount}`
    );

    setNotificationTitle("");
    setNotificationContent("");
    setNotificationTarget("all");
    setShowNotificationModal(false);
  } catch (error: any) {
    console.error("Lỗi gửi thông báo chung:", error);
    alert(
      "Không thể gửi thông báo: " +
        (error?.message || "Vui lòng thử lại.")
    );
  }
}


  async function loadAcademicYears() {
    const { data, error } = await supabase
      .from("academic_years")
      .select("id, name, is_current, submission_open")
      .order("id", { ascending: true });

    if (error) {
      console.error("Lỗi lấy năm học:", error);
      return;
    }

    const years = data || [];
setAcademicYears(years);

const current = years.find((year) => year.is_current === true);

setCurrentAcademicYear(current || null);

if (current?.id) {
  await Promise.all([
    loadCriteriaResults(current.id),
    loadRegistrationStatuses(current.id),
  ]);
} else {
  setCriteriaResults({});
  setRegistrationStatuses({});
}
  }
  async function toggleSubmissionOpen() {
  if (!currentAcademicYear?.id || updatingSubmission) return;

  const nextOpen = !currentAcademicYear.submission_open;

  const confirmed = window.confirm(
    `${nextOpen ? "Mở" : "Đóng"} đợt đăng ký phấn đấu ` +
      `Sinh viên 5 tốt năm học ${currentAcademicYear.name}?`
  );

  if (!confirmed) return;

  setUpdatingSubmission(true);

  try {
    const { error } = await supabase
      .from("academic_years")
      .update({ submission_open: nextOpen })
      .eq("id", currentAcademicYear.id);

    if (error) throw error;

    setAcademicYears((prev) =>
      prev.map((year) =>
        year.id === currentAcademicYear.id
          ? { ...year, submission_open: nextOpen }
          : year
      )
    );

    setCurrentAcademicYear((prev: any) =>
      prev ? { ...prev, submission_open: nextOpen } : prev
    );

    alert(
      `Đã ${nextOpen ? "mở" : "đóng"} đợt đăng ký năm học ` +
        currentAcademicYear.name
    );
  } catch (error: any) {
    console.error("Lỗi cập nhật đợt đăng ký:", error);
    alert("Không thể cập nhật đợt đăng ký: " + error.message);
  } finally {
    setUpdatingSubmission(false);
  }
}
  async function loadRegistrationStatuses(yearId: number) {
  if (!yearId) {
    setRegistrationStatuses({});
    return;
  }

  const { data, error } = await supabase
    .from("student_year_profiles")
    .select("user_id, dang_ky_phan_dau")
    .eq("academic_year_id", yearId);

  if (error) {
    console.error("Lỗi lấy trạng thái đăng ký phấn đấu:", error);
    return;
  }

  const mapped: Record<string, boolean> = {};

  (data || []).forEach((item) => {
    mapped[item.user_id] = item.dang_ky_phan_dau === true;
  });

  setRegistrationStatuses(mapped);
}  


async function toggleStudentRegistration(sv: any) {
  const yearId = currentAcademicYear?.id;

  if (!yearId || updatingRegistrationUserId) return;

  const isRegistered = registrationStatuses[sv.id] === true;
  const nextRegistered = !isRegistered;

  const confirmed = window.confirm(
    nextRegistered
      ? `Bạn có chắc chắn muốn ĐĂNG KÝ PHẤN ĐẤU Sinh viên 5 tốt năm học ${currentAcademicYear.name} cho sinh viên ${sv.ho_ten} (${sv.mssv})?`
      : `Bạn có chắc chắn muốn HỦY ĐĂNG KÝ PHẤN ĐẤU Sinh viên 5 tốt năm học ${currentAcademicYear.name} của sinh viên ${sv.ho_ten} (${sv.mssv})?`
  );

  if (!confirmed) return;

  setUpdatingRegistrationUserId(sv.id);

  try {
    // Cập nhật bản ghi đăng ký hiện có
    const { data: updatedRows, error: updateError } = await supabase
      .from("student_year_profiles")
      .update({
        dang_ky_phan_dau: nextRegistered,
      })
      .eq("user_id", sv.id)
      .eq("academic_year_id", yearId)
      .select("user_id");

    if (updateError) throw updateError;

    // Nếu chưa có bản ghi của sinh viên trong năm học này thì tạo mới
    if (!updatedRows || updatedRows.length === 0) {
      const { error: insertError } = await supabase
        .from("student_year_profiles")
        .insert({
          user_id: sv.id,
          academic_year_id: yearId,
          dang_ky_phan_dau: nextRegistered,
        });

      if (insertError) throw insertError;
    }

    // Cập nhật trạng thái hiển thị ngay trên trang admin
    setRegistrationStatuses((prev) => ({
      ...prev,
      [sv.id]: nextRegistered,
    }));

    alert(
      nextRegistered
        ? `Đã đăng ký phấn đấu thành công cho sinh viên ${sv.ho_ten}.`
        : `Đã hủy đăng ký phấn đấu của sinh viên ${sv.ho_ten}.`
    );
  } catch (error: any) {
    console.error("Lỗi cập nhật đăng ký phấn đấu:", error);

    alert(
      "Không thể cập nhật trạng thái đăng ký: " +
        (error?.message || "Vui lòng thử lại.")
    );
  } finally {
    setUpdatingRegistrationUserId(null);
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
    <div className="admin-page">
      <AdminSidebar />
      <NotificationBell />

      <main className="admin-main">
        <div className="admin-container admin-container-full">
              {/* HEADER */}
              <Header
              tab={tab}
              setTab={setTab}
              openCriteria={() => setShowCriteria(true)}
              openProfile={() => setShowProfile(true)}
            />


              <hr className="admin-divider" />
      <style jsx global>{`
       * {
  box-sizing: border-box;
}

/* =========================
   TRANG QUẢN TRỊ
========================= */

.admin-container-full {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.admin-header-full {
  width: 100%;
  min-width: 0;
}
.admin-page {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  color: #0f172a;
  box-sizing: border-box;
}
  /* Đảm bảo Sidebar và chuông nổi trên Header */
.admin-page > :global(*) {
  box-sizing: border-box;
}

.admin-page > main {
  position: relative;
  z-index: 1;
}

.admin-main {
  flex: 1;
  width: 100%;
  max-width: none;
  min-width: 0;
  padding: 20px 0 40px;
  box-sizing: border-box;
}

.admin-container {
  width: 100%;
  max-width: 1700px;
  margin: 0 auto;
}

/* =========================
   HEADER
========================= */

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
  object-fit: contain;
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

/* =========================
   THANH CÔNG CỤ
========================= */

.admin-toolbar {
  width: 100%;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);
}

.admin-search-group {
  display: flex;
  flex: 1 1 320px;
  width: auto;
  min-width: 0;
}

.admin-search {
  flex: 1;
  width: 100%;
  min-width: 0;
  height: 46px;
  padding: 12px 14px;
  border: 1px solid #dbe2ea;
  border-right: none;
  border-radius: 12px 0 0 12px;
  outline: none;
  font-size: 14px;
  background: #fff;
  color: #0f172a;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.admin-search:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.admin-filter {
  width: 135px;
  min-width: 0;
  height: 46px;
  padding: 10px;
  border: 1px solid #dbe2ea;
  border-radius: 0 12px 12px 0;
  background: #fff;
  color: #0f172a;
  cursor: pointer;
  font-size: 14px;
  outline: none;
}

.admin-filter:focus {
  border-color: #2563eb;
}

.admin-actions {
  flex: 2 1 600px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.admin-action-button,
.admin-year-select {
  height: 44px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.admin-action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  white-space: nowrap;
}

.admin-action-button:focus-visible,
.admin-year-select:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.2);
  outline-offset: 2px;
}

.admin-action-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

/* Thêm năm học */

.admin-add-year {
  padding: 10px 16px;
  border: 1px solid #16a34a;
  background: #fff;
  color: #16a34a;
}

.admin-add-year:hover {
  background: #f0fdf4;
}

/* Chọn năm học */

.admin-year-select {
  min-width: 190px;
  padding: 10px 14px;
  border: 1px solid #2563eb;
  background: #fff;
  color: #2563eb;
}

/* Mở nhận hồ sơ */

.admin-open-submission {
  padding: 10px 16px;
  border: 1px solid #16a34a;
  background: #16a34a;
  color: #fff;
}

.admin-open-submission:hover:not(:disabled) {
  border-color: #15803d;
  background: #15803d;
}

/* Đóng nhận hồ sơ */

.admin-close-submission {
  padding: 10px 16px;
  border: 1px solid #dc2626;
  background: #dc2626;
  color: #fff;
}

.admin-close-submission:hover:not(:disabled) {
  border-color: #b91c1c;
  background: #b91c1c;
}

/* Thông báo */

.admin-notification-button {
  padding: 10px 16px;
  border: 1px solid #2563eb;
  background: #fff;
  color: #2563eb;
}

.admin-notification-button:hover {
  background: #eff6ff;
}

/* Xuất dữ liệu */

.admin-export-wrap {
  position: relative;
  flex-shrink: 0;
}

.admin-export-button {
  padding: 10px 18px;
  border: 1px solid #16a34a;
  background: #16a34a;
  color: #fff;
}

.admin-export-button:hover {
  border-color: #15803d;
  background: #15803d;
}

.admin-export-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 220px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
  z-index: 999;
  overflow: hidden;
}

.admin-export-item {
  padding: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #334155;
  transition: background 0.2s ease;
}

.admin-export-item:hover {
  background: #f1f5f9;
}

.admin-export-item:first-child {
  border-bottom: 1px solid #eee;
}


/* =========================
   BẢNG SINH VIÊN
========================= */

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
  min-width: 1100px;
  table-layout: fixed;
  border-collapse: collapse;
}

/* Cố định độ rộng từng cột */
.admin-table th:nth-child(1),
.admin-table td:nth-child(1) {
  width: 5%;
  text-align: center;
}

.admin-table th:nth-child(2),
.admin-table td:nth-child(2) {
  width: 18%;
  text-align: left;
}

.admin-table th:nth-child(3),
.admin-table td:nth-child(3) {
  width: 10%;
  text-align: center;
}

.admin-table th:nth-child(4),
.admin-table td:nth-child(4) {
  width: 12%;
  text-align: center;
}

.admin-table th:nth-child(5),
.admin-table td:nth-child(5) {
  width: 17%;
  text-align: center;
}

.admin-table th:nth-child(6),
.admin-table td:nth-child(6) {
  width: 13%;
  text-align: center;
}

.admin-table th:nth-child(7),
.admin-table td:nth-child(7) {
  width: 15%;
  text-align: center;
}

.admin-table th:nth-child(8),
.admin-table td:nth-child(8) {
  width: 10%;
  text-align: center;
}

/* Tiêu đề */
.admin-table th {
  padding: 18px 10px;
  background: #dbeafe;
  color: #0f172a;
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  vertical-align: middle;
  white-space: normal;
  overflow-wrap: break-word;
}

/* Nội dung */
.admin-table td {
  padding: 15px 10px;
  border-top: 1px solid #e2e8f0;
  font-size: 15px;
  vertical-align: middle;
  overflow-wrap: break-word;
}

/* Họ tên không bị xuống dòng */
.admin-table td:nth-child(2) {
  white-space: normal;
  overflow-wrap: anywhere;
}

/* Các cột mã và trạng thái */
.admin-table td:nth-child(3),
.admin-table td:nth-child(4),
.admin-table td:nth-child(5),
.admin-table td:nth-child(6),
.admin-table td:nth-child(7),
.admin-table td:nth-child(8) {
  white-space: nowrap;
}

.admin-table tbody tr {
  transition: background 0.15s ease;
}

.admin-table tbody tr:hover {
  background: #f8fafc;
}

.admin-table-name {
  min-width: 0;
}

.admin-table-class,
.admin-table-mssv,
.admin-table-count,
.admin-table-status,
.admin-table-result,
.admin-table-view {
  white-space: nowrap;
}

  text-align: center;
  white-space: nowrap;
}

/* Số lượng tiêu chí */

.admin-count {
  color: #111827;
  cursor: pointer;
  font-weight: 600;
  transition: color 0.2s ease;
}

.admin-count:hover {
  color: #2563eb;
}

/* Trạng thái hồ sơ */

.admin-status {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
}

.admin-status-submitted {
  background: #dcfce7;
  color: #166534;
}

.admin-status-not-submitted {
  background: #fef3c7;
  color: #92400e;
}

/* Kết quả xét duyệt */

.admin-result {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 600;
  white-space: nowrap;
}

.admin-result-passed {
  background: #dcfce7;
  color: #166534;
}

.admin-result-failed {
  background: #fee2e2;
  color: #991b1b;
}

/* Nút xem hồ sơ */

.admin-view-button {
  background: #2563eb;
  color: #fff;
  padding: 8px 14px;
  border: 1px solid #2563eb;
  border-radius: 8px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.2s ease;
}

.admin-view-button:hover {
  background: #1d4ed8;
}

/* =========================
   MODAL TIÊU CHÍ
========================= */

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
  width: 320px;
  max-width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
}

.admin-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.admin-modal-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
}

.admin-modal-close {
  flex-shrink: 0;
  border: none;
  background: transparent;
  font-size: 24px;
  cursor: pointer;
  color: #64748b;
  line-height: 1;
}

.admin-modal-close:hover {
  color: #0f172a;
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

/* =========================
   MODAL THÔNG BÁO
========================= */

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
  max-height: 90vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
}

.notification-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.notification-modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.notification-close {
  flex-shrink: 0;
  border: none;
  background: transparent;
  font-size: 26px;
  color: #64748b;
  cursor: pointer;
  line-height: 1;
}

.notification-close:hover {
  color: #0f172a;
}

.notification-label {
  display: block;
  margin-bottom: 7px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.notification-textarea {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-family: inherit;
  font-size: 14px;
  color: #111827;
  background: #fff;
  outline: none;
  resize: vertical;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.notification-textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.notification-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.notification-cancel,
.notification-save {
  padding: 10px 18px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.notification-cancel {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}

.notification-cancel:hover {
  background: #f8fafc;
}

.notification-save {
  padding-left: 20px;
  padding-right: 20px;
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #fff;
}

.notification-save:hover {
  background: #1d4ed8;
}

/* =========================
   RESPONSIVE: MÁY TÍNH BẢNG
========================= */

@media (max-width: 1100px) {
  .admin-main {
    padding-left: 24px;
    padding-right: 24px;
  }

  .admin-toolbar {
    align-items: stretch;
  }

  .admin-search-group {
    flex: 1 1 100%;
    width: 100%;
    min-width: 0;
  }

  .admin-actions {
    flex: 1 1 100%;
    width: 100%;
    justify-content: flex-start;
  }

  .admin-export-wrap {
    margin-left: 0;
  }
}

/* =========================
   RESPONSIVE: ĐIỆN THOẠI
========================= */

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
    padding: 12px;
    gap: 10px;
    margin-bottom: 18px;
    border-radius: 12px;
  }

  .admin-search-group {
    flex: 1 1 100%;
    width: 100%;
    min-width: 0;
  }

  .admin-search {
    height: 42px;
    font-size: 13px;
  }

  .admin-filter {
    width: 115px;
    height: 42px;
    font-size: 12px;
    padding: 8px;
  }

  .admin-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
    gap: 8px;
  }

  .admin-action-button,
  .admin-year-select {
    width: 100%;
    min-width: 0;
    height: auto;
    min-height: 42px;
    padding: 9px 8px;
    font-size: 12px;
    white-space: normal;
    text-align: center;
    overflow-wrap: anywhere;
  }

  .admin-year-select,
  .admin-add-year {
    grid-column: span 2;
  }

  .admin-export-wrap {
    width: 100%;
    min-width: 0;
    margin-left: 0;
  }

  .admin-export-button {
    width: 100%;
  }

  .admin-export-menu {
    left: 0;
    right: 0;
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
    font-size: 14px;
  }

  .admin-status,
  .admin-result {
    font-size: 12px;
    padding: 5px 9px;
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

/* =========================
   RESPONSIVE: ĐIỆN THOẠI NHỎ
========================= */

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
    grid-template-columns: minmax(0, 1fr);
  }

  .admin-add-year,
  .admin-year-select {
    grid-column: auto;
  }

  .admin-table {
    min-width: 800px;
  }

  .admin-toolbar {
    padding: 10px;
  }

  .admin-action-button,
  .admin-year-select {
    font-size: 12px;
    padding: 9px 6px;
  }

  .notification-modal {
    padding: 15px;
  }
}
      `}</style>

{/* TÊN HỆ THỐNG */}
<div
  style={{
  width: "100%",
  marginBottom: 10,
  padding: "12px 8px",
  color: "#2563eb",
  fontSize: 22,
  fontWeight: 700,
  lineHeight: 1,
  letterSpacing: "0.2px",
  textAlign: "center",
}}
>
  <b>MÔ HÌNH HỖ TRỢ SINH VIÊN PHẤN ĐẤU ĐẠT DANH HIỆU SINH VIÊN 5 TỐT CÁC CẤP</b>
</div>

{/* PREMIUM ADMIN TOOLBAR */}
<div
  style={{
    width: "100%",
    marginBottom: 26,
    padding: 18,
    border: "1px solid #e6ebf2",
    borderRadius: 20,
    background: "linear-gradient(145deg, #ffffff 0%, #fbfdff 100%)",
    boxShadow: "0 8px 30px rgba(15, 23, 42, 0.045)",
    boxSizing: "border-box",
  }}
>
  {/* SEARCH, FILTER AND ACTIONS — SAME ROW */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 10,
    }}
  >
    {/* RESULT COUNT */}
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
        padding: "0 13px",
        height: 44,
        borderRadius: 12,
        border: "1px solid #dbeafe",
        background: "#eff6ff",
        color: "#1d4ed8",
        fontSize: 12,
        fontWeight: 750,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#3b82f6",
          boxShadow: "0 0 0 3px rgba(59,130,246,.12)",
        }}
      />
      {filteredStudents.length} kết quả
    </div>

    {/* SEARCH */}
    <div
      style={{
        flex: "1 1 230px",
        minWidth: 180,
        position: "relative",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: 13,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          color: "#94a3b8",
          pointerEvents: "none",
        }}
      >
        <AdminIcon name="search" size={17} />
      </span>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Tìm họ tên, MSSV..."
        aria-label="Tìm kiếm sinh viên"
        style={{
          width: "100%",
          height: 44,
          padding: "0 13px 0 39px",
          border: "1px solid #dbe3ed",
          borderRadius: 12,
          outline: "none",
          background: "#f8fafc",
          color: "#0f172a",
          fontSize: 13,
          boxSizing: "border-box",
          transition: "all .2s ease",
        }}
        onFocus={(e) => {
          e.currentTarget.style.background = "#fff";
          e.currentTarget.style.borderColor = "#0891b2";
          e.currentTarget.style.boxShadow =
            "0 0 0 4px rgba(8,145,178,.09)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.background = "#f8fafc";
          e.currentTarget.style.borderColor = "#dbe3ed";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </div>

    {/* FILTER */}
    <div
      style={{
        flex: "0 1 175px",
        minWidth: 155,
        position: "relative",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          color: "#64748b",
          pointerEvents: "none",
        }}
      >
        <AdminIcon name="filter" size={16} />
      </span>

      <select
        value={filterResult}
        onChange={(e) => setFilterResult(e.target.value)}
        aria-label="Lọc hồ sơ sinh viên"
        style={{
          width: "100%",
          height: 44,
          padding: "0 10px 0 35px",
          border: "1px solid #dbe3ed",
          borderRadius: 12,
          outline: "none",
          background: "#fff",
          color: "#334155",
          fontSize: 12,
          fontWeight: 650,
          cursor: "pointer",
          boxSizing: "border-box",
        }}
      >
        <option value="all">Tất cả hồ sơ</option>
        <option value="passed">Đạt 5 tiêu chí</option>
        <option value="failed">Chưa đạt</option>
        <option value="submitted">Đã nộp hồ sơ</option>
      </select>
    </div>
    
    {/* FILTER ĐĂNG KÝ PHẤN ĐẤU */}
<div
  style={{
    flex: "0 1 190px",
    minWidth: 165,
  }}
>
  <select
    value={filterRegistration}
    onChange={(e) => setFilterRegistration(e.target.value)}
    aria-label="Lọc đăng ký phấn đấu"
    style={{
      width: "100%",
      height: 44,
      padding: "0 12px",
      border: "1px solid #dbe3ed",
      borderRadius: 12,
      outline: "none",
      background: "#fff",
      color: "#334155",
      fontSize: 12,
      fontWeight: 650,
      cursor: "pointer",
      boxSizing: "border-box",
    }}
  >
    <option value="all">Tất cả đăng ký</option>
    <option value="registered">Đã đăng ký phấn đấu</option>
    <option value="unregistered">Chưa đăng ký phấn đấu</option>
  </select>
</div>

    {/* NOTIFICATION */}
    <button
      type="button"
      onClick={() => setShowNotificationModal(true)}
      style={{
        height: 44,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "0 13px",
        border: "1px solid #dbe3ed",
        borderRadius: 12,
        background: "#fff",
        color: "#334155",
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
        cursor: "pointer",
        transition: "all .2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#f0f9ff";
        e.currentTarget.style.borderColor = "#7dd3fc";
        e.currentTarget.style.color = "#0369a1";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#fff";
        e.currentTarget.style.borderColor = "#dbe3ed";
        e.currentTarget.style.color = "#334155";
      }}
    >
      <AdminIcon name="bell" size={16} />
      Thông báo
    </button>

    {/* EXPORT DROPDOWN */}
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        disabled={exporting}
        onClick={() => setShowExportMenu((prev) => !prev)}
        style={{
          height: 44,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "0 15px",
          borderRadius: 12,
          color: "#fff",
          fontSize: 12,
          fontWeight: 750,
          whiteSpace: "nowrap",
          cursor: exporting ? "not-allowed" : "pointer",
          opacity: exporting ? 0.65 : 1,
          transition: "all .2s ease",
          border: "1px solid #2563eb",
          background: "#2563eb",
          boxShadow: "0 4px 12px rgba(37,99,235,.18)",
        }}
      >
        <AdminIcon name="download" size={16} />
        {exporting ? "Đang xuất..." : "Xuất dữ liệu"}
        <AdminIcon name="chevron" size={14} />
      </button>

      {showExportMenu && (
        <>
          <div
            onClick={() => setShowExportMenu(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
            }}
          />

          <div
            style={{
              position: "absolute",
              top: "calc(100% + 9px)",
              right: 0,
              zIndex: 41,
              width: 250,
              padding: 7,
              border: "1px solid #e2e8f0",
              borderRadius: 15,
              background: "#fff",
              boxShadow: "0 18px 45px rgba(15,23,42,.14)",
            }}
          >
            <div
              style={{
                padding: "9px 11px",
                color: "#94a3b8",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "1px",
              }}
            >
              XUẤT DỮ LIỆU
            </div>

            <button
              type="button"
              onClick={() => {
                setShowExportMenu(false);
                void exportExcel();
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: 11,
                border: "none",
                borderRadius: 10,
                background: "#fff",
                textAlign: "left",
                cursor: "pointer",
                color: "#334155",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f8fafc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
              }}
            >
              <span
                style={{
                  width: 37,
                  height: 37,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 10,
                  background: "#dcfce7",
                  color: "#15803d",
                  flexShrink: 0,
                }}
              >
                <AdminIcon name="file" size={19} />
              </span>
              <span>
                <span style={{ display: "block", fontSize: 13, fontWeight: 700 }}>
                  Xuất danh sách Excel
                </span>
                <span style={{ display: "block", marginTop: 4, fontSize: 11, color: "#94a3b8" }}>
                  Danh sách theo bộ lọc hiện tại
                </span>
              </span>
            </button>

            <button
              type="button"
              disabled={exporting}
              onClick={async () => {
                setShowExportMenu(false);
                setExporting(true);

                try {
                  const response = await authFetch(
                    `/api/export-all-student?filter=${encodeURIComponent(filterResult)}&search=${encodeURIComponent(search)}`
                  );

                  if (!response.ok) {
                    throw new Error("Không thể xuất hồ sơ.");
                  }

                  const blob = await response.blob();
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");

                  link.href = url;
                  link.download = "Ho-So-SV5T.zip";
                  document.body.appendChild(link);
                  link.click();
                  link.remove();

                  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
                } catch (error) {
                  alert(
                    error instanceof Error
                      ? error.message
                      : "Có lỗi khi xuất hồ sơ."
                  );
                } finally {
                  setExporting(false);
                }
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: 11,
                border: "none",
                borderRadius: 10,
                background: "#fff",
                textAlign: "left",
                cursor: exporting ? "not-allowed" : "pointer",
                color: "#334155",
                opacity: exporting ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f8fafc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
              }}
            >
              <span
                style={{
                  width: 37,
                  height: 37,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 10,
                  background: "#dbeafe",
                  color: "#1d4ed8",
                  flexShrink: 0,
                }}
              >
                <AdminIcon name="archive" size={19} />
              </span>
              <span>
                <span style={{ display: "block", fontSize: 13, fontWeight: 700 }}>
                  Tải toàn bộ hồ sơ ZIP
                </span>
                <span style={{ display: "block", marginTop: 4, fontSize: 11, color: "#94a3b8" }}>
                  Tệp hồ sơ đính kèm
                </span>
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  </div>


{/* YEAR MANAGEMENT */}
<div
  style={{
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
    padding: 14,
    border: "1px solid #e5edf5",
    borderRadius: 15,
    background: "linear-gradient(110deg, #f8fafc 0%, #f0f9ff 100%)",
  }}
>
  {/* NĂM HỌC ĐANG QUẢN LÝ */}
  <div
    style={{
      flex: "0 1 300px",
      minWidth: 220,
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}
  >
    <div
      style={{
        width: 42,
        height: 42,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #bae6fd",
        borderRadius: 12,
        background: "#e0f2fe",
        color: "#0369a1",
      }}
    >
      <AdminIcon name="calendar" size={20} />
    </div>

    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          marginBottom: 6,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "1px",
          color: "#64748b",
        }}
      >
        NĂM HỌC HIỆN TẠI
      </div>

      <select
        value={String(currentAcademicYear?.id ?? "")}
        disabled={updatingSubmission || academicYears.length === 0}
        onChange={async (e) => {
          const selectedId = e.target.value;
          const selected = academicYears.find(
            (year) => String(year.id) === selectedId
          );

          if (!selected || !selectedId) return;

          if (!window.confirm(`Chuyển sang năm học ${selected.name}?`)) {
            return;
          }

          setUpdatingSubmission(true);

          try {
            const { error: clearError } = await supabase
              .from("academic_years")
              .update({ is_current: false })
              .eq("is_current", true);

            if (clearError) throw clearError;

            const { error: updateError } = await supabase
              .from("academic_years")
              .update({ is_current: true })
              .eq("id", selected.id);

            if (updateError) throw updateError;

            await loadAcademicYears();
            await loadCriteriaResults(selected.id);
            await loadRegistrationStatuses(selected.id);
          } catch (error) {
            console.error("Lỗi đổi năm học:", error);
            alert(
              error instanceof Error
                ? `Không thể đổi năm học: ${error.message}`
                : "Không thể đổi năm học. Vui lòng thử lại."
            );
            await loadAcademicYears();
          } finally {
            setUpdatingSubmission(false);
          }
        }}
        style={{
          width: "100%",
          maxWidth: 320,
          padding: 0,
          border: "none",
          outline: "none",
          background: "transparent",
          color: "#0f172a",
          fontSize: 15,
          fontWeight: 750,
          cursor: updatingSubmission ? "wait" : "pointer",
          textOverflow: "ellipsis",
        }}
      >
        {academicYears.length === 0 && (
          <option value="">Chưa có năm học</option>
        )}
        {academicYears.map((year) => (
          <option key={year.id} value={String(year.id)}>
            {year.name}
          </option>
        ))}
      </select>
    </div>
  </div>

  {/* THÊM NĂM HỌC */}
  <button
    type="button"
    onClick={async () => {
      const name = window.prompt("Nhập tên năm học mới:");
      if (!name?.trim()) return;

      const { error } = await supabase
        .from("academic_years")
        .insert({
          name: name.trim(),
          is_current: false,
        });

      if (error) {
        alert("Không thể thêm năm học: " + error.message);
        return;
      }

      await loadAcademicYears();
      alert("Đã thêm năm học.");
    }}
    style={{
      minHeight: 42,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: "0 14px",
      border: "1px solid #bae6fd",
      borderRadius: 11,
      background: "#fff",
      color: "#0369a1",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      whiteSpace: "nowrap",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "#e0f2fe";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "#fff";
    }}
  >
    <AdminIcon name="plus" size={16} />
    Thêm năm học
  </button>

  {/* NHẮN TIN / TRAO ĐỔI */}
  <button
    type="button"
    onClick={() => {
      window.location.href = "/trao-doi";
    }}
    style={{
      minHeight: 42,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: "0 14px",
      border: "1px solid #c7d2fe",
      borderRadius: 11,
      background: "#eef2ff",
      color: "#0d1fad",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      whiteSpace: "nowrap",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "#e0e7ff";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "#eef2ff";
    }}
  >
    <AdminIcon name="bell" size={16} />
    Nhắn tin
  </button>

  {/* TRẠNG THÁI ĐĂNG KÝ */}
  {currentAcademicYear && (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        paddingLeft: 14,
        borderLeft: "1px solid #dbe5ef",
        marginLeft: "auto",
      }}
    >
      <div>
        <div
          style={{
            marginBottom: 5,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: ".7px",
            color: "#64748b",
          }}
        >
          ĐĂNG KÝ PHẤN ĐẤU
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 750,
            color: currentAcademicYear.submission_open
              ? "#15803d"
              : "#b91c1c",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: currentAcademicYear.submission_open
                ? "#22c55e"
                : "#ef4444",
            }}
          />
          {currentAcademicYear.submission_open ? "Đang mở" : "Đang đóng"}
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={Boolean(currentAcademicYear.submission_open)}
        aria-label="Bật hoặc tắt nhận hồ sơ"
        disabled={updatingSubmission}
        onClick={toggleSubmissionOpen}
        style={{
          width: 48,
          height: 27,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: currentAcademicYear.submission_open
            ? "flex-end"
            : "flex-start",
          padding: 3,
          border: "none",
          borderRadius: 999,
          background: currentAcademicYear.submission_open
            ? "#16a34a"
            : "#cbd5e1",
          cursor: updatingSubmission ? "not-allowed" : "pointer",
          opacity: updatingSubmission ? 0.6 : 1,
          transition: "all .2s ease",
        }}
      >
        <span
          style={{
            width: 21,
            height: 21,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 1px 4px rgba(15,23,42,.2)",
          }}
        />
      </button>
    </div>
  )}
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
                        
                        <th className="admin-table-status">
                          Đăng ký phấn đấu
                        </th>

                        <th className="admin-table-count">
                          Tiêu chí đã đạt
                        </th>

                        <th className="admin-table-status">
                          Trạng thái hồ sơ
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

                         
{/* ĐĂNG KÝ PHẤN ĐẤU - ADMIN CÓ QUYỀN CẬP NHẬT */}
<td className="admin-table-status">
  <button
    type="button"
    disabled={
      updatingRegistrationUserId !== null ||
      !currentAcademicYear?.id
    }
    onClick={() => toggleStudentRegistration(sv)}
    title={
      registrationStatuses[sv.id] === true
        ? "Bấm để hủy đăng ký phấn đấu"
        : "Bấm để đăng ký phấn đấu"
    }
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: "7px 12px",
      borderRadius: 999,
      border:
        registrationStatuses[sv.id] === true
          ? "1px solid #86efac"
          : "1px solid #fcd34d",
      background:
        registrationStatuses[sv.id] === true
          ? "#dcfce7"
          : "#fef3c7",
      color:
        registrationStatuses[sv.id] === true
          ? "#166534"
          : "#92400e",
      fontSize: 14,
      fontWeight: 700,
      whiteSpace: "nowrap",
      cursor:
        updatingRegistrationUserId !== null ||
        !currentAcademicYear?.id
          ? "not-allowed"
          : "pointer",
      opacity:
        updatingRegistrationUserId === sv.id
          ? 0.6
          : 1,
      transition: "all .2s ease",
    }}
  >
    {updatingRegistrationUserId === sv.id
      ? "Đang cập nhật..."
      : registrationStatuses[sv.id] === true
        ? "Đã đăng ký"
        : "Chưa đăng ký"}
  </button>
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

                      
<div style={{ marginBottom: 20 }}>
  <label className="notification-label">
    Đối tượng nhận thông báo
  </label>

  <select
    value={notificationTarget}
    onChange={(e) =>
      setNotificationTarget(
        e.target.value as "all" | "registered"
      )
    }
    style={{
      width: "100%",
      height: 46,
      padding: "0 12px",
      border: "1px solid #d1d5db",
      borderRadius: 10,
      background: "#fff",
      color: "#111827",
      fontSize: 14,
      fontWeight: 600,
      outline: "none",
    }}
  >
    <option value="all">
      Toàn bộ sinh viên
    </option>

    <option value="registered">
      Sinh viên đăng ký phấn đấu năm học {currentAcademicYear?.name || ""}
    </option>
  </select>

  {notificationTarget === "registered" && (
    <p
      style={{
        margin: "8px 0 0",
        color: "#64748b",
        fontSize: 12,
        lineHeight: 1.5,
      }}
    >
      Chỉ gửi cho sinh viên đã đăng ký phấn đấu
      trong năm học {currentAcademicYear?.name || "đang chọn"}.
    </p>
  )}
</div>

<div style={{ marginBottom: 22 }}>
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
  onClick={async () => {
    if (sending) return;
    setSending(true);
    try {
      await sendGeneralNotification();
    } finally {
      setSending(false);
    }
  }}
  disabled={sending}
  style={{
    background: sending ? "#9ca3af" : "#2563eb",
    color: "#ffffff",
    padding: "12px 24px",
    border: "none",
    borderRadius: "10px",
    fontWeight: 600,
    fontSize: "14px",
    cursor: sending ? "not-allowed" : "pointer",
    opacity: sending ? 0.7 : 1,
    transition: "all 0.2s ease",
    boxShadow: sending ? "none" : "0 4px 10px rgba(37, 99, 235, 0.25)",
  }}
>
  {sending ? " Đang gửi..." : "Gửi thông báo"}
</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
                </div>
      </main>

      {showCriteria && (
        <CriteriaModal
          onClose={() => setShowCriteria(false)}
        />
      )}

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

function AdminIcon({
  name,
  size = 18,
}: {
  name:
    | "search"
    | "filter"
    | "calendar"
    | "plus"
    | "bell"
    | "download"
    | "chevron"
    | "file"
    | "archive"
    | "check"
    | "close";
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style: { flexShrink: 0, display: "block" },
    "aria-hidden": true as const,
  };

  const paths: Record<string, React.ReactNode> = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    filter: (
      <>
        <path d="M4 7h16M7 12h10m-7 5h4" />
        <circle cx="8" cy="7" r="1" fill="currentColor" />
        <circle cx="15" cy="12" r="1" fill="currentColor" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    download: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="m7 10 5 5 5-5M12 15V3" />
      </>
    ),
    chevron: <path d="m7 10 5 5 5-5" />,
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h8" />
      </>
    ),
    archive: (
      <>
        <rect x="3" y="4" width="18" height="5" rx="1" />
        <path d="M5 9v11h14V9M10 13h4" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m18 6-12 12M6 6l12 12" />,
  };

  return <svg {...common}>{paths[name]}</svg>;
}
