"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import CriteriaModal from "../components/CriteriaModal";
import Spinner from "../components/Spinner";
import Image from "next/image";

type Activity = {
  id: string;
  title: string;
  criterion: string | null;
  organizer: string | null;
  document: string | null;
  document_names?: string[] | null;
  documents?: string[] | null;
  detail_content: string | null;
  activity_link: string | null;
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

function formatDate(date?: string | null) {
  if (!date) return "Chưa có";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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
function getActivityStatus(activity: Activity, now: number) {
  const start = activity.event_time
    ? new Date(activity.event_time).getTime()
    : NaN;

  const end = activity.end_time
    ? new Date(activity.end_time).getTime()
    : NaN;

  if (Number.isFinite(start) && Number.isFinite(end)) {
    if (now < start) return "upcoming";
    if (now <= end) return "ongoing";
    return "ended";
  }

  if (Number.isFinite(start)) {
    if (now < start) return "upcoming";
    return "ongoing";
  }

  return activity.status === "ongoing"
    ? "ongoing"
    : activity.status === "ended"
    ? "ended"
    : "upcoming";
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showCriteria,setShowCriteria]=useState(false);
  const [documentModal, setDocumentModal] = useState(false);
  const [currentDocuments, setCurrentDocuments] = useState<string[]>([]);
  const [currentDocumentNames, setCurrentDocumentNames] = useState<string[]>([]);
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState(0);
  const [documentActivityId, setDocumentActivityId] = useState<string | null>(null);
  const [tab, setTab] = useState("proof");
  const [filterCriterion, setFilterCriterion] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showProfile, setShowProfile] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(Date.now());
  }, 30000);

  return () => clearInterval(timer);
}, []);

  useEffect(() => {
    loadActivities();
  }, []);

  async function loadActivities() {
    setLoading(true);

    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .order("event_time", { ascending: true });

    if (!error && data) {
      setActivities(data);
    }

    setLoading(false);
  }

const sorted = useMemo(() => {
  return [...activities].sort((a, b) => {
    const statusOrder = {
      ongoing: 0,
      upcoming: 1,
      ended: 2,
    };

    const statusA = getActivityStatus(a, currentTime);
    const statusB = getActivityStatus(b, currentTime);

    if (statusA !== statusB) {
      return statusOrder[statusA] - statusOrder[statusB];
    }

    const timeA = a.event_time
      ? new Date(a.event_time).getTime()
      : Infinity;

    const timeB = b.event_time
      ? new Date(b.event_time).getTime()
      : Infinity;

    return timeA - timeB;
  });
}, [activities, currentTime]);

const filteredActivities = useMemo(() => {
  return sorted.filter((activity) => {
    const matchCriterion =
      filterCriterion === "all" ||
      activity.criterion === filterCriterion;

    const status = getActivityStatus(activity, currentTime);

    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "upcoming" && status === "upcoming") ||
      (filterStatus === "ongoing" && status === "ongoing") ||
      (filterStatus === "ended" && status === "ended");

    return matchCriterion && matchStatus;
  });
}, [sorted, filterCriterion, filterStatus, currentTime]);

if (loading) {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Spinner />
    </div>
  );
}

return (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
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
        flex: 1,
      }}
    >
      <Sidebar />

      <main
  className="p-4 md:p-[30px]"
  style={{
    flex: 1,
    minHeight: "100vh",
    background: "#f5f7fb",
  }}
>
            <div
  className="mb-8 rounded-2xl p-6 text-white shadow-lg"
  style={{
    background: "linear-gradient(to right, #33d1f4 0%, #a7f5fc 100%)",
  }}
>
  <div className="mb-5">
    <h2
      className="text-2xl font-bold"
      style={{ color: "#000000" }}
    >
      Theo dõi hoạt động
    </h2>
  </div>

