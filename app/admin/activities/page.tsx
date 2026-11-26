"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import CriteriaModal from "../../components/CriteriaModal";
import { authFetch } from "@/lib/auth-fetch";
import Image from "next/image";

type Activity = {
  id: string;
  title: string;
  criterion: string | null;
  organizer: string | null;
  document: string | null;
  documents: string[] | null;
  document_names: string[] | null;
  detail_content: string | null;
  activity_link: string | null;
  event_time: string | null;
  end_time: string | null;
  registration_deadline: string | null;
  created_at: string;
  status: string;
  academic_year_id: number | null;
};
type AcademicYear = {
  id: number;
  name: string;
  is_current: boolean;
};

type StudentRecipient = {
  id: string;
  ho_ten: string;
  lop: string;
  mssv: string;
  da_dang_ky: boolean;
  co_token: boolean;
};

const criterionLabel: Record<string, string> = {
  dao_duc: "Đạo đức tốt",
  hoc_tap: "Học tập tốt",
  the_luc: "Thể lực tốt",
  tinh_nguyen: "Tình nguyện tốt",
  hoi_nhap: "Hội nhập tốt",
  khac: "Khác",
};

function formatDate(date?: string |null) {
  return date || "Chưa có";
}
function getActivityStatus(activity: Activity, now: number) {
  if (!activity.event_time || !activity.end_time) {
    if (activity.status === "upcoming") return "scheduled";
    if (activity.status === "ongoing") return "ongoing";
    if (activity.status === "ended") return "ended";
    return "not_started";
  }

  const start = new Date(activity.event_time).getTime();
  const end = new Date(activity.end_time).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    if (activity.status === "upcoming") return "scheduled";
    if (activity.status === "ongoing") return "ongoing";
    if (activity.status === "ended") return "ended";
    return "not_started";
  }

  if (now < start) return "scheduled";
  if (now <= end) return "ongoing";

  return "ended";
}
function getDocumentStoragePath(url: string): string | null {
  const marker = "/documents/";
  const index = url.indexOf(marker);

  if (index === -1) return null;

  try {
    return decodeURIComponent(
      url.slice(index + marker.length).split("?")[0]
    );
  } catch {
    return null;
  }
}
export default function ActivitiesAdminPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [academicYearId, setAcademicYearId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());useEffect(() => {const timer = setInterval(() => {setCurrentTime(Date.now());}, 30000);return () => clearInterval(timer);}, []);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [documentModal, setDocumentModal] = useState(false);
  const [currentDocuments, setCurrentDocuments] = useState<string[]>([]);
  const [currentDocumentNames, setCurrentDocumentNames] = useState<string[]>([]);
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState(0);
  const [documentActivityId, setDocumentActivityId] = useState<string | null>(null);
  const [editingDocuments, setEditingDocuments] = useState<string[]>([]);
  const [editingDocumentNames, setEditingDocumentNames] = useState<string[]>([]);
  const [originalDocuments, setOriginalDocuments] = useState<string[]>([]);
  const [showCriteria,setShowCriteria]=useState(false);
  const [tab, setTab] = useState("proof");
  const [title, setTitle] = useState("");
  const [criterion, setCriterion] = useState("hoc_tap");
  const [organizer, setOrganizer] = useState("");
  const [detailContent, setDetailContent] = useState("");
  const [activityLink, setActivityLink] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [eventTime, setEventTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [deadline, setDeadline] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [mounted, setMounted] = useState(false);useEffect(() => {setMounted(true);}, []);
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [recipientStudents, setRecipientStudents] = useState<StudentRecipient[]>([]);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [tokenFilter, setTokenFilter] = useState("all");
  const [currentAcademicYear, setCurrentAcademicYear] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [filterCriterion, setFilterCriterion] = useState("all");
  const [searchActivity, setSearchActivity] = useState("");
  const [showActivityStats, setShowActivityStats] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const criterionStyle: Record<
  string,
  { bg: string; text: string }
> = {
  dao_duc: {
    bg: "bg-red-100",
    text: "text-red-700",
  },
  hoc_tap: {
    bg: "bg-blue-100",
    text: "text-blue-700",
  },
  the_luc: {
    bg: "bg-orange-100",
    text: "text-orange-700",
  },
  tinh_nguyen: {
    bg: "bg-green-100",
    text: "text-green-700",
  },
  hoi_nhap: {
    bg: "bg-purple-100",
    text: "text-purple-700",
  },
  khac: {
    bg: "bg-gray-100",
    text: "text-gray-700",
  },
};

function handleDocumentUpload(
  e: React.ChangeEvent<HTMLInputElement>
) {
  const input = e.currentTarget;
  const files = Array.from(input.files ?? []);

  if (files.length === 0) return;

  const validFiles = files.filter((file) => {
    const valid =
      /\.(pdf|doc|docx)$/i.test(file.name);

    if (!valid) {
      alert(`File không đúng định dạng: ${file.name}`);
    }

    return valid;
  });

  if (validFiles.length > 0) {
    setDocumentFiles((prev) => [...prev, ...validFiles]);
  }

  input.value = "";
}
const filteredActivities = activities.filter((activity) => {
  const matchYear =
    filterYear === "all" ||
    String(activity.academic_year_id ?? "") === filterYear;

  const matchCriterion =
    filterCriterion === "all" ||
    activity.criterion === filterCriterion;

  const matchSearch = activity.title
    .toLowerCase()
    .includes(searchActivity.trim().toLowerCase());

  return matchYear && matchCriterion && matchSearch;
});
async function loadAcademicYears() {
  const { data, error } = await supabase
    .from("academic_years")
    .select("id, name, is_current")
    .order("id", { ascending: false });

  if (error) {
    console.error("Lỗi tải năm học:", error);
    return;
  }

  if (data) {
    setAcademicYears(data);

    const currentYear = data.find((y) => y.is_current);

    if (currentYear) {
      setAcademicYearId(currentYear.id);
    }
  }
}
  async function loadActivities() {
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .order("event_time", { ascending: true });

    if (!error && data) setActivities(data);
  }

  useEffect(() => {
    loadAcademicYears();
    loadActivities();
  }, []);

  useEffect(() => {
  if (!showRecipientModal) return;

  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  return () => {
    document.body.style.overflow = previousOverflow;
  };
}, [showRecipientModal]);


async function handleSave() {
  if (!title.trim()) {
    alert("Vui lòng nhập tên hoạt động");
    return;
  }

  if (!eventTime || !endTime) {
    alert("Vui lòng chọn đầy đủ thời gian bắt đầu và kết thúc.");
    return;
  }

  if (new Date(endTime).getTime() <= new Date(eventTime).getTime()) {
    alert("Thời gian kết thúc phải sau thời gian bắt đầu.");
    return;
  }

  let normalizedLink = activityLink.trim();

  if (normalizedLink) {
    if (!/^https?:\/\//i.test(normalizedLink)) {
      normalizedLink = `https://${normalizedLink}`;
    }

    try {
      const parsedLink = new URL(normalizedLink);

      if (!["http:", "https:"].includes(parsedLink.protocol)) {
        throw new Error("invalid");
      }

      normalizedLink = parsedLink.href;
    } catch {
      alert("Đường dẫn không hợp lệ. Vui lòng kiểm tra lại.");
      return;
    }
  }

  setLoading(true);

  const documentUrls = editingId ? [...editingDocuments] : [];
  const documentNames = editingId ? [...editingDocumentNames] : [];
  const uploadedPaths: string[] = [];

  try {
    // TẢI LÊN CÁC VĂN BẢN MỚI
    for (const file of documentFiles) {
      const safeFileName = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^a-zA-Z0-9._-]/g, "_");

      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}-${safeFileName}`;

      console.log("Bắt đầu tải file:", file.name, file.size);

const { data: uploadData, error: uploadError } = await supabase.storage
  .from("documents")
  .upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });

if (uploadError) {
  console.error("LỖI TẢI FILE:", uploadError);
  throw new Error(
    `Không tải được file ${file.name}: ${uploadError.message}`
  );
}

console.log("TẢI FILE THÀNH CÔNG:", uploadData);

      uploadedPaths.push(fileName);

      const { data } = supabase.storage
        .from("documents")
        .getPublicUrl(fileName);

      documentUrls.push(data.publicUrl);
      documentNames.push(file.name);
    }

    // DỮ LIỆU HOẠT ĐỘNG
    const activityData = {
      title: title.trim(),
      criterion: criterion || null,
      organizer: organizer || null,
      document: documentUrls[0] || null,
      documents: documentUrls,
      document_names: documentNames,
      detail_content: detailContent || null,
      activity_link: normalizedLink || null,
      event_time: eventTime,
      end_time: endTime,
      registration_deadline: deadline || null,
      status: "upcoming",
    };

    let saveError;

    if (editingId) {
      const { error } = await supabase
        .from("activities")
        .update(activityData)
        .eq("id", editingId);

      saveError = error;
    } else {
      const { error } = await supabase
        .from("activities")
        .insert(activityData);

      saveError = error;
    }

    if (saveError) throw saveError;

    // XÓA VĂN BẢN CŨ ĐÃ ĐƯỢC GỠ KHỎI DANH SÁCH
    const removedDocuments = originalDocuments.filter(
      (url) => !documentUrls.includes(url)
    );

    const removedPaths = removedDocuments
      .map(getDocumentStoragePath)
      .filter((path): path is string => !!path);

    if (removedPaths.length > 0) {
      const { error: removeError } = await supabase.storage
        .from("documents")
        .remove(removedPaths);

      if (removeError) {
        console.error("Lỗi xóa văn bản cũ:", removeError);
        alert("Đã lưu hoạt động nhưng một số văn bản cũ chưa xóa được.");
      }
    }

    alert(editingId ? "Đã cập nhật hoạt động!" : "Đã thêm hoạt động!");

    // ĐẶT LẠI BIỂU MẪU
    setEditingId(null);
    setTitle("");
    setCriterion("hoc_tap");
    setOrganizer("");
    setDetailContent("");
    setActivityLink("");
    setShowLinkInput(false);
    setEventTime("");
    setEndTime("");
    setDeadline("");
    setDocumentFiles([]);
    setEditingDocuments([]);
    setEditingDocuments([]);
    setOriginalDocuments([]);

    const input = document.getElementById(
      "document-upload"
    ) as HTMLInputElement | null;

    if (input) input.value = "";

    await loadActivities();
  } catch (error) {
    console.error("Lỗi lưu hoạt động:", error);

    // DỌN CÁC FILE MỚI NẾU LƯU THẤT BẠI
    if (uploadedPaths.length > 0) {
      await supabase.storage
        .from("documents")
        .remove(uploadedPaths);
    }

    alert(
      error instanceof Error
        ? error.message
        : "Không thể lưu hoạt động."
    );
  } finally {
    setLoading(false);
  }
}

  const loadRecipients = async (activity: Activity) => {
  try {
    setRecipientLoading(true);

    // Lấy năm học hiện tại
    const { data: year, error: yearError } = await supabase
      .from("academic_years")
      .select("id, name")
      .eq("is_current", true)
      .maybeSingle();

    if (yearError) throw yearError;

    setCurrentAcademicYear(year?.name || "Chưa thiết lập");

    // Lấy danh sách sinh viên
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, ho_ten, lop, mssv")
      .eq("role", "student")
      .order("ho_ten", { ascending: true });

    if (profileError) throw profileError;

    const studentIds = (profiles || []).map((student) => student.id);

    // Lấy tài khoản đã bật thông báo điện thoại
    let tokenRows: { user_id: string; token: string }[] = [];

    if (studentIds.length > 0) {
      const { data, error } = await supabase
        .from("notification_tokens")
        .select("user_id, token")
        .in("user_id", studentIds);

      if (error) throw error;
      tokenRows = (data || []) as { user_id: string; token: string }[];
    }

    // Lấy sinh viên đã đăng ký phấn đấu trong năm học hiện tại
    let registeredRows: { user_id: string }[] = [];

    if (year) {
      const { data, error } = await supabase
        .from("student_year_profiles")
        .select("user_id")
        .eq("academic_year_id", year.id)
        .eq("dang_ky_phan_dau", true);

      if (error) throw error;
      registeredRows = (data || []) as { user_id: string }[];
    }

    const tokenUserIds = new Set(
      tokenRows
        .filter((item) => item.token)
        .map((item) => item.user_id)
    );

    const registeredIds = new Set(
      registeredRows.map((item) => item.user_id)
    );

    const recipients: StudentRecipient[] = (profiles || []).map((student) => ({
      id: student.id,
      ho_ten: student.ho_ten || "",
      lop: student.lop || "",
      mssv: student.mssv || "",
      da_dang_ky: registeredIds.has(student.id),
      co_token: tokenUserIds.has(student.id),
    }));

    setRecipientStudents(recipients);
    setSelectedRecipientIds([]);
    setSelectedActivity(activity);
    setShowRecipientModal(true);
  } catch (error) {
    console.error("Lỗi tải danh sách người nhận:", error);
    alert("Không thể tải danh sách sinh viên. Vui lòng thử lại!");
  } finally {
    setRecipientLoading(false);
  }
};
async function notifyUpcomingActivity(activity: Activity) {
  await loadRecipients(activity);
}

async function handleDelete(id: string) {
  if (!confirm("Bạn có chắc muốn xóa hoạt động và toàn bộ văn bản đính kèm?")) {
    return;
  }

  try {
    const { data: activity, error: fetchError } = await supabase
      .from("activities")
      .select("document, documents")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const allDocuments = [
      ...(activity.documents || []),
      ...(activity.document ? [activity.document] : []),
    ];

    const paths = [...new Set(allDocuments)]
      .map(getDocumentStoragePath)
      .filter((path): path is string => !!path);

    if (paths.length > 0) {
      const { error: removeError } = await supabase.storage
        .from("documents")
        .remove(paths);

      if (removeError) throw removeError;
    }

    const { error: deleteError } = await supabase
      .from("activities")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    alert("Đã xóa hoạt động và các văn bản đính kèm!");
    loadActivities();
  } catch (error) {
    console.error("Lỗi xóa hoạt động:", error);
    alert(
      error instanceof Error
        ? error.message
        : "Không thể xóa hoạt động hoặc văn bản."
    );
  }
}
function handleEdit(activity: Activity) {
  const docs = activity.documents?.length
    ? activity.documents
    : activity.document
    ? [activity.document]
    : [];

  const names = docs.map((url, index) =>
    activity.document_names?.[index] ||
    getDocumentStoragePath(url)?.split("/").pop() ||
    `Văn bản ${index + 1}`
  );

  setEditingId(activity.id);
  setEditingDocuments(docs);
  setEditingDocumentNames(names);
  setOriginalDocuments(docs);
  setDocumentFiles([]);

  setTitle(activity.title);
  setCriterion(activity.criterion || "hoc_tap");
  setOrganizer(activity.organizer || "");
  setDetailContent(activity.detail_content || "");
  setActivityLink(activity.activity_link || "");
  setShowLinkInput(!!activity.activity_link);
  setEventTime(activity.event_time || "");
  setEndTime(activity.end_time || "");
  setDeadline(activity.registration_deadline || "");

  setOpenId(null);

  const input = document.getElementById(
    "document-upload"
  ) as HTMLInputElement | null;

  if (input) input.value = "";

  window.scrollTo({ top: 0, behavior: "smooth" });
}
// Chọn / bỏ chọn một sinh viên
const toggleRecipient = (id: string) => {
  setSelectedRecipientIds((prev) =>
    prev.includes(id)
      ? prev.filter((item) => item !== id)
      : [...prev, id]
  );
};

const filteredRecipientStudents = recipientStudents.filter((student) => {
  if (tokenFilter === "enabled") return student.co_token;
  if (tokenFilter === "disabled") return !student.co_token;
  return true;
});
// Chọn tất cả tài khoản có bật thông báo điện thoại
const selectAllWithToken = () => {
  setSelectedRecipientIds(
    recipientStudents
      .filter((student) => student.co_token)
      .map((student) => student.id)
  );
};

// Chọn sinh viên đã đăng ký phấn đấu và có bật thông báo
const selectRegisteredWithToken = () => {
  setSelectedRecipientIds(
    recipientStudents
      .filter((student) => student.da_dang_ky && student.co_token)
      .map((student) => student.id)
  );
};

// Gửi thông báo cho danh sách đã chọn
const sendSelectedNotifications = async () => {
  if (!selectedActivity) return;

  if (selectedRecipientIds.length === 0) {
    alert("Vui lòng chọn ít nhất một sinh viên.");
    return;
  }

  if (!confirm(`Gửi thông báo cho ${selectedRecipientIds.length} tài khoản đã chọn?`)) {
    return;
  }

  try {
    setSendingNotification(true);

    const response = await authFetch("/api/notifications/activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        activityId: selectedActivity.id,
        title: "📢 Hoạt động sắp diễn ra",
        body: `${selectedActivity.title}${
  selectedActivity.event_time
    ? ` sẽ diễn ra vào ${formatEventDateTime(selectedActivity.event_time)}.`
    : "."
}`,
        url: "/hoat-dong",
        userIds: selectedRecipientIds,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Gửi thông báo thất bại.");
    }

    alert(
      `Đã gửi thông báo điện thoại.\nSố tài khoản được chọn: ${selectedRecipientIds.length}\nSố thông báo gửi thành công: ${result.sent ?? 0}`
    );

    setShowRecipientModal(false);
    setSelectedRecipientIds([]);
  } catch (error) {
    console.error(error);
    alert(
      error instanceof Error ? error.message : "Có lỗi khi gửi thông báo."
    );
  } finally {
    setSendingNotification(false);
  }
};
  return (
    <div className="min-h-screen bg-gray-50">
       <Header
  tab={tab}
  setTab={setTab}
  openCriteria={() => setShowCriteria(true)}
  openProfile={() => setShowProfile(true)}
/>
      {/* ================= MAIN ================= */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-4">
  <a
    href="/admin"
    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:border-sky-300"
  >
    ← Trang chủ
  </a>
</div>

<div className="mb-8 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 p-4 sm:p-6 text-white shadow-lg">
  {/* Tiêu đề */}
  <button
    type="button"
    onClick={() => setShowActivityStats(!showActivityStats)}
    className="flex w-full items-center justify-between md:cursor-default"
  >
    <h2 className="text-xl sm:text-2xl font-bold text-white">
      Quản lý hoạt động
    </h2>

    <span className="text-xl md:hidden transition-transform duration-200">
      {showActivityStats ? "▲" : "▼"}
    </span>
  </button>


{/* Thống kê: luôn hiện trên desktop, chỉ mở khi bấm trên mobile */}
<div className={`${showActivityStats ? "block" : "hidden"} md:block mt-5`}>
  <div className="rounded-xl bg-white px-4 sm:px-5 py-4 shadow-sm">
    <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-8">

      {/* Thống kê trạng thái */}
      <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 md:shrink-0">
        <div>
          <p className="text-xs text-gray-500">Đang diễn ra</p>
          <p className="text-xl font-bold leading-tight text-red-600">
            {activities.filter(
              (a) => getActivityStatus(a, currentTime) === "ongoing"
            ).length}
          </p>
        </div>

        <div className="border-t sm:border-t-0 sm:border-l border-gray-200 pt-3 sm:pt-0 sm:pl-8">
          <p className="text-xs text-gray-500">Sắp diễn ra</p>
          <p className="text-xl font-bold leading-tight text-blue-600">
            {activities.filter(
              (a) => getActivityStatus(a, currentTime) === "scheduled"
            ).length}
          </p>
        </div>
      </div>

      {/* Thống kê tiêu chí */}
      <div className="min-w-0 flex-1 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-8">
        <p className="mb-3 text-sm font-semibold text-gray-700">
          Hoạt động theo tiêu chí
        </p>

        <div className="flex flex-wrap gap-2">
          {[
            {
              key: "dao_duc",
              name: "Đạo đức tốt",
              color: "bg-rose-50 text-rose-700",
              countColor: "text-rose-700",
            },
            {
              key: "hoc_tap",
              name: "Học tập tốt",
              color: "bg-blue-50 text-blue-700",
              countColor: "text-blue-700",
            },
            {
              key: "the_luc",
              name: "Thể lực tốt",
              color: "bg-orange-50 text-orange-700",
              countColor: "text-orange-700",
            },
            {
              key: "tinh_nguyen",
              name: "Tình nguyện tốt",
              color: "bg-emerald-50 text-emerald-700",
              countColor: "text-emerald-700",
            },
            {
              key: "hoi_nhap",
              name: "Hội nhập tốt",
              color: "bg-violet-50 text-violet-700",
              countColor: "text-violet-700",
            },
          ].map((criterion) => (
            <div
              key={criterion.name}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${criterion.color}`}
            >
              <span className="whitespace-nowrap text-sm font-medium">
                {criterion.name}
              </span>

              <span className={`text-base font-bold ${criterion.countColor}`}>
                {activities.filter(
                  (a) => a.criterion === criterion.key
                ).length}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  </div>
