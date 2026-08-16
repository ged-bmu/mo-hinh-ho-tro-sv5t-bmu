"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import Image from "next/image";
import CriteriaModal from "./components/CriteriaModal";
import BellUserTemp from "./components/BellUserTemp";
import Header from "./components/Header";
import Spinner from "./components/Spinner";
import NotificationCard from "./components/NotificationCard";

export default function Home() {
  const [profile, setProfile] = useState<any>(null);
  const [tab, setTab] = useState("proof");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [nextActivities, setNextActivities] = useState<any[]>([]);
  const [showActivities, setShowActivities] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

useEffect(() => {
  checkUser();
  loadProfile();
  loadNextActivity();
}, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();

    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/introduce";
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin") {
      window.location.href = "/admin";
      return;
    }

  setLoading(false);
}
function formatEventTime(value: string | null) {
  if (!value) return "Chưa cập nhật thời gian";

  return value;
}
const criterionLabel: Record<string, string> = {
  dao_duc: "Đạo đức tốt",
  hoc_tap: "Học tập tốt",
  the_luc: "Thể lực tốt",
  tinh_nguyen: "Tình nguyện tốt",
  hoi_nhap: "Hội nhập tốt",
  khac: "Khác",
};
const folders = [
{
  name: "Đạo đức tốt",
  icon: "❤️",
  link: "/dao-duc",
  field: "dao-duc",
},
{
  name: "Học tập tốt",
  icon: "📚",
  link: "/hoc-tap",
  field: "hoc-tap",
},
{
  name: "Thể lực tốt",
  icon: "💪",
  link: "/the-luc",
  field: "the-luc",
},
{
  name: "Tình nguyện tốt",
  icon: "🤝",
  link: "/tinh-nguyen",
  field: "tinh-nguyen",
},
{
  name: "Hội nhập tốt",
  icon: "🌏",
  link: "/hoi-nhap",
  field: "hoi-nhap",
},
{
  name: "Tiêu chuẩn ưu tiên",
  icon: "⭐",
  link: "/uu-tien",
  field: "uu-tien",
},
];
useEffect(() => {
  const loadUnread = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("conversations")
      .select("unread_user")
      .eq("user_id", user.id)
      .single();

    console.log("UNREAD:", data);
    console.log("ERROR:", error);

    setUnreadMessages(data?.unread_user || 0);
  };

  loadUnread();
}, []);

async function loadProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log("USER:", user);

  if (!user) return;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

