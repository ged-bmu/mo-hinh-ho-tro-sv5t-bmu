"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import CriteriaModal from "../../components/CriteriaModal";

type Activity = {
  id: string;
  title: string;
  criterion: string | null;
  organizer: string | null;
  document: string | null;
  detail_content: string | null;
  event_time: string | null;
  end_time: string | null;
  registration_deadline: string | null;
  created_at: string;
  status: string;
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
export default function ActivitiesAdminPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentModal, setDocumentModal] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<string | null>(null);
  const [showCriteria,setShowCriteria]=useState(false);
  const [tab, setTab] = useState("proof");
  const [title, setTitle] = useState("");
  const [criterion, setCriterion] = useState("hoc_tap");
  const [organizer, setOrganizer] = useState("");
  const [detailContent, setDetailContent] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timeType, setTimeType] = useState<"single" | "range">("single");
  const [deadline, setDeadline] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [status, setStatus] = useState("upcoming");
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
    bg: "bg-blue-100",
    text: "text-blue-700",
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
  if (e.target.files?.length) {
    setDocumentFile(e.target.files[0]);
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
    loadActivities();
  }, []);

  async function handleSave() {
    if (!title.trim()) {
      alert("Vui lòng nhập tên hoạt động");
      return;
    }

    setLoading(true);
let documentUrl: string | null = null;

if (documentFile) {
  const fileName = `${Date.now()}-${documentFile.name}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(fileName, documentFile);

  if (uploadError) {
    alert(uploadError.message);
    setLoading(false);
    return;
  }

  const { data } = supabase.storage
    .from("documents")
    .getPublicUrl(fileName);

  documentUrl = data.publicUrl;
}
let error;

if (editingId) {
  ({ error } = await supabase
    .from("activities")
    .update({
      title,
      criterion: criterion || null,
      organizer: organizer || null,
      document: documentUrl,
      detail_content: detailContent || null,
      event_time: eventTime || null,
      end_time: timeType === "range" ? endTime || null : null,
      registration_deadline: deadline || null,
      status,
    })
    .eq("id", editingId));
}else {
  const { data, error: insertError } = await supabase
    .from("activities")
    .insert({
      title,
      criterion: criterion || null,
      organizer: organizer || null,
      document: documentUrl,
      detail_content: detailContent || null,
      event_time: eventTime || null,
      end_time: timeType === "range" ? endTime || null : null,
      registration_deadline: deadline || null,
      status,
    })
    .select()
    .single();

  error = insertError;

  if (!insertError && data) {
    console.log("Hoạt động mới:", data);

    // chỗ này lát gắn gửi thông báo
  }
}

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }
setEditingId(null);

setTitle("");
setCriterion("hoc_tap");
setOrganizer("");
setDetailContent("");
setEventTime("");
setEndTime("");
setDeadline("");
setDocumentFile(null);
setIsActive(true);

loadActivities();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa hoạt động này?")) return;

    await supabase.from("activities").delete().eq("id", id);

    loadActivities();
  }
function handleEdit(activity: Activity) {
  setEditingId(activity.id);
  setDocumentFile(null);
  setTitle(activity.title);
  setCriterion(activity.criterion || "hoc_tap");
  setOrganizer(activity.organizer || "");
  setDetailContent(activity.detail_content || "");
  setEventTime(activity.event_time || "");
  setDeadline(activity.registration_deadline || "");
  setStatus(activity.status || "upcoming");
}
  return (
    <div className="min-h-screen bg-gray-50">
      <Header
            tab={tab}
            setTab={setTab}
            openCriteria={() => setShowCriteria(true)}
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
       <div className="mb-8 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 p-6 text-white shadow-lg">
  <div className="mb-5">
    <h2 className="text-2xl font-bold text-white">
  Quản lý hoạt động
</h2>

<p className="mt-1 text-sm text-sky-100">
  Quản lý, tạo mới và theo dõi các hoạt động dành cho Sinh viên 5 Tốt.
</p>
  </div>

  <div className="grid grid-cols-3 gap-4">
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium text-gray-500">
        Tổng hoạt động
      </p>
      <p className="mt-1 text-2xl font-bold text-blue-600">
        {activities.length}
      </p>
    </div>

    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium text-gray-500">
        Chưa diễn ra
      </p>
      <p className="mt-1 text-2xl font-bold text-blue-600">
        {
activities.filter((a) => a.status === "upcoming").length
        }
      </p>
    </div>

    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium text-gray-500">
        Hết hạn đăng ký
      </p>
      <p className="mt-1 text-2xl font-bold text-red-600">
        {
activities.filter((a) => a.status === "ended").length
        }
      </p>
    </div>
  </div>
</div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[420px_1fr]">
          {/* ================= FORM ================= */}
          <div>
            <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Thêm hoạt động mới
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Điền đầy đủ thông tin để tạo hoạt động mới.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
  Tên hoạt động <span className="text-red-500">*</span>
</label>

<input
  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
  placeholder="Nhập tên hoạt động"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
/>
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
  className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-300 bg-white px-5 py-4 transition hover:border-gray-500 hover:bg-gray-50"
>
  <div>
    <p className="font-semibold text-gray-800">
      📄 Văn bản đính kèm
    </p>

    <p className="mt-1 text-sm text-gray-500">
      PDF, DOC, DOCX
    </p>
  </div>

  <div className="rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200">
    Chọn tệp
  </div>
</label>

<input
  id="document-upload"
  type="file"
  accept=".pdf,.doc,.docx"
  onChange={handleDocumentUpload}
  className="hidden"
/>

{documentFile && (
  <div className="mt-3 flex items-center justify-between rounded-xl border border-gray-300 bg-gray-50 px-4 py-3">
    <div>
      <p className="text-sm font-medium text-gray-800">
        📎 {documentFile.name}
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Đã chọn tệp
      </p>
    </div>

    <button
      type="button"
      onClick={() => setDocumentFile(null)}
      className="rounded-lg px-3 py-1 text-sm text-red-600 transition hover:bg-red-50"
    >
      Xóa
    </button>
  </div>
)}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Chi tiết / Liên kết
                  </label>
                  <textarea
                    className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    rows={4}
                    placeholder="Mô tả ngắn hoặc đường dẫn chi tiết..."
                    value={detailContent}
                    onChange={(e) => setDetailContent(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Thời gian diễn ra
                    </label>
                    <input
                      type="text"
                      step="60"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
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
    Trạng thái
  </label>

  <select
    value={status}
    onChange={(e) => setStatus(e.target.value)}
    className="w-full rounded-xl border border-gray-300 px-4 py-3"
  >
    <option value="upcoming"> Chưa diễn ra</option>
    <option value="ongoing"> Sắp diễn ra</option>
    <option value="ended"> Đã kết thúc</option>
  </select>
</div>
                </div>
<div className="mt-4 flex gap-3">
  <button
    onClick={handleSave}
    className="flex-1 rounded-xl bg-blue-600 py-3.5 text-base font-semibold text-white transition hover:bg-blue-700 active:scale-[0.99]"
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
        setEventTime("");
        setEndTime("");
        setDeadline("");
        setDocumentFile(null);
        setStatus("upcoming");
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

          {/* ================= DANH SÁCH (PHẦN 2) ================= */}
          <div>
                        <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Danh sách hoạt động
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Tổng cộng {activities.length} hoạt động
                  </p>
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
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
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
    📅 {formatDate(activity.event_time)}
  </span>

  <span
    className={`rounded-full px-3 py-1 text-xs font-semibold ${
      activity.status === "upcoming"
        ? "bg-green-100 text-green-700"
        : activity.status === "ongoing"
        ? "bg-blue-100 text-blue-700"
        : "bg-gray-200 text-gray-700"
    }`}
  >
    {activity.status === "upcoming"
      ? " Chưa diễn ra"
      : activity.status === "ongoing"
      ? " Sắp diễn ra"
      : " Đã kết thúc"}
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
    console.log("Document:", activity.document);

    setCurrentDocument(activity.document);
    setDocumentModal(true);
  }}
  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
>
  👁 Xem
</button>                </div>

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

                            <div className="md:col-span-2">
                              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Chi tiết
                              </p>

                              <p className="mt-1 whitespace-pre-wrap break-words">
                                {activity.detail_content || "Chưa có"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 flex justify-end">
                            <div className="mt-6 flex justify-end gap-3">
  <button
    onClick={() => handleEdit(activity)}
    className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
  >
    ✏️ Chỉnh sửa
  </button>

  <button
    onClick={() => handleDelete(activity.id)}
    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
  >
    🗑 Xóa
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
{documentModal && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
    <div className="flex h-[85vh] w-[90vw] max-w-5xl flex-col rounded-2xl bg-white shadow-xl">

      <div className="flex items-center justify-between border-b px-6 py-4">
        <h2 className="text-lg font-bold">
          Văn bản đính kèm
        </h2>

        <button
          onClick={() => setDocumentModal(false)}
          className="text-2xl text-gray-500 hover:text-black"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {currentDocument ? (
          <iframe
  src={`${currentDocument}#toolbar=0&navpanes=0&scrollbar=0`}
  className="h-full w-full border-0"
/>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            Chưa có văn bản đính kèm.
          </div>
        )}
      </div>
    </div>
  </div>
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