</div>

</div>

{/* BỘ LỌC HOẠT ĐỘNG */}
<div className="mb-5 rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

    {/* Lọc năm học */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Năm học
      </label>
      <select
        value={filterYear}
        onChange={(e) => setFilterYear(e.target.value)}
        className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
      >
        <option value="all">Tất cả năm học</option>
        {academicYears.map((year) => (
          <option key={year.id} value={String(year.id)}>
            {year.name}
          </option>
        ))}
      </select>
    </div>

    {/* Lọc tiêu chí */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Tiêu chí
      </label>
      <select
        value={filterCriterion}
        onChange={(e) => setFilterCriterion(e.target.value)}
        className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
      >
        <option value="all">Tất cả tiêu chí</option>
        <option value="dao_duc">Đạo đức</option>
        <option value="hoc_tap">Học tập</option>
        <option value="the_luc">Thể lực</option>
        <option value="tinh_nguyen">Tình nguyện</option>
        <option value="hoi_nhap">Hội nhập</option>
      </select>
    </div>

    {/* Tìm kiếm */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Tìm chương trình
      </label>
      <input
        type="text"
        value={searchActivity}
        onChange={(e) => setSearchActivity(e.target.value)}
        placeholder="Nhập tên chương trình..."
        className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
      />
    </div>

  </div>
</div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[420px_1fr]">
          {/* ================= FORM ================= */}
          <div>
            {/* NÚT MỞ FORM TRÊN MOBILE */}
<button
  type="button"
  onClick={() => setShowActivityForm(!showActivityForm)}
  className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 px-5 py-4 font-semibold text-white shadow-lg transition hover:brightness-105 xl:hidden"
>
  {showActivityForm ? "✕ Đóng form hoạt động" : "+ Thêm hoạt động"}
</button>

{/* FORM: MOBILE ẨN/MỞ, DESKTOP LUÔN HIỆN */}
<div className={`${showActivityForm ? "block" : "hidden"} xl:block`}>
            <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900">
  {editingId ? "Chỉnh sửa hoạt động" : "Thêm hoạt động mới"}
</h3>
<p className="mt-1 text-sm text-gray-500">
  {editingId
    ? "Cập nhật thông tin và văn bản đính kèm của hoạt động."
    : "Điền đầy đủ thông tin để tạo hoạt động mới."}
</p>
              </div>

              <div className="space-y-5">
                {/* TÊN HOẠT ĐỘNG */}
<div>
  <label className="mb-2 block text-sm font-semibold text-gray-700">
    Tên hoạt động <span className="text-red-500">*</span>
  </label>

  <input
    type="text"
    required
    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
    placeholder="Nhập tên hoạt động..."
    value={title}
    onChange={(e) => setTitle(e.target.value)}
  />
</div>
{/* MÔ TẢ HOẠT ĐỘNG */}
<div>
  <label className="mb-2 block text-sm font-semibold text-gray-700">
    Mô tả hoạt động
  </label>

  <textarea
    rows={4}
    className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
    placeholder="Nhập nội dung mô tả hoạt động... Ví dụ: Vui lòng kiểm tra email để biết thêm thông tin chi tiết."
    value={detailContent}
    onChange={(e) => setDetailContent(e.target.value)}
  />
</div>
{/* LIÊN KẾT HOẠT ĐỘNG */}
<div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <p className="font-semibold text-blue-900">
        Liên kết hoạt động
      </p>
      <p className="mt-1 text-xs text-blue-700">
        Thêm đường dẫn đăng ký hoặc chi tiết hoạt động.
      </p>
    </div>

    <button
      type="button"
      onClick={() => setShowLinkInput(!showLinkInput)}
      className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
    >
      {showLinkInput ? "Ẩn ô liên kết" : "🔗 Chèn liên kết"}
    </button>
  </div>

  {showLinkInput && (
    <div className="mt-4">
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        Đường dẫn truy cập
      </label>

      <input
        type="url"
        className="w-full rounded-xl border border-blue-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        placeholder="https://example.com"
        value={activityLink}
        onChange={(e) => setActivityLink(e.target.value)}
      />

      <p className="mt-2 text-xs text-gray-500">
        Sinh viên sẽ nhìn thấy nút truy cập hoạt động và có thể mở liên kết này.
      </p>
    </div>
  )}
</div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Tiêu chí
                  </label>
                  <select
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    value={criterion}
                    onChange={(e) => setCriterion(e.target.value)}
                  >
                    <option value="dao_duc">Đạo đức tốt</option>
                    <option value="hoc_tap">Học tập tốt</option>
                    <option value="the_luc">Thể lực tốt</option>
                    <option value="tinh_nguyen">Tình nguyện tốt</option>
                    <option value="hoi_nhap">Hội nhập tốt</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Đơn vị tổ chức
                  </label>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Năm học
                </label>

                <select
                  value={academicYearId ?? ""}
                  onChange={(e) =>
                    setAcademicYearId(e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">-- Chọn năm học --</option>

                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                      {year.is_current ? " (Hiện tại)" : ""}
                    </option>
                  ))}
                </select>
              </div>
                  <input
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Đoàn trường, Hội Sinh viên..."
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Văn bản ban hành
                  </label>
<label
  htmlFor="document-upload"
  className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-300 bg-white px-5 py-4 transition hover:border-blue-500 hover:bg-blue-50"
>
  <div>
    <p className="font-semibold text-gray-800">
      📄 Chọn văn bản đính kèm
    </p>
  </div>

  <span className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
    + Chọn tệp
  </span>
</label>

<input
  id="document-upload"
  type="file"
  accept=".pdf,.doc,.docx"
  multiple
  onChange={handleDocumentUpload}
  className="hidden"
/>
{/* DANH SÁCH VĂN BẢN ĐÃ CÓ */}
{editingDocuments.length > 0 && (
  <div className="mt-4 space-y-2">
    <p className="text-sm font-semibold text-green-800">
      Văn bản hiện tại ({editingDocuments.length})
    </p>

    {editingDocuments.map((url, index) => (
      <div
        key={url}
        className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-3"
      >
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 break-all text-sm font-medium text-green-700 underline"
        >
          📄 Văn bản {index + 1}: {getDocumentStoragePath(url)?.split("/").pop() || "Xem văn bản"}
        </a>

        <button
          type="button"
          onClick={() => {
  if (confirm("Gỡ văn bản này khỏi hoạt động?")) {
    setEditingDocuments((prev) =>
      prev.filter((_, i) => i !== index)
    );

    setEditingDocumentNames((prev) =>
      prev.filter((_, i) => i !== index)
    );
  }
}}
          className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
        >
          Xóa
        </button>
      </div>
    ))}
  </div>
)}

{/* DANH SÁCH VĂN BẢN MỚI */}
{documentFiles.length > 0 && (
  <div className="mt-4 space-y-2">
    <p className="text-sm font-semibold text-blue-800">
      Văn bản mới sẽ tải lên ({documentFiles.length})
    </p>

    {documentFiles.map((file, index) => (
      <div
        key={`${file.name}-${index}`}
        className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3"
      >
        <p className="min-w-0 flex-1 break-all text-sm text-gray-700">
          📎 {file.name}
        </p>

        <button
          type="button"
          onClick={() => {
            setDocumentFiles((prev) =>
              prev.filter((_, i) => i !== index)
            );
          }}
          className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
        >
          Xóa
        </button>
      </div>
    ))}
  </div>
)}


                </div>
                <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="min-w-0">
  <label className="mb-2 block text-sm font-semibold text-gray-700">
    Thời gian bắt đầu
  </label>
  <input
    type="datetime-local"
    step="60"
    className="box-border w-full min-w-0 max-w-full rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
    value={eventTime}
    onChange={(e) => setEventTime(e.target.value)}
  />
</div>

<div className="min-w-0">
  <label className="mb-2 block text-sm font-semibold text-gray-700">
    Thời gian kết thúc
  </label>
  <input
    type="datetime-local"
    step="60"
    min={eventTime || undefined}
    className="box-border w-full min-w-0 max-w-full rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
    value={endTime}
    onChange={(e) => setEndTime(e.target.value)}
  />
</div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Hạn đăng ký
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
<div>
  <label className="mb-2 block text-sm font-semibold text-gray-700">
    Trạng thái hoạt động
  </label>
  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
    Tự động cập nhật
  </div>
</div>
                </div>
<div className="mt-4 flex gap-3">
  <button
  type="button"
  onClick={handleSave}
  disabled={loading}
  className="flex-1 rounded-xl bg-blue-600 py-3.5 text-base font-semibold text-white transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
>
    {loading
      ? "Đang lưu..."
      : editingId
      ? "Cập nhật hoạt động"
      : "Lưu hoạt động"}
  </button>

  {editingId && (
    <button
      type="button"
     onClick={() => {
  setEditingId(null);
  setTitle("");
  setCriterion("hoc_tap");
  setOrganizer("");
  setDetailContent("");
  setActivityLink("");
  setShowLinkInput(false);
  setEventTime("");
  setEndTime("");
  setDeadline("");
  setDocumentFiles([]);
  setEditingDocuments([]);
  setEditingDocumentNames([]);
  setOriginalDocuments([]);

  const input = document.getElementById(
    "document-upload"
  ) as HTMLInputElement | null;

  if (input) input.value = "";
}}
      className="rounded-xl border border-gray-300 px-6 py-3 font-semibold transition hover:bg-gray-100"
    >
      Hủy
    </button>
  )}
               </div>
              </div>
            </div>
          </div>
        </div>
 
          {/* ================= DANH SÁCH (PHẦN 2) ================= */}
          <div>
                        <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Danh sách hoạt động
                  </h3>
                </div>
              </div>

                {activities.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
                    <div className="text-5xl">📂</div>
                    <h4 className="mt-4 text-lg font-semibold text-gray-700">
                      Chưa có hoạt động nào
                    </h4>
                    <p className="mt-2 text-gray-500">
                      Hãy thêm hoạt động đầu tiên bằng biểu mẫu bên trái.
                    </p>
                  </div>
                ) : filteredActivities.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
                    <div className="text-4xl">🔍</div>
                    <h4 className="mt-3 text-lg font-semibold text-gray-700">
                      Không tìm thấy hoạt động
                    </h4>
                    <p className="mt-2 text-sm text-gray-500">
                      Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
                    </p>
                  </div>
                ) : (
                <div className="space-y-4">
                {[...filteredActivities]
                  .sort((a, b) => {
                    const statusOrder = {
                      ongoing: 0,
                      scheduled: 1,
                      ended: 2,
                      not_started: 3,
                    };

                    const statusA = getActivityStatus(a, currentTime);
                    const statusB = getActivityStatus(b, currentTime);

                    const priorityDiff =
                      statusOrder[statusA as keyof typeof statusOrder] -
                      statusOrder[statusB as keyof typeof statusOrder];

                    if (priorityDiff !== 0) return priorityDiff;

                    const startA = a.event_time
                      ? new Date(a.event_time).getTime()
                      : 0;

                    const startB = b.event_time
                      ? new Date(b.event_time).getTime()
                      : 0;

                    const endA = a.end_time
                      ? new Date(a.end_time).getTime()
                      : startA;

                    const endB = b.end_time
                      ? new Date(b.end_time).getTime()
                      : startB;

                    if (statusA === "ended") {
                      return endB - endA;
                    }

                    return startA - startB;
                  })
                  .map((activity) => (
                    <div
                      key={activity.id}
                      className="overflow-hidden rounded-2xl border border-gray-200 transition hover:shadow-md"
                    >
                      <button
                        onClick={() =>
                          setOpenId(
                            openId === activity.id ? null : activity.id
                          )
                        }
                        className="flex w-full items-center justify-between bg-white px-6 py-5 text-left transition hover:bg-gray-50"
                      >
                        <div>
  <h4 className="text-lg font-semibold text-gray-900">
    {activity.title}
  </h4>

<div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
  <span
    className={`rounded-full px-3 py-1 text-xs font-semibold ${
      criterionStyle[activity.criterion || "khac"]?.bg
    } ${
      criterionStyle[activity.criterion || "khac"]?.text
    }`}
  >
    {criterionLabel[activity.criterion || ""] || "Chưa có"}
  </span>

  <span className="text-gray-500">
  📅 {formatEventDateTime(activity.event_time)}
  {" - "}
  {formatEventDateTime(activity.end_time)}
</span>

<span
  className={`rounded-full px-3 py-1 text-xs font-semibold ${
    getActivityStatus(activity, currentTime) === "scheduled"
      ? "bg-blue-100 text-blue-700"
      : getActivityStatus(activity, currentTime) === "ongoing"
      ? "bg-green-100 text-green-700"
      : getActivityStatus(activity, currentTime) === "ended"
      ? "bg-gray-200 text-gray-700"
      : "bg-yellow-100 text-yellow-700"
  }`}
>
  {getActivityStatus(activity, currentTime) === "scheduled"
    ? "Sắp diễn ra"
    : getActivityStatus(activity, currentTime) === "ongoing"
    ? "Đang diễn ra"
    : getActivityStatus(activity, currentTime) === "ended"
    ? "Đã kết thúc"
    : "Chưa diễn ra"}
</span>
</div>
</div>

                        <div className="text-2xl text-gray-400">
                          {openId === activity.id ? "−" : "+"}
                        </div>
                      </button>

                      {openId === activity.id && (
                        <div className="border-t bg-gray-50 px-6 py-6">
                          <div className="grid gap-5 md:grid-cols-2">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Tiêu chí
                              </p>
                              <p className="mt-1 font-medium">
                                {criterionLabel[activity.criterion || ""] ||
                                  "Chưa có"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Đơn vị tổ chức
                              </p>
                              <p className="mt-1">
                                {activity.organizer || "Chưa có"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Văn bản
                              </p>
<button
onClick={() => {
  const docs = activity.documents?.length
    ? activity.documents
    : activity.document
    ? [activity.document]
    : [];

  const names = docs.map((url, index) =>
    activity.document_names?.[index] ||
    getDocumentStoragePath(url)?.split("/").pop() ||
    `Văn bản ${index + 1}`
  );

  setCurrentDocuments(docs);
  setCurrentDocumentNames(names);
  setCurrentDocumentIndex(0);
  setDocumentActivityId(activity.id);
  setDocumentModal(true);
}}
  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
>
  <span className="inline-flex items-center gap-1 whitespace-nowrap">
    <Image src="/iconxem2.png" width={20} height={20} alt="Xem" />
    Xem ({activity.documents?.length || (activity.document ? 1 : 0)})
  </span>
</button>
                </div>

                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Hạn đăng ký
                              </p>
                              <p className="mt-1">
                                {formatDate(
                                  activity.registration_deadline
                                )}
                              </p>
                            </div>

                            {/* MÔ TẢ HOẠT ĐỘNG */}
<div className="md:col-span-2">
  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
    Mô tả hoạt động
  </p>

  <p className="mt-1 whitespace-pre-wrap break-words text-gray-700">
    {activity.detail_content || "Chưa có mô tả"}
  </p>
</div>

{/* LIÊN KẾT HOẠT ĐỘNG */}
<div className="md:col-span-2">
  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
    Liên kết hoạt động
  </p>

  {activity.activity_link ? (
    <a
      href={activity.activity_link}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex max-w-full items-center gap-2 break-all rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:border-blue-400 hover:bg-blue-100"
    >
      🔗 {activity.activity_link}
      <span className="shrink-0">↗</span>
    </a>
  ) : (
    <p className="mt-1 text-gray-500">Chưa có liên kết</p>
  )}
</div>
                          </div>

                          <div className="mt-6 flex justify-end">
                            <div className="mt-6 flex justify-end gap-3">
  <button
    onClick={() => handleEdit(activity)}
    className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
  >
    Chỉnh sửa
  </button>
  <button
  onClick={() => notifyUpcomingActivity(activity)}
  className="rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
>
 Thông báo
</button>

  <button
    onClick={() => handleDelete(activity.id)}
    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
  >
    <><Image src="/iconthungrac.png" width={20} height={20} alt="Xóa" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} />Xóa</>
  </button>
</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>


{showRecipientModal && mounted && createPortal(
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 2147483647,
      background: "rgba(0,0,0,0.65)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      pointerEvents: "auto",
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "100%",
        maxWidth: "1100px",
        height: "85vh",
        background: "#fff",
        borderRadius: "16px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        pointerEvents: "auto",
      }}
    >
      {/* TIÊU ĐỀ */}
      <div style={{
        flexShrink: 0,
        padding: "18px 22px",
        borderBottom: "1px solid #ddd",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111" }}>
            Chọn người nhận thông báo
          </h2>
          <p style={{ color: "#555", marginTop: "5px" }}>
            Hoạt động: {selectedActivity?.title}
          </p>
          <p style={{ color: "#2563eb", fontSize: "14px" }}>
            Năm học: {currentAcademicYear}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowRecipientModal(false)}
          style={{
            cursor: "pointer",
            fontSize: "30px",
            padding: "5px 12px",
            color: "#555",
          }}
        >
          ×
        </button>
      </div>

      {/* THANH CÔNG CỤ */}
<div style={{
  flexShrink: 0,
  padding: "14px 20px",
  borderBottom: "1px solid #ddd",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "10px",
}}>
  <button
    type="button"
    onClick={selectAllWithToken}
    style={{
      background: "#2563eb",
      color: "white",
      padding: "9px 14px",
      borderRadius: "8px",
      cursor: "pointer",
    }}
  >
    Chọn tất cả tài khoản
  </button>

  <button
    type="button"
    onClick={selectRegisteredWithToken}
    style={{
      background: "#16a34a",
      color: "white",
      padding: "9px 14px",
      borderRadius: "8px",
      cursor: "pointer",
    }}
  >
    Chọn tài khoản đã đăng ký phấn đấu
  </button>

  <select
    value={tokenFilter}
    onChange={(e) => setTokenFilter(e.target.value)}
    style={{
      border: "1px solid #ccc",
      borderRadius: "8px",
      padding: "10px",
      color: "#333",
      background: "white",
    }}
  >
    <option value="all">Tất cả tài khoản</option>
    <option value="enabled">Đã bật thông báo điện thoại</option>
    <option value="disabled">Chưa bật thông báo điện thoại</option>
  </select>

  <strong style={{ color: "#333" }}>
    Đã chọn: {selectedRecipientIds.length} tài khoản
  </strong>
</div>

      {/* DANH SÁCH CUỘN ĐỘC LẬP */}
      <div
        style={{
          flex: "1 1 0",
          minHeight: 0,
          overflowY: "auto",
          overflowX: "auto",
          padding: "14px 20px",
          pointerEvents: "auto",
        }}
      >
        <p style={{ fontSize: "12px", color: "#666", marginBottom: "12px" }}>
          Tài khoản chưa bật thông báo điện thoại sẽ không thể chọn.
        </p>

        <table style={{
          width: "100%",
          minWidth: "750px",
          borderCollapse: "collapse",
          fontSize: "14px",
          color: "#222",
        }}>
          <thead style={{
  background: "#f3f4f6",
}}>
            <tr>
              {["Chọn", "STT", "Họ tên", "Lớp", "MSSV", "Trạng thái đăng ký mô hình"].map((item) => (
                <th key={item} style={{
                  border: "1px solid #ccc",
                  padding: "12px",
                }}>
                  {item}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredRecipientStudents.map((student, index) => (
              <tr key={student.id}>
                <td style={{ border: "1px solid #ccc", padding: "12px", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={selectedRecipientIds.includes(student.id)}
                    disabled={!student.co_token}
                    onChange={() => toggleRecipient(student.id)}
                    style={{ width: "17px", height: "17px", cursor: student.co_token ? "pointer" : "not-allowed" }}
                  />
                </td>
                <td style={{ border: "1px solid #ccc", padding: "12px", textAlign: "center" }}>
                  {index + 1}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "12px" }}>
                  <div style={{ fontWeight: 600 }}>{student.ho_ten}</div>
                  {!student.co_token && (
                    <div style={{ color: "red", fontSize: "12px" }}>
                      Chưa bật thông báo điện thoại
                    </div>
                  )}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "12px", textAlign: "center" }}>
                  {student.lop}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "12px", textAlign: "center" }}>
                  {student.mssv}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "12px", textAlign: "center" }}>
                  {student.da_dang_ky ? "Đã đăng ký" : "Chưa đăng ký"}
                </td>
              </tr>
            ))}

            {filteredRecipientStudents.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "30px", textAlign: "center" }}>
                  Không có sinh viên.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* NÚT CUỐI */}
      <div style={{
        flexShrink: 0,
        padding: "14px 20px",
        borderTop: "1px solid #ddd",
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px",
      }}>
        <button
          type="button"
          onClick={() => setShowRecipientModal(false)}
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "9px 18px",
            cursor: "pointer",
          }}
        >
          Hủy
        </button>

        <button
          type="button"
          onClick={sendSelectedNotifications}
          disabled={sendingNotification || selectedRecipientIds.length === 0}
          style={{
            background: "#2563eb",
            color: "white",
            borderRadius: "8px",
            padding: "9px 18px",
            cursor: "pointer",
            opacity: sendingNotification || selectedRecipientIds.length === 0 ? 0.5 : 1,
          }}
        >
          {sendingNotification ? "Đang gửi..." : "Gửi thông báo đã chọn"}
        </button>
      </div>
    </div>
  </div>,
  document.body
)}