<div>
  <div className="stats-grid">
  <div className="rounded-xl border border-gray-200 bg-white p-4">
    <p className="text-xs font-medium text-gray-500">
      Tổng hoạt động
    </p>
    <p className="mt-1 text-2xl font-bold text-green-600">
      {activities.length}
    </p>
  </div>

  <div className="rounded-xl border border-gray-200 bg-white p-4">
    <p className="text-xs font-medium text-gray-500">
      Đang diễn ra
    </p>
    <p className="mt-1 text-2xl font-bold text-blue-600">
      {activities.filter(
        (a) => getActivityStatus(a, currentTime) === "ongoing"
      ).length}
    </p>
  </div>

  <div className="rounded-xl border border-gray-200 bg-white p-4">
    <p className="text-xs font-medium text-gray-500">
      Sắp diễn ra
    </p>
    <p className="mt-1 text-2xl font-bold text-cyan-600">
      {activities.filter(
        (a) => getActivityStatus(a, currentTime) === "upcoming"
      ).length}
    </p>
  </div>

  <div className="rounded-xl border border-gray-200 bg-white p-4">
    <p className="text-xs font-medium text-gray-500">
      Đã kết thúc
    </p>
    <p className="mt-1 text-2xl font-bold text-red-600">
      {activities.filter(
        (a) => getActivityStatus(a, currentTime) === "ended"
      ).length}
    </p>
  </div>
</div>
  </div>
