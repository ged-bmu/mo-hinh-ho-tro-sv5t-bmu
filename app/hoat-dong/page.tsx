"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import CriteriaModal from "../components/CriteriaModal";
import Spinner from "../components/Spinner";

type Activity = {
  id: string;
  title: string;
  criterion: string | null;
  organizer: string | null;
  document: string | null;
  detail_content: string | null;
  event_time: string | null;
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
  return date || "Chưa có";
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showCriteria,setShowCriteria]=useState(false);
  const [documentModal, setDocumentModal] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<string | null>(null);
  const [tab, setTab] = useState("proof");
  const [filterCriterion, setFilterCriterion] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showProfile, setShowProfile] = useState(false);

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

  const sorted = useMemo(() => activities, [activities]);
  const filteredActivities = useMemo(() => {
  return activities.filter((activity) => {
    
    // Lọc tiêu chí
    const matchCriterion =
      filterCriterion === "all" ||
      activity.criterion === filterCriterion;


const matchStatus =
  filterStatus === "all" ||
  activity.status === filterStatus;


    return matchCriterion && matchStatus;
  });

}, [
  activities,
  filterCriterion,
  filterStatus
]);

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
        style={{
          flex: 1,
          minHeight: "100vh",
          background: "#f5f7fb",
          padding: "30px",
        }}
      >
               <div className="mb-8 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 p-6 text-white shadow-lg">
  <div className="mb-5">
    <h2 className="text-2xl font-bold text-white">
  Hoạt động dành cho Sinh viên
</h2>

<p className="mt-1 text-sm text-sky-100">
  Theo dõi các hoạt động dành cho Sinh viên 5 Tốt.
</p>
  </div>

<div className="grid grid-cols-3 gap-4">
  <div className="rounded-xl border border-gray-200 bg-white p-4">
    <p className="text-xs font-medium text-gray-500">
      Số hoạt động
    </p>
    <p className="mt-1 text-2xl font-bold text-green-600">
      {activities.length}
    </p>
  </div>

<div className="rounded-xl border border-gray-200 bg-white p-4">
  <p className="text-xs font-medium text-gray-500">
    Sắp diễn ra
  </p>

  <p className="mt-1 text-2xl font-bold text-cyan-600">
    {
      activities.filter(
        (a) => a.status === "ongoing"
      ).length
    }
  </p>
</div>
  <div className="rounded-xl border border-gray-200 bg-white p-4">
    <p className="text-xs font-medium text-gray-500">
      Đã kết thúc
    </p>
    <p className="mt-1 text-2xl font-bold text-red-600">
      {
        activities.filter(
          (a) => a.status === "ended"
        ).length
      }
    </p>
    </div>
  </div>
</div>
<div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

  <div className="mb-4 flex items-center justify-between">
    <div>
      <h3 className="text-base font-bold text-gray-800">
        🔎 Bộ lọc hoạt động
      </h3>
    </div>

    {(filterCriterion !== "all" || filterStatus !== "all") && (
      <button
        onClick={() => {
          setFilterCriterion("all");
          setFilterStatus("all");
        }}
        className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        Xóa lọc
      </button>
    )}

  </div>


  <div className="grid gap-4 md:grid-cols-2">

    {/* Tiêu chí */}
    <div>
      <div className="relative">

        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          🎯
        </span>

        <select
          value={filterCriterion}
          onChange={(e)=>setFilterCriterion(e.target.value)}
          className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-10 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
        >
          <option value="all">
            Tất cả tiêu chí
          </option>

          <option value="dao_duc">
            Đạo đức tốt
          </option>

          <option value="hoc_tap">
            Học tập tốt
          </option>

          <option value="the_luc">
            Thể lực tốt
          </option>

          <option value="tinh_nguyen">
            Tình nguyện tốt
          </option>

          <option value="hoi_nhap">
            Hội nhập tốt
          </option>

        </select>

      </div>
    </div>



    {/* Trạng thái */}
    <div>
      <div className="relative">

        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          📌
        </span>


        <select
          value={filterStatus}
          onChange={(e)=>setFilterStatus(e.target.value)}
          className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-10 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
        >

          <option value="all">
            Tất cả trạng thái
          </option>

          <option value="Đang diễn ra">
             Đang diễn ra
          </option>

          <option value="Đã kết thúc">
             Đã kết thúc
          </option>

          <option value="Hết hạn đăng ký">
             Hết hạn đăng ký
          </option>

        </select>

      </div>

    </div>

  </div>

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
  const status =
    activity.status === "upcoming"
      ? {
          text: "Đang diễn ra",
          color: "bg-green-100 text-green-700",
        }
      : activity.status === "ongoing"
      ? {
          text: "Sắp diễn ra",
          color: "bg-blue-100 text-blue-700",
        }
      : {
          text: "Đã kết thúc",
          color: "bg-red-200 text-red-700",
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
                      className="flex w-full items-center justify-between p-5 hover:bg-gray-50"
                    >
                      <div className="text-left">
                        <h2 className="text-lg font-semibold">
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
  </span>

</div>
                      </div>

                      <div className="flex items-center gap-3">
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
                          {formatDate(activity.event_time)}
                        </div>

                        <div>
                          <b>⏰ Hạn đăng ký</b>
                          <br />
                          {formatDate(
                            activity.registration_deadline
                          )}
                        </div>

                        <div>
                          <b>📄 Nội dung chi tiết</b>
                          <br />
                          <div className="whitespace-pre-wrap">
                            {activity.detail_content || "Chưa có"}
                          </div>
                        </div>

                        <div>
  <b>📑 Văn bản đính kèm</b>
  <br />

  {activity.document ? (
    <button
      onClick={() => {
        setCurrentDocument(activity.document);
        setDocumentModal(true);
      }}
      className="mt-2 rounded-lg border border-sky-300 bg-white px-3 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-50"
    >
      👁 Xem
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
    {documentModal && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
    <div className="flex h-[85vh] w-[90vw] max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">

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

      <div className="flex-1">
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
    <Footer />
  </div>
);
}