{documentModal && mounted && createPortal(
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 2147483647,
      width: "100vw",
      height: "100dvh",
      background: "rgba(0,0,0,0.75)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "12px",
    }}
  >
    <div
      style={{
        width: "100%",
        maxWidth: "1400px",
        height: "100%",
        background: "#fff",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* THANH TIÊU ĐỀ */}
      <div
        style={{
          flexShrink: 0,
          padding: "12px 16px",
          borderBottom: "1px solid #ddd",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "#111",
              overflowWrap: "anywhere",
            }}
          >
            {currentDocumentNames[currentDocumentIndex] ||
              `Văn bản ${currentDocumentIndex + 1}`}
          </p>

          <p style={{ fontSize: "12px", color: "#666", marginTop: "3px" }}>
            Văn bản {currentDocumentIndex + 1} / {currentDocuments.length}
          </p>
        </div>

        <a
          href={`/api/activity-documents/${documentActivityId}/${currentDocumentIndex}`}
          download
          style={{
            flexShrink: 0,
            color: "#2563eb",
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Tải xuống ↓
        </a>

        <button
          type="button"
          onClick={() => setDocumentModal(false)}
          style={{
            flexShrink: 0,
            fontSize: "26px",
            color: "#555",
            padding: "0 8px",
          }}
        >
          ×
        </button>
      </div>

      {/* KHU VỰC XEM VĂN BẢN */}
      <div
        style={{
          flex: "1 1 0",
          minHeight: 0,
          position: "relative",
          background: "#e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {currentDocuments.length > 0 && (
          <>
            <iframe
              key={currentDocuments[currentDocumentIndex]}
              src={`${currentDocuments[currentDocumentIndex]}#toolbar=0&navpanes=0`}
              title={currentDocumentNames[currentDocumentIndex] || "Văn bản"}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                background: "#fff",
              }}
            />

            {currentDocumentIndex > 0 && (
              <button
                type="button"
                onClick={() =>
                  setCurrentDocumentIndex((prev) => prev - 1)
                }
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.95)",
                  color: "#1f2937",
                  fontSize: "28px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                  cursor: "pointer",
                }}
                aria-label="Văn bản trước"
              >
                ‹
              </button>
            )}

            {currentDocumentIndex < currentDocuments.length - 1 && (
              <button
                type="button"
                onClick={() =>
                  setCurrentDocumentIndex((prev) => prev + 1)
                }
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.95)",
                  color: "#1f2937",
                  fontSize: "28px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                  cursor: "pointer",
                }}
                aria-label="Văn bản tiếp theo"
              >
                ›
              </button>
            )}
          </>
        )}
      </div>
    </div>
  </div>,
  document.body
)}

  {showCriteria && (
      <CriteriaModal
        onClose={() => setShowCriteria(false)}
      />
    )}

    <Footer/>
    </div>
  );
}
function formatEventDateTime(value: string | null) {
  if (!value) return "Chưa xác định";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Chưa xác định";

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).replace(",", " ·");
}