<style jsx>{`
  .stats-grid {
    display: grid;
    width: 100%;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }

  @media (max-width: 767px) {
    .stats-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
  }
`}</style>
</div>

        <div
          style={{
            maxWidth: "1800px",
            margin: "0 auto",
          }}
        >

          {sorted.length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
              Chưa có hoạt động nào.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity) => {
 const currentStatus = getActivityStatus(activity, currentTime);

const status =
  currentStatus === "upcoming"
    ? {
        text: "Sắp diễn ra",
        color: "bg-cyan-100 text-cyan-700",
      }
    : currentStatus === "ongoing"
    ? {
        text: "Đang diễn ra",
        color: "bg-blue-100 text-blue-700",
      }
    : {
        text: "Đã kết thúc",
        color: "bg-red-100 text-red-700",
      };
                const open = openId === activity.id;

                return (
                  <div
                    key={activity.id}
                    className="overflow-hidden rounded-xl border bg-white shadow-sm"
                  >
                    <button
                      onClick={() =>
                        setOpenId(open ? null : activity.id)
                      }
                      className="flex w-full flex-col items-stretch gap-3 p-4 text-left hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                    >
                      <div className="min-w-0 text-left">
                        <h2 className="break-words text-base font-semibold sm:text-lg">
                          {activity.title}
                        </h2>
                        <div className="mt-2 flex flex-wrap items-center gap-2">

  <span
    className={`rounded-full px-3 py-1 text-xs font-semibold ${
      {
        dao_duc: "bg-red-100 text-red-700",
        hoc_tap: "bg-blue-100 text-blue-700",
        the_luc: "bg-orange-100 text-orange-700",
        tinh_nguyen: "bg-green-100 text-green-700",
        hoi_nhap: "bg-purple-100 text-purple-700",
      }[activity.criterion || ""] ||
      "bg-gray-100 text-gray-700"
    }`}
  >
    {criterionLabel[activity.criterion || ""] || "Khác"}
  </span>

  <span className="text-sm text-gray-500">
  📅 {formatDate(activity.event_time)}
  {" - "}
  {formatDate(activity.end_time)}
</span>

</div>
                      </div>

                      <div className="flex shrink-0 items-center justify-end gap-3 self-end sm:self-auto">
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${status.color}`}
                        >
                          {status.text}
                        </span>

                        <span
                          className={`transition ${
                            open ? "rotate-180" : ""
                          }`}
                        >
                          ▼
                        </span>
                      </div>
                    </button>

                    {open && (
  <div className="border-t px-5 py-5 text-sm">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <b>📌 Tiêu chí</b>
                          <br />
                          {criterionLabel[
                            activity.criterion || ""
                          ] || "Chưa có"}
                        </div>

                        <div>
                          <b>🏢 Đơn vị tổ chức</b>
                          <br />
                          {activity.organizer || "Chưa có"}
                        </div>

                        <div>
  <b>📅 Thời gian</b>
  <br />
  <div className="mt-1">
    <p>
      Bắt đầu: {formatDate(activity.event_time)}
    </p>
    <p>
      Kết thúc: {formatDate(activity.end_time)}
    </p>
  </div>
</div>

                        <div>
                          <b>⏰ Hạn đăng ký</b>
                          <br />
                          {formatDate(
                            activity.registration_deadline
                          )}
                        </div>

                        
{/* MÔ TẢ HOẠT ĐỘNG */}
<div className="md:col-span-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
  <p className="mb-2 font-bold text-gray-800">
    📝 Mô tả hoạt động
  </p>

  <div className="whitespace-pre-wrap break-words leading-7 text-gray-700">
    {activity.detail_content || "Chưa có mô tả hoạt động."}
  </div>
</div>

{/* LIÊN KẾT HOẠT ĐỘNG */}
<div className="md:col-span-2 rounded-xl border border-blue-200 bg-blue-50 p-4">
  <p className="mb-2 font-bold text-blue-900">
    🔗 Liên kết hoạt động
  </p>

  {activity.activity_link ? (
    <div>
      <p className="mb-3 text-sm text-blue-800">
        Nhấn nút bên dưới để đăng ký hoặc truy cập thông tin hoạt động.
      </p>

      <a
        href={activity.activity_link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex max-w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
      >
        <span>Truy cập hoạt động</span>
        <span aria-hidden="true">↗</span>
      </a>
    </div>
  ) : (
    <p className="text-sm text-gray-500">
      Hoạt động này chưa có liên kết truy cập.
    </p>
  )}
</div>


                        <div>
  <b>📑 Văn bản đính kèm</b>
  <br />

  {(activity.documents?.length || activity.document) ? (
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
  className="mt-2 rounded-lg border border-sky-300 bg-white px-3 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-50"
>
  <span className="inline-flex items-center gap-1 whitespace-nowrap">
    <Image src="/iconxem2.png" width={20} height={20} alt="Xem" />
    Xem ({activity.documents?.length || (activity.document ? 1 : 0)})
  </span>
</button>
  ) : (
    <span className="text-gray-500">
      Chưa có
    </span>
  )}
</div>
</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
    {showCriteria && (
      <CriteriaModal
        onClose={() => setShowCriteria(false)}
      />
    )}


{documentModal && mounted && createPortal(
  <div
    onClick={() => setDocumentModal(false)}
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 2147483647,
      width: "100vw",
      height: "100dvh",
      padding: "12px",
      background: "rgba(0,0,0,0.75)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "1400px",
        height: "calc(100dvh - 24px)",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: "12px",
        background: "#fff",
        boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
      }}
    >
      {/* THANH TIÊU ĐỀ */}
      <div
        style={{
          flexShrink: 0,
          minHeight: "64px",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          borderBottom: "1px solid #e5e7eb",
          background: "#fff",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#111827",
              overflowWrap: "anywhere",
            }}
          >
            {currentDocumentNames[currentDocumentIndex] ||
              `Văn bản ${currentDocumentIndex + 1}`}
          </p>

          <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "3px" }}>
            Văn bản {currentDocumentIndex + 1} / {currentDocuments.length}
          </p>
        </div>

        <a
          href={`/api/activity-documents/${documentActivityId}/${currentDocumentIndex}`}
          download
          style={{
            flexShrink: 0,
            padding: "9px 12px",
            borderRadius: "8px",
            background: "#2563eb",
            color: "#fff",
            fontSize: "12px",
            fontWeight: 700,
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
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            color: "#6b7280",
            fontSize: "25px",
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>

      {/* KHUNG HIỂN THỊ */}
      <div
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          background: "#e5e7eb",
        }}
      >
        {currentDocuments.length > 0 && (
          <>
            <iframe
              key={currentDocuments[currentDocumentIndex]}
              src={`${currentDocuments[currentDocumentIndex]}#toolbar=0&navpanes=0`}
              title={
                currentDocumentNames[currentDocumentIndex] || "Văn bản"
              }
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                border: 0,
                background: "#fff",
              }}
            />

            {/* NÚT VĂN BẢN TRƯỚC */}
            {currentDocumentIndex > 0 && (
              <button
                type="button"
                onClick={() =>
                  setCurrentDocumentIndex((prev) => prev - 1)
                }
                aria-label="Văn bản trước"
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "14px",
                  zIndex: 5,
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.96)",
                  color: "#1f2937",
                  fontSize: "30px",
                  lineHeight: 1,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                  cursor: "pointer",
                }}
              >
                ‹
              </button>
            )}

            {/* NÚT VĂN BẢN TIẾP THEO */}
            {currentDocumentIndex < currentDocuments.length - 1 && (
              <button
                type="button"
                onClick={() =>
                  setCurrentDocumentIndex((prev) => prev + 1)
                }
                aria-label="Văn bản tiếp theo"
                style={{
                  position: "absolute",
                  right: "14px",
                  top: "14px",
                  zIndex: 5,
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.96)",
                  color: "#1f2937",
                  fontSize: "30px",
                  lineHeight: 1,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                  cursor: "pointer",
                }}
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


    <Footer />
  </div>
);
}