if (data) {
  console.table(data);
  setProfile(data);
}
}
useEffect(() => {
  let channel: any;
  let isMounted = true;

  const init = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isMounted) return;

    // Lấy số tin chưa đọc ban đầu
    const { data, error } = await supabase
      .from("conversations")
      .select("unread_user")
      .eq("user_id", user.id)
      .single();

    if (!error && isMounted) {
      setUnreadMessages(data?.unread_user || 0);
    }

    // Tạo realtime channel DUY NHẤT
    channel = supabase
      .channel(`conversation-unread-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("🔔 Conversation updated:", payload);

          if (isMounted) {
            setUnreadMessages(
              Number(payload.new?.unread_user || 0)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime status:", status);
      });
  };

  init();

  return () => {
    isMounted = false;

    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
  };
}, []);
async function loadNextActivity() {
  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("status", "ongoing")
    .order("event_time", { ascending: true });

  setNextActivities(data || []);
}
if (loading) {

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Spinner />
    </div>
  );
}
const handleExport = async () => {
  if (exporting || !profile?.id) return;

  setExporting(true);

  try {
    const response = await fetch(
      `/api/export-student/${profile.id}`
    );

    if (!response.ok) {
      throw new Error("Xuất hồ sơ thất bại");
    }

    // Chờ toàn bộ file ZIP tải về trình duyệt
    const blob = await response.blob();

    // Lấy tên file từ Content-Disposition nếu có
    const contentDisposition =
      response.headers.get("Content-Disposition");

    let fileName = "HoSo-SV5T.zip";

    const match = contentDisposition?.match(
      /filename="([^"]+)"/
    );

    if (match?.[1]) {
      fileName = match[1];
    }

    // Tạo link tải
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    // Giải phóng bộ nhớ
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("EXPORT ERROR:", error);
    alert("Không thể xuất hồ sơ. Vui lòng thử lại.");
  } finally {
    // Xuất xong hoặc lỗi đều dừng spinner
    setExporting(false);
  }
};

const achievedCriteria = [
  profile?.["dao-duc"],
  profile?.["hoc-tap"],
  profile?.["the-luc"],
  profile?.["tinh-nguyen"],
  profile?.["hoi-nhap"],
].filter(Boolean).length;

const circleRadius = 54;
const circleCircumference = 2 * Math.PI * circleRadius;

const circleProgress =
  circleCircumference * (1 - achievedCriteria / 5);

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
      position: "fixed",
      top: 90,
      right: 20,
      zIndex: 9999,
    }}
  >
    <BellUserTemp />
  </div>

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
    backgroundImage:
  "linear-gradient(rgba(245,247,251,.88), rgba(245,247,251,.88)), url('/gioithieu.avif')",
backgroundSize: "cover",
backgroundPosition: "center",
backgroundRepeat: "no-repeat",
backgroundAttachment: "fixed",
    padding: isMobile ? "16px" : "30px",
    paddingBottom: isMobile ? "90px" : "30px",
    overflowX: "hidden",
  }}
    >
<div
  style={{
    width: "100%",
    maxWidth: isMobile ? "100%" : "1400px",
    margin: "0 auto",
  }}
>

      <h1
    style={{
      marginBottom: "5px",
      fontSize: isMobile ? "16px" : "20px",
      lineHeight: isMobile ? "1.4" : "1.5",
      fontWeight: 500,
      textAlign: "center",
      color: "#0f172a",
    }}
  >
   <b>
  {isMobile ? (
    <>
      CÂU LẠC BỘ SINH VIÊN 5 TỐT BMU
    </>
  ) : (
    "CÂU LẠC BỘ SINH VIÊN 5 TỐT TRƯỜNG ĐẠI HỌC Y DƯỢC BUÔN MA THUỘT"
  )}
</b>
  </h1>

  <p
  style={{
    textAlign: "center",
    fontSize: isMobile ? "18px" : "24px",
    fontWeight: "700",
    lineHeight: 1.4,
    color: "#0f65de",
    maxWidth: isMobile ? "320px" : "900px",
    margin: "5px auto 30px",
  }}
>
  {isMobile ? (
    <>
      Mô hình hỗ trợ sinh viên phấn đấu
      <br />
      đạt danh hiệu Sinh viên 5 tốt các cấp
    </>
  ) : (
    "Mô hình hỗ trợ sinh viên phấn đấu đạt danh hiệu Sinh viên 5 tốt các cấp"
  )}
</p>
<div
  style={{
    background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
    border: "1px solid #dbeafe",
    borderRadius: "16px",
    padding: "22px",
    minHeight: isMobile ? "280px" : "220px",
    marginBottom: "30px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  }}
>
<div 
  style={{ 
    display: "flex", 
    flexDirection: isMobile ? "column" : "row", 
    alignItems: isMobile ? "stretch" : "center", 
    justifyContent: "space-between", 
    gap: isMobile ? "8px" : "12px", 
  }} 
> 
  <h2 
    style={{ 
      margin: 0, 
      fontSize: isMobile ? "17px" : "19px", 
      fontWeight: 700, 
      textAlign: isMobile ? "center" : "left", 
    }} 
  > 
    👋 Xin chào, {profile?.ho_ten} 
  </h2> 

  <button 
    onClick={handleExport}
    disabled={exporting}
    onMouseEnter={(e) => { 
      e.currentTarget.style.transform = "translateY(-2px) scale(1.02)"; 
      e.currentTarget.style.background = "#15803d"; 
    }} 
    onMouseLeave={(e) => { 
      e.currentTarget.style.transform = "translateY(0) scale(1)"; 
      e.currentTarget.style.background = "#16a34a"; 
      e.currentTarget.style.boxShadow = "none"; 
    }} 
    style={{ 
      background: "#16a34a", 
      color: "#fff", 
      border: "none", 
      padding: "9px 16px", 
      borderRadius: "10px", 
      fontWeight: 600, 
      fontSize: "14px",
      cursor: "pointer", 
      width: isMobile ? "100%" : "auto", 
      transition: "all .25s ease", 
      lineHeight: 1.2,
    }} 
  > 
    {exporting ? ( 
      <span 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          gap: "7px", 
        }} 
      > 
        <span 
          style={{ 
            width: "14px", 
            height: "14px", 
            border: "2px solid rgba(255,255,255,.4)", 
            borderTopColor: "#fff", 
            borderRadius: "50%", 
            animation: "spin .7s linear infinite", 
          }} 
        /> 
        Đang xuất hồ sơ 
      </span> 
    ) : ( 
      "Xuất hồ sơ" 
    )} 
  </button> 
</div>
<div
  style={{
    marginTop: 22,
    borderTop: "1px solid #e5e7eb",
    paddingTop: 18,
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "180px 1fr 2fr",
    gap: isMobile ? 20 : 28,
    alignItems: "stretch",
  }}
>
{/* ===================================================== */}
{/* CỘT 1 — TIÊU CHÍ ĐÃ ĐẠT */}
{/* ===================================================== */}

<div
style={{
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  background: "#ffffff",
  borderRadius: "16px",
  border: "1px solid #e5e7eb",
  overflow: "hidden",
  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
}}
>
  {/* Tiêu đề */}
  <div
  style={{
    fontWeight: 700,
    fontSize: 15,
    color: "#2c449b",
    background: "linear-gradient(90deg, #63d0ff, #38bdf8)",
    padding: "12px 14px",
    width: "100%",
    borderBottom: "1px solid #000000",
  }}
>
  🏅 Bạn đã đạt
</div>

  {!isMobile ? (
    /* ================= DESKTOP ================= */
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        width: "100%",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 150,
          height: 150,
        }}
      >
        <svg
          width="150"
          height="150"
          viewBox="0 0 150 150"
          style={{
            transform: "rotate(-90deg)",
          }}
        >
          {/* Vòng nền */}
          <circle
            cx="75"
            cy="75"
            r={circleRadius}
            fill="none"
            stroke="#EEF2FF"
            strokeWidth="10"
          />

          {/* Vòng tiến độ */}
          <circle
            cx="75"
            cy="75"
            r={circleRadius}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circleCircumference}
            strokeDashoffset={circleProgress}
            filter="url(#glow)"
            style={{
              transition: "stroke-dashoffset 0.6s ease",
            }}
          />

          <defs>
            <linearGradient
              id="progressGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>

            <filter
              id="glow"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur
                stdDeviation="2.5"
                result="blur"
              />

              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>

        {/* Nội dung giữa vòng */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: "#0F172A",
              lineHeight: 1,
            }}
          >
            {achievedCriteria}/5
          </div>

          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#000000",
              lineHeight: 1,
              marginTop: 5,
            }}
          >
            Tiêu chí
          </div>
        </div>
      </div>
    </div>
  ) : (
    /* ================= MOBILE ================= */
    <div
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* Thanh tiến độ */}
      <div
        style={{
          flex: 1,
          height: 12,
          background: "#DBEAFE",
          borderRadius: 999,
          overflow: "hidden",
          boxShadow:
            "inset 0 1px 3px rgba(37, 99, 235, 0.12)",
        }}
      >
        <div
          style={{
            width: `${(achievedCriteria / 5) * 100}%`,
            height: "100%",
            borderRadius: 999,
            background:
              "linear-gradient(90deg, #1D4ED8 0%, #2563EB 45%, #38BDF8 100%)",
            boxShadow:
              "0 2px 8px rgba(37, 99, 235, 0.3)",
            transition: "width 0.6s ease",
          }}
        />
      </div>

      {/* Số */}
      <div
        style={{
          flex: "0 0 auto",
          fontSize: 18,
          fontWeight: 800,
          color: "#1D4ED8",
          whiteSpace: "nowrap",
        }}
      >
        {achievedCriteria}/5
      </div>
    </div>
  )}
</div>
  

  {/* ===================================================== */}
  {/* CỘT 2 — THAO TÁC NHANH */}
  {/* ===================================================== */}

<div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: 10,
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
  }}
>
   <div
  style={{
    fontWeight: 700,
    fontSize: 15,
    color: "#2c449b",
    background: "linear-gradient(90deg, #63d0ff, #38bdf8)",
    padding: "12px 14px",
    width: "100%",
    borderBottom: "1px solid #000000",
  }}
>
  ⚡ Thao tác nhanh
</div>

    {/* XEM BÁO CÁO */}
    <a
      href="/bao-cao"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: "#F0F9FF",
        border: "1px solid #BAE6FD",
        color: "#0369A1",
        borderRadius: 14,
        textDecoration: "none",
        transition: "all .2s ease",
        boxShadow: "0 2px 6px rgba(0,0,0,.04)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow =
          "0 6px 14px rgba(37,99,235,.12)";
        e.currentTarget.style.borderColor = "#93C5FD";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow =
          "0 2px 6px rgba(0,0,0,.04)";
        e.currentTarget.style.borderColor = "#BFDBFE";
      }}
    >
      {/* ICON */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: "#DBEAFE",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        📑
      </div>

      {/* TEXT */}
      <div
        style={{
          minWidth: 0,
          flex: 1,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: "#0F172A",
          }}
        >
          Xem báo cáo
        </div>

        <div
          style={{
            fontSize: 11,
            color: "#64748B",
            marginTop: 2,
          }}
        >
          Theo dõi kết quả hồ sơ
        </div>
      </div>

      <span
        style={{
          fontSize: 18,
          color: "#2563EB",
          fontWeight: 700,
        }}
      >
        →
      </span>
    </a>
        {/* NHẮN TIN */}
    <a
      href="/trao-doi"
      onClick={async () => {
        if (!profile?.id) return;

        await supabase
          .from("conversations")
          .update({
            unread_user: 0,
          })
          .eq("user_id", profile.id);

        setUnreadMessages(0);
      }}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: "#FFF7ED",
        border: "1px solid #FED7AA",
        borderRadius: 14,
        textDecoration: "none",
        color: "#0F172A",
        transition: "all .2s ease",
        boxShadow: "0 2px 6px rgba(0,0,0,.04)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow =
          "0 6px 14px rgba(249,115,22,.12)";
        e.currentTarget.style.borderColor = "#FDBA74";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow =
          "0 2px 6px rgba(0,0,0,.04)";
        e.currentTarget.style.borderColor = "#FED7AA";
      }}
    >
      {/* ICON */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: "#FFEDD5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        💬
      </div>

      {/* TEXT */}
      <div
        style={{
          minWidth: 0,
          flex: 1,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: "#0F172A",
          }}
        >
          Nhắn tin
        </div>

        <div
          style={{
            fontSize: 11,
            color: "#64748B",
            marginTop: 2,
          }}
        >
          Trao đổi với Ban Chủ nhiệm
        </div>
      </div>

      <span
        style={{
          fontSize: 18,
          color: "#F97316",
          fontWeight: 700,
        }}
      >
        →
      </span>

      {/* BADGE */}
      {unreadMessages > 0 && (
        <span
          style={{
            position: "absolute",
            top: -6,
            right: -6,
            minWidth: 20,
            height: 20,
            padding: "0 5px",
            borderRadius: 999,
            background: "#EF4444",
            color: "#fff",
            fontSize: 11,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #fff",
          }}
        >
          {unreadMessages > 9 ? "9+" : unreadMessages}
        </span>
      )}
    </a>
  </div>


  {/* ===================================================== */}
  {/* CỘT 3 — HOẠT ĐỘNG SẮP TỚI */}
  {/* ===================================================== */}

  <div
  style={{
    minWidth: 0,
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
  }}
>
<div
  onClick={() => {
    if (isMobile) {
      setShowActivities((prev) => !prev);
    }
  }}
  style={{
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 700,
    fontSize: 15,
    color: "#2c449b",
    background: "linear-gradient(90deg, #63d0ff, #38bdf8)",
    padding: "12px 14px",
    width: "100%",
    borderBottom: "1px solid #000000",
    cursor: isMobile ? "pointer" : "default",
    userSelect: "none",
  }}
>
  <span>📅 Hoạt động sắp tới</span>

  <span
    style={{
      width: 24,
      height: 24,
      borderRadius: "50%",
      background: "#2563EB",
      color: "#fff",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      fontWeight: 800,
      lineHeight: 1,
      boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
    }}
  >
    {nextActivities.length}
  </span>

  {/* Mũi tên chỉ hiện trên mobile */}
  {isMobile && (
    <span
      style={{
        marginLeft: "auto",
        fontSize: 18,
        color: "#2563EB",
        transition: "transform 0.25s ease",
        transform: showActivities
          ? "rotate(180deg)"
          : "rotate(0deg)",
      }}
    >
      ▼
    </span>
  )}
</div>
{(!isMobile || showActivities) && (
  <>
    {nextActivities.length > 0 ? (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxHeight: "190px",
          overflowY: "auto",
          paddingRight: 4,
        }}
      >
        {nextActivities.map((activity) => (
          <div
            key={activity.id}
            style={{
              background: "#F8FAFC",
              borderRadius: 12,
              padding: "12px 15px",
              border: "1px solid #E5E7EB",
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "nowrap",
              minWidth: 0,
            }}
          >
            {/* Tên hoạt động */}
            <div
              style={{
                flex: "1 1 40%",
                minWidth: 0,
                fontWeight: 700,
                fontSize: 14,
                color: "#0F172A",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {activity.title}
            </div>

            {/* Tiêu chí */}
            <div
              style={{
                flex: "0 0 150px",
                fontSize: 13,
                whiteSpace: "nowrap",
                fontWeight: 600,
                display: isMobile ? "none" : "block",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  padding: "5px 10px",
                  borderRadius: 999,

                  background:
                    activity.criterion === "dao_duc"
                      ? "#FEE2E2"
                      : activity.criterion === "hoc_tap"
                      ? "#DBEAFE"
                      : activity.criterion === "the_luc"
                      ? "#FFEDD5"
                      : activity.criterion === "tinh_nguyen"
                      ? "#DCFCE7"
                      : activity.criterion === "hoi_nhap"
                      ? "#F3E8FF"
                      : "#F1F5F9",

                  color:
                    activity.criterion === "dao_duc"
                      ? "#B91C1C"
                      : activity.criterion === "hoc_tap"
                      ? "#1D4ED8"
                      : activity.criterion === "the_luc"
                      ? "#C2410C"
                      : activity.criterion === "tinh_nguyen"
                      ? "#15803D"
                      : activity.criterion === "hoi_nhap"
                      ? "#7E22CE"
                      : "#475569",
                }}
              >
                {criterionLabel[activity.criterion] ?? "Khác"}
              </span>
            </div>

            {/* Thời gian */}
            <div
              style={{
                flex: "0 0 155px",
                color: "#64748B",
                fontSize: 13,
                whiteSpace: "nowrap",
                display: isMobile ? "none" : "block",
              }}
            >
              🕒 {formatEventTime(activity.event_time)}
            </div>

            {/* Xem chi tiết */}
            <a
              href="/hoat-dong"
              style={{
                flex: "0 0 auto",
                color: "#2563EB",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 13,
                whiteSpace: "nowrap",
              }}
            >
              {isMobile ? "Xem →" : "Xem chi tiết →"}
            </a>
          </div>
        ))}
      </div>
    ) : (
      <div
        style={{
          color: "#64748B",
          fontSize: 14,
          padding: "10px 0",
        }}
      >
        Chưa có hoạt động sắp tới.
      </div>
    )}
     </>
)}
  </div>
</div>
</div>

<div
  style={{
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "1fr 2fr",
    gap: "20px",
    marginBottom: "20px",
    alignItems: "stretch",
  }}
>
  {/* ================= THÔNG BÁO BÊN TRÁI ================= */}
{!isMobile && <NotificationCard isMobile={isMobile} />}

  {/* ================= CARD CHỨC NĂNG BÊN PHẢI ================= */}
  <div
    style={{
      background: "#fff",
      borderRadius: "20px",
      padding: "20px",
      boxShadow: "0 4px 12px rgba(0,0,0,.08)",
    }}
  >
    {/* Tiêu đề */}
    <div
      style={{
        fontSize: 18,
        fontWeight: 800,
        color: "#0F172A",
        marginBottom: 14,
      }}
    >
      Chức năng
    </div>

    {/* 3 nút */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile
          ? "1fr"
          : "repeat(3, 1fr)",
        gap: "14px",
      }}
    >
      {/* Quản lý hồ sơ */}
      <a
        href="/tieuchi"
        style={{
          background: "#F3E8FF",
          borderRadius: "14px",
          padding: "20px",
          textDecoration: "none",
          color: "#111827",
          boxShadow: "0 3px 8px rgba(0,0,0,.05)",
          transition: ".25s",
          minHeight: "150px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.transform = "translateY(-4px)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.transform = "translateY(0)")
        }
      >
        <div style={{ fontSize: 34 }}>📋</div>

        <h3
          style={{
            margin: "10px 0 6px",
            fontSize: 19,
          }}
        >
          Quản lý hồ sơ
        </h3>

        <p
          style={{
            margin: 0,
            color: "#8796aa",
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          Quản lý minh chứng theo từng tiêu chí Sinh viên 5 Tốt.
        </p>
      </a>

      {/* Mục tiêu học tập */}
      <a
        href="/bang-diem"
        style={{
          background: "#DCFCE7",
          borderRadius: "14px",
          padding: "20px",
          textDecoration: "none",
          color: "#111827",
          boxShadow: "0 3px 8px rgba(0,0,0,.05)",
          transition: ".25s",
          minHeight: "150px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.transform = "translateY(-4px)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.transform = "translateY(0)")
        }
      >
        <div style={{ fontSize: 34 }}>📊</div>

        <h3
          style={{
            margin: "10px 0 6px",
            fontSize: 19,
          }}
        >
          Mục tiêu học tập
        </h3>

        <p
          style={{
            margin: 0,
            color: "#64748b",
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          Theo dõi kết quả học tập của bạn.
        </p>
      </a>

      {/* Hoạt động */}
      <a
        href="/hoat-dong"
        style={{
          background: "#E0F2FE",
          borderRadius: "14px",
          padding: "20px",
          textDecoration: "none",
          color: "#111827",
          boxShadow: "0 3px 8px rgba(0,0,0,.05)",
          transition: ".25s",
          minHeight: "150px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.transform = "translateY(-4px)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.transform = "translateY(0)")
        }
      >
        <div style={{ fontSize: 34 }}>📅</div>

        <h3
          style={{
            margin: "10px 0 6px",
            fontSize: 19,
          }}
        >
          Hoạt động sắp diễn ra
        </h3>

        <p
          style={{
            margin: 0,
            color: "#64748b",
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          Xem các hoạt động sắp diễn ra trong thời gian tới.
        </p>
      </a>
    </div>
    {/* ===================================================== */}
{/* THÔNG TIN CHUNG */}
{/* ===================================================== */}

<div
  style={{
    marginTop: 14,
    background:
      "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
    borderRadius: "14px",
    padding: "16px 20px",
    border: "1px solid #FED7AA",
    boxShadow: "0 3px 8px rgba(0,0,0,.05)",
    display: "flex",
    alignItems: "center",
    gap: 14,
  }}
>
  {/* Icon */}
  <div
    style={{
      width: 42,
      height: 42,
      borderRadius: 12,
      background: "#FFEDD5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 24,
      flexShrink: 0,
    }}
  >
    📢
  </div>

  {/* Tiêu đề */}
  <div style={{ minWidth: 0 }}>
    <div
      style={{
        fontSize: 15,
        fontWeight: 800,
        color: "#9A3412",
      }}
    >
      Thông tin chung
    </div>

    <div
      style={{
        fontSize: 13,
        color: "#C2410C",
        marginTop: 3,
      }}
    >
      Sẽ sớm có thông báo từ Ban chủ nhiệm Câu lạc bộ Sinh viên 5 tốt BMU
    </div>
  </div>
</div>
  </div>
</div>

       </div>
       </main>

  </div>
  {showCriteria && (
  <CriteriaModal
    onClose={() => setShowCriteria(false)}
  />
)}
<Footer />
</div>
);
 
}