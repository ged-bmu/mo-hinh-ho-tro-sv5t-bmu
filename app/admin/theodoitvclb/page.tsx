
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AdminSidebar from "../../components/AdminSidebar";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import CriteriaModal from "../../components/CriteriaModal";

type Member = {
  id: string;
  ho_ten: string;
  lop: string;
  mssv: string;
  nam_hoc: string;
};

type Activity = {
  id: string;
  ten_hoat_dong: string;
  thoi_gian: string | null;
  nam_hoc: string;
};

type Attendance = {
  member_id: string;
  activity_id: string;
  tham_gia: boolean;
};

function getCurrentAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  const startYear = now.getMonth() >= 6 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TheoDoiTVCLBPage() {
  const [tab, setTab] = useState("proof");
  const [showCriteria, setShowCriteria] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [namHoc, setNamHoc] = useState(getCurrentAcademicYear());
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
const [deletingMembers, setDeletingMembers] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [attendance, setAttendance] = useState<
    Record<string, boolean>
  >({});

  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [addingActivity, setAddingActivity] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState<
    Record<string, boolean>
  >({});

  const [pasteText, setPasteText] = useState("");
  const [tenHoatDong, setTenHoatDong] = useState("");
  const [thoiGian, setThoiGian] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const years = useMemo(() => {
    const current = Number(getCurrentAcademicYear().slice(0, 4));
    return Array.from({ length: 16 }, (_, index) => {
      const start = current - 8 + index;
      return `${start}-${start + 1}`;
    }).reverse();
  }, []);

  const showMessage = (
    text: string,
    type: "success" | "error" = "success"
  ) => {
    setMessage(text);
    setMessageType(type);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const [
        { data: memberData, error: memberError },
        { data: activityData, error: activityError },
      ] = await Promise.all([
        supabase
          .from("club_members")
          .select("id, ho_ten, lop, mssv, nam_hoc")
          .eq("nam_hoc", namHoc)
          .order("ho_ten", { ascending: true }),
        supabase
          .from("club_activities")
          .select("id, ten_hoat_dong, thoi_gian, nam_hoc")
          .eq("nam_hoc", namHoc)
          .order("thoi_gian", { ascending: true }),
      ]);

      if (memberError) throw memberError;
      if (activityError) throw activityError;

      const memberRows = (memberData ?? []) as Member[];
      const activityRows = (activityData ?? []) as Activity[];

      setMembers(memberRows);
      setActivities(activityRows);

      if (memberRows.length === 0 || activityRows.length === 0) {
        setAttendance({});
        return;
      }

      const memberIds = memberRows.map((member) => member.id);
      const activityIds = activityRows.map((activity) => activity.id);

      const { data: attendanceData, error: attendanceError } =
        await supabase
          .from("club_attendance")
          .select("member_id, activity_id, tham_gia")
          .in("member_id", memberIds)
          .in("activity_id", activityIds);

      if (attendanceError) throw attendanceError;

      const attendanceMap: Record<string, boolean> = {};

      ((attendanceData ?? []) as Attendance[]).forEach((item) => {
        attendanceMap[`${item.member_id}:${item.activity_id}`] =
          item.tham_gia;
      });

      setAttendance(attendanceMap);
    } catch (error) {
      console.error("Lỗi tải dữ liệu theo dõi CLB:", error);
      showMessage(
        "Không tải được dữ liệu. Hãy kiểm tra bảng Supabase và quyền truy cập.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [namHoc]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Dán dữ liệu Excel theo thứ tự: Họ tên | Lớp | MSSV
  const importMembers = async () => {
    const lines = pasteText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      showMessage("Bạn hãy dán danh sách sinh viên trước nhé.", "error");
      return;
    }

    const rows = lines
      .map((line) => line.split("\t").map((cell) => cell.trim()))
      .filter((cells) => cells.length >= 3);

    const validRows = rows.filter((cells, index) => {
      const firstThree = cells.slice(0, 3).join(" ").toLowerCase();

      // Bỏ qua hàng tiêu đề nếu có
      if (
        index === 0 &&
        (firstThree.includes("họ tên") ||
          firstThree.includes("ho ten") ||
          firstThree.includes("mssv"))
      ) {
        return false;
      }

      return Boolean(cells[0] && cells[2]);
    });

    if (validRows.length === 0) {
      showMessage(
        "Không tìm thấy dữ liệu hợp lệ. Hãy dán 3 cột: Họ tên, Lớp, MSSV.",
        "error"
      );
      return;
    }

    const records = validRows.map((cells) => ({
      ho_ten: cells[0],
      lop: cells[1] ?? "",
      mssv: cells[2],
      nam_hoc: namHoc,
    }));

    setImporting(true);

    try {
      const { error } = await supabase
        .from("club_members")
        .upsert(records, { onConflict: "mssv,nam_hoc" });

      if (error) throw error;

      setPasteText("");
      await loadData();
      showMessage(
        `Đã nhập ${records.length} dòng vào năm học ${namHoc}.`
      );
    } catch (error) {
      console.error("Lỗi nhập thành viên:", error);
      showMessage(
        "Nhập danh sách thất bại. Kiểm tra SQL, RLS và định dạng MSSV.",
        "error"
      );
    } finally {
      setImporting(false);
    }
  };

  const addActivity = async () => {
    if (!tenHoatDong.trim()) {
      showMessage("Bạn hãy nhập tên hoạt động.", "error");
      return;
    }

    if (!thoiGian) {
      showMessage("Bạn hãy chọn thời gian hoạt động.", "error");
      return;
    }

    setAddingActivity(true);

    try {
      const { error } = await supabase.from("club_activities").insert({
        ten_hoat_dong: tenHoatDong.trim(),
        thoi_gian: new Date(thoiGian).toISOString(),
        nam_hoc: namHoc,
      });

      if (error) throw error;

      setTenHoatDong("");
      setThoiGian("");
      await loadData();
      showMessage(
        `Đã thêm hoạt động vào năm học ${namHoc}. Cột điểm danh mới đã được tạo.`
      );
    } catch (error) {
      console.error("Lỗi thêm hoạt động:", error);
      showMessage("Không thêm được hoạt động. Vui lòng thử lại.", "error");
    } finally {
      setAddingActivity(false);
    }
  };

  const toggleAttendance = async (
    member: Member,
    activity: Activity,
    checked: boolean
  ) => {
    const key = `${member.id}:${activity.id}`;

    setSavingAttendance((previous) => ({ ...previous, [key]: true }));

    try {
      const { error } = await supabase.from("club_attendance").upsert(
        {
          member_id: member.id,
          activity_id: activity.id,
          tham_gia: checked,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "member_id,activity_id" }
      );

      if (error) throw error;

      setAttendance((previous) => ({ ...previous, [key]: checked }));
    } catch (error) {
      console.error("Lỗi cập nhật điểm danh:", error);
      showMessage("Lưu điểm danh thất bại. Hãy thử lại.", "error");
    } finally {
      setSavingAttendance((previous) => ({ ...previous, [key]: false }));
    }
  };

  const deleteActivity = async (activity: Activity) => {
    const confirmed = window.confirm(
      `Xóa hoạt động "${activity.ten_hoat_dong}"?\nDữ liệu điểm danh của hoạt động này cũng sẽ bị xóa.`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("club_activities")
        .delete()
        .eq("id", activity.id)
        .eq("nam_hoc", namHoc);

      if (error) throw error;

      await loadData();
      showMessage("Đã xóa hoạt động.");
    } catch (error) {
      console.error("Lỗi xóa hoạt động:", error);
      showMessage("Không xóa được hoạt động.", "error");
    }
  };

  
const deleteMember = async (member: Member) => {
  const confirmed = window.confirm(
    `Bạn có chắc muốn xóa thành viên "${member.ho_ten}" (${member.mssv}) khỏi năm học ${namHoc} không?\nDữ liệu điểm danh của thành viên này cũng sẽ bị xóa.`
  );

  if (!confirmed) return;

  try {
    const { error } = await supabase
      .from("club_members")
      .delete()
      .eq("id", member.id)
      .eq("nam_hoc", namHoc);

    if (error) throw error;

    await loadData();
    showMessage(`Đã xóa thành viên ${member.ho_ten}.`);
  } catch (error) {
    console.error("Lỗi xóa thành viên:", error);
    showMessage(
      "Không xóa được thành viên. Hãy kiểm tra quyền Supabase và khóa ngoại.",
      "error"
    );
  }
};


const toggleSelectMember = (memberId: string, checked: boolean) => {
  setSelectedMemberIds((previous) =>
    checked
      ? previous.includes(memberId)
        ? previous
        : [...previous, memberId]
      : previous.filter((id) => id !== memberId)
  );
};

const toggleSelectAllMembers = (checked: boolean) => {
  setSelectedMemberIds(
    checked ? members.map((member) => member.id) : []
  );
};

const deleteSelectedMembers = async () => {
  const ids = selectedMemberIds.filter((id) =>
    members.some((member) => member.id === id)
  );

  if (ids.length === 0) {
    showMessage("Bạn chưa chọn thành viên nào.", "error");
    return;
  }

  const confirmed = window.confirm(
    `Bạn có chắc muốn xóa ${ids.length} thành viên đã chọn khỏi năm học ${namHoc} không?\nDữ liệu điểm danh liên quan cũng sẽ bị xóa nếu khóa ngoại được cấu hình ON DELETE CASCADE.`
  );

  if (!confirmed) return;

  setDeletingMembers(true);

  try {
    const { error } = await supabase
      .from("club_members")
      .delete()
      .in("id", ids)
      .eq("nam_hoc", namHoc);

    if (error) throw error;

    setSelectedMemberIds([]);
    await loadData();
    showMessage(`Đã xóa ${ids.length} thành viên được chọn.`);
  } catch (error) {
    console.error("Lỗi xóa nhiều thành viên:", error);
    showMessage(
      "Xóa thành viên thất bại. Kiểm tra quyền Supabase và khóa ngoại điểm danh.",
      "error"
    );
  } finally {
    setDeletingMembers(false);
  }
};

  const exportCsv = () => {
    const escapeCsv = (value: string) =>
      `"${value.replace(/"/g, '""')}"`;

    const header = [
      "STT",
      "Họ tên",
      "Lớp",
      "MSSV",
      ...activities.map(
        (activity) =>
          `${activity.ten_hoat_dong} (${formatDate(activity.thoi_gian)})`
      ),
    ];

    const rows = members.map((member, index) => [
      String(index + 1),
      member.ho_ten,
      member.lop,
      member.mssv,
      ...activities.map((activity) =>
        attendance[`${member.id}:${activity.id}`] ? "Có tham gia" : "Vắng"
      ),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((value) => escapeCsv(String(value))).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `Theo-doi-CLB-${namHoc}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const totalAttendance = activities.reduce(
    (total, activity) =>
      total +
      members.filter(
        (member) => attendance[`${member.id}:${activity.id}`]
      ).length,
    0
  );

  const inputStyle = {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box" as const,
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    fontSize: 14,
    background: "#fff",
    color: "#0f172a",
  };

  const buttonStyle = {
    padding: "9px 13px",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        color: "#0f172a",
        colorScheme: "light",
      }}
    >
      <Header
        tab={tab}
        setTab={setTab}
        openCriteria={() => setShowCriteria(true)}
        openProfile={() => setShowProfile(true)}
      />

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 20,
          maxWidth: 1600,
          margin: "0 auto",
          padding: "20px 16px 32px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ flexShrink: 0 }}>
          <AdminSidebar />
        </div>

        <main style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 18,
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 25,
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                Theo dõi hoạt độngcủa thành viên CLB
              </h1>
            </div>

            <Link
              href="/"
              style={{
                ...buttonStyle,
                background: "#fff",
                color: "#1d4ed8",
                border: "1px solid #bfdbfe",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ← Về trang chủ
            </Link>
          </div>

          {/* Chọn năm học */}
          <section
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              padding: 16,
              marginBottom: 16,
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
            }}
          >
            <label
              htmlFor="namHoc"
              style={{ fontWeight: 700, fontSize: 14 }}
            >
              Năm học:
            </label>

            <select
              id="namHoc"
              value={namHoc}
              onChange={(event) => setNamHoc(event.target.value)}
              style={{ ...inputStyle, width: 170 }}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <span style={{ fontSize: 13, color: "#64748b" }}>
              Dữ liệu đang xem: năm học {namHoc}
            </span>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => void loadData()}
                style={{
                  ...buttonStyle,
                  background: "#eff6ff",
                  color: "#1d4ed8",
                }}
              >
                ↻ Tải lại
              </button>

              <button
                type="button"
                onClick={exportCsv}
                disabled={members.length === 0}
                style={{
                  ...buttonStyle,
                  background: members.length ? "#0f766e" : "#94a3b8",
                  color: "#fff",
                  cursor: members.length ? "pointer" : "not-allowed",
                }}
              >
                Xuất Excel/CSV
              </button>
            </div>
          </section>

          {message && (
            <div
              role="status"
              style={{
                marginBottom: 16,
                padding: "11px 14px",
                borderRadius: 8,
                fontSize: 14,
                background:
                  messageType === "success" ? "#dcfce7" : "#fee2e2",
                color: messageType === "success" ? "#166534" : "#991b1b",
                border:
                  messageType === "success"
                    ? "1px solid #bbf7d0"
                    : "1px solid #fecaca",
              }}
            >
              {message}
            </div>
          )}

          {/* Một khu vực quản lý duy nhất */}
          <section
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: 16,
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>
                Bảng thành viên và điểm danh
              </h2>

              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "#64748b",
                  lineHeight: 1.6,
                }}
              >
                Dán 3 cột từ Excel theo thứ tự <b>Họ tên, Lớp, MSSV</b>.
                Sau khi nhập danh sách, thêm hoạt động để tạo các cột điểm
                danh ngay bên phải bảng.
              </p>

              <textarea
                value={pasteText}
                onChange={(event) => setPasteText(event.target.value)}
                placeholder={
                  "Nguyễn Văn A\tY khoa K25\t2212345\nNguyễn Thị B\tY khoa K25\t2212346"
                }
                rows={4}
                style={{
                  ...inputStyle,
                  display: "block",
                  marginTop: 12,
                  resize: "vertical",
                  lineHeight: 1.6,
                  fontFamily: "inherit",
                }}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 10,
                  marginTop: 10,
                }}
              >
                <button
                  type="button"
                  disabled={importing}
                  onClick={() => void importMembers()}
                  style={{
                    ...buttonStyle,
                    background: importing ? "#93c5fd" : "#2563eb",
                    color: "#fff",
                    cursor: importing ? "wait" : "pointer",
                  }}
                >
                  {importing ? "Đang bổ sung..." : "＋ Bổ sung thành viên"}
                </button>

                <span style={{ color: "#64748b", fontSize: 12 }}>
                  Danh sách mới sẽ được bổ sung vào danh sách hiện có.
MSSV đã tồn tại trong năm học này sẽ được cập nhật thông tin,
không tạo thêm dòng trùng. Thành viên không có trong danh sách
dán sẽ được giữ nguyên.
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(180px, 1.4fr) minmax(190px, 1fr) auto",
                  gap: 10,
                  alignItems: "end",
                  marginTop: 18,
                }}
              >
                <div>
                  <label
                    htmlFor="tenHoatDong"
                    style={{
                      display: "block",
                      fontSize: 14,
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    Tên hoạt động mới
                  </label>
                  <input
                    id="tenHoatDong"
                    value={tenHoatDong}
                    onChange={(event) => setTenHoatDong(event.target.value)}
                    placeholder="Ví dụ: Sinh hoạt CLB tháng 10"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label
                    htmlFor="thoiGian"
                    style={{
                      display: "block",
                      fontSize: 14,
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    Thời gian hoạt động
                  </label>
                  <input
                    id="thoiGian"
                    type="datetime-local"
                    value={thoiGian}
                    onChange={(event) => setThoiGian(event.target.value)}
                    style={inputStyle}
                  />
                </div>

                <button
                  type="button"
                  disabled={addingActivity}
                  onClick={() => void addActivity()}
                  style={{
                    ...buttonStyle,
                    background: addingActivity ? "#86efac" : "#16a34a",
                    color: "#fff",
                    minHeight: 40,
                    cursor: addingActivity ? "wait" : "pointer",
                  }}
                >
                  {addingActivity ? "Đang thêm..." : "＋ Thêm hoạt động"}
                </button>
              </div>
            </div>

            {/* Bảng có thể cuộn ngang khi thêm nhiều hoạt động */}
            <div style={{ padding: 16 }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    padding: "9px 12px",
                    borderRadius: 8,
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    fontSize: 13,
                  }}
                >
                  <b>{members.length}</b> thành viên
                </div>

                <div
                  style={{
                    padding: "9px 12px",
                    borderRadius: 8,
                    background: "#f0fdf4",
                    color: "#166534",
                    fontSize: 13,
                  }}
                >
                  <b>{activities.length}</b> hoạt động
                </div>

                <div
                  style={{
                    padding: "9px 12px",
                    borderRadius: 8,
                    background: "#fff7ed",
                    color: "#9a3412",
                    fontSize: 13,
                  }}
                >
                  <b>{totalAttendance}</b> lượt tham gia đã đánh dấu
                </div>
              </div>


{selectedMemberIds.length > 0 && (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 12,
      padding: "10px 12px",
      borderRadius: 8,
      background: "#fff1f2",
      border: "1px solid #fecdd3",
    }}
  >
    <span style={{ fontSize: 13, color: "#9f1239" }}>
      Đã chọn <b>{selectedMemberIds.length}</b> thành viên
    </span>

    <button
      type="button"
      disabled={deletingMembers}
      onClick={() => void deleteSelectedMembers()}
      style={{
        padding: "8px 12px",
        border: "none",
        borderRadius: 7,
        background: deletingMembers ? "#fda4af" : "#dc2626",
        color: "#fff",
        fontSize: 13,
        fontWeight: 700,
        cursor: deletingMembers ? "wait" : "pointer",
      }}
    >
      {deletingMembers ? "Đang xóa..." : `🗑 Xóa ${selectedMemberIds.length} người đã chọn`}
    </button>
  </div>
)}

              {loading ? (
                <div
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  Đang tải dữ liệu...
                </div>
              ) : (
                <div
                  style={{
                    width: "100%",
                    overflowX: "auto",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      minWidth: Math.max(760, 650 + activities.length * 190),
                      borderCollapse: "separate",
                      borderSpacing: 0,
                      fontSize: 13,
                    }}
                  >
                    <thead>
                      <tr>
                       
<th style={headerCellStyle}>
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 5,
    }}
  >
    <input
      type="checkbox"
      checked={
        members.length > 0 &&
        members.every((member) =>
          selectedMemberIds.includes(member.id)
        )
      }
      onChange={(event) =>
        toggleSelectAllMembers(event.target.checked)
      }
      title="Chọn hoặc bỏ chọn tất cả thành viên"
      style={{ width: 16, height: 16, cursor: "pointer" }}
    />
    <span>STT</span>
  </div>
</th>

                        <th style={{ ...headerCellStyle, minWidth: 190 }}>
                          Họ tên
                        </th>
                        <th style={{ ...headerCellStyle, minWidth: 130 }}>
                          Lớp
                        </th>
                        
<th style={{ ...headerCellStyle, minWidth: 125 }}>
  MSSV
</th>


                        {activities.map((activity) => (
                          <th
                            key={activity.id}
                            style={{
                              ...headerCellStyle,
                              minWidth: 185,
                              maxWidth: 240,
                              background: "#dbeafe",
                              color: "#1e3a8a",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 5,
                              }}
                            >
                              <span style={{ fontWeight: 800 }}>
                                {activity.ten_hoat_dong}
                              </span>
                              <span
                                style={{
                                  fontWeight: 400,
                                  fontSize: 11,
                                  color: "#475569",
                                }}
                              >
                                {formatDate(activity.thoi_gian)}
                              </span>
                              <button
                                type="button"
                                onClick={() => void deleteActivity(activity)}
                                title="Xóa hoạt động và dữ liệu điểm danh"
                                style={{
                                  border: "1px solid #fecaca",
                                  borderRadius: 5,
                                  background: "#fff",
                                  color: "#b91c1c",
                                  padding: "3px 7px",
                                  fontSize: 11,
                                  cursor: "pointer",
                                }}
                              >
                                Xóa cột
                              </button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {members.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5 + activities.length}
                            style={{
                              padding: 28,
                              textAlign: "center",
                              color: "#64748b",
                              borderBottom: "1px solid #e2e8f0",
                            }}
                          >
                            Chưa có thành viên trong năm học {namHoc}. Hãy
                            dán danh sách ở phía trên để bắt đầu.
                          </td>
                        </tr>
                      ) : (
                        members.map((member, index) => (
                          <tr key={member.id}>
                            
<td style={bodyCellStyle}>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    }}
  >
    <input
      type="checkbox"
      checked={selectedMemberIds.includes(member.id)}
      onChange={(event) =>
        toggleSelectMember(member.id, event.target.checked)
      }
      aria-label={`Chọn ${member.ho_ten}`}
      style={{ width: 16, height: 16, cursor: "pointer" }}
    />
    <span>{index + 1}</span>
  </div>
</td>

                            <td
                              style={{
                                ...bodyCellStyle,
                                textAlign: "left",
                                fontWeight: 600,
                              }}
                            >
                              {member.ho_ten}
                            </td>
                            <td style={bodyCellStyle}>{member.lop}</td>
                            
                            <td style={bodyCellStyle}>{member.mssv}</td>


                            {activities.map((activity) => {
                              const key = `${member.id}:${activity.id}`;
                              const checked = Boolean(attendance[key]);
                              const saving = Boolean(savingAttendance[key]);

                              return (
                                <td
                                  key={activity.id}
                                  style={{
                                    ...bodyCellStyle,
                                    background: checked ? "#f0fdf4" : "#fff",
                                  }}
                                >
                                  <label
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: 7,
                                      cursor: saving ? "wait" : "pointer",
                                      color: checked ? "#166534" : "#64748b",
                                      fontWeight: checked ? 700 : 400,
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      disabled={saving}
                                      onChange={(event) =>
                                        void toggleAttendance(
                                          member,
                                          activity,
                                          event.target.checked
                                        )
                                      }
                                      style={{
                                        width: 17,
                                        height: 17,
                                        accentColor: "#16a34a",
                                        cursor: saving ? "wait" : "pointer",
                                      }}
                                    />
                                    {saving
                                      ? "Đang lưu..."
                                      : checked
                                        ? "Có tham gia"
                                        : "Vắng"}
                                  </label>
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {showCriteria && (
        <CriteriaModal onClose={() => setShowCriteria(false)} />
      )}

      <Footer />
    </div>
  );
}

const headerCellStyle = {
  padding: "12px 10px",
  textAlign: "center" as const,
  verticalAlign: "middle" as const,
  background: "#f1f5f9",
  color: "#334155",
  borderBottom: "1px solid #cbd5e1",
  borderRight: "1px solid #e2e8f0",
  fontWeight: 700,
  whiteSpace: "normal" as const,
};

const bodyCellStyle = {
  padding: "12px 10px",
  textAlign: "center" as const,
  verticalAlign: "middle" as const,
  borderBottom: "1px solid #e2e8f0",
  borderRight: "1px solid #e2e8f0",
  color: "#0f172a",
};
