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
useEffect(() => {
  let channel: any;

  const init = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const loadUnread = async () => {
      const { data } = await supabase
        .from("conversations")
        .select("unread_user")
        .eq("user_id", user.id)
        .single();

      setUnreadMessages(data?.unread_user || 0);
    };

    // load lần đầu
    loadUnread();

    // realtime
    channel = supabase
      .channel("conversation-unread")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
  console.log("ĐÃ NHẬN EVENT", payload);
  setUnreadMessages(payload.new.unread_user || 0);
}
      )
      .subscribe((status, err) => {
  console.log("Realtime status:", status);
  console.log("Realtime error:", err);
});
  };

  init();

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
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

  const init = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    channel = supabase
      .channel(`profile-${user.id}`)
      .on(
  "postgres_changes",
  {
    event: "UPDATE",
    schema: "public",
    table: "profiles",
  },
  (payload) => {
    console.log("PROFILE UPDATED", payload);
    loadProfile();
  }
)
      .subscribe();
  };

  init();

  return () => {
    if (channel) supabase.removeChannel(channel);
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
    maxWidth: isMobile ? "100%" : "900px",
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
    background: "white",
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
    gap: isMobile ? "14px" : "20px",
  }}
>
  <h2
  style={{
    margin: 0,
    fontSize: isMobile ? "18px" : "20px",
    fontWeight: 700,
    textAlign: isMobile ? "center" : "left",
  }}
>
  👋 Xin chào, {profile?.ho_ten}
</h2>

<a
  href="/bao-cao"
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "translateY(-3px) scale(1.03)";
    e.currentTarget.style.background = "#1d4ed8";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "translateY(0) scale(1)";
    e.currentTarget.style.background = "#2563eb";
    e.currentTarget.style.boxShadow = "none";
  }}
  style={{
    background: "#2563eb",
    color: "#fff",
    textDecoration: "none",
    padding: "12px 18px",
    borderRadius: "12px",
    fontWeight: 600,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: isMobile ? "100%" : "auto",
    transition: "all .25s ease",
  }}
>
  📑 Xem báo cáo
</a>

  <a
  href="/trao-doi"
onClick={async () => {
  const { error } = await supabase
    .from("conversations")
    .update({
      unread_user: 0,
    })
    .eq("user_id", profile.id);

  console.log(error);

  setUnreadMessages(0);
}}
  style={{
    background: "#f49510",
    color: "#fff",
    textDecoration: "none",
    padding: "12px 18px",
    borderRadius: "12px",
    fontWeight: 600,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    position: "relative",
    width: isMobile ? "100%" : "auto",
    transition: "all .25s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform =
      "translateY(-3px) scale(1.03)";
    e.currentTarget.style.background = "#d97706";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform =
      "translateY(0) scale(1)";
    e.currentTarget.style.background = "#f49510";
  }}
>
  💬 Nhắn tin

  {unreadMessages > 0 && (
    <span
      style={{
        position: "absolute",
        top: "-8px",
        right: "-8px",
        background: "red",
        color: "white",
        width: "22px",
        height: "22px",
        borderRadius: "50%",
        fontSize: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
      }}
    >
      {unreadMessages}
    </span>
  )}
</a>
<button
  onClick={handleExport}
disabled={exporting}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "translateY(-3px) scale(1.03)";
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
    padding: "12px 18px",
    borderRadius: "12px",
    fontWeight: 600,
    cursor: "pointer",
    width: isMobile ? "100%" : "auto",
    transition: "all .25s ease",
  }}
>

{exporting ? (
  <span
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
    }}
  >
    <span
      style={{
        width: "16px",
        height: "16px",
        border: "2px solid rgba(255,255,255,.4)",
        borderTopColor: "#fff",
        borderRadius: "50%",
        animation: "spin .7s linear infinite",
      }}
    />
    Đang xuất hồ sơ
  </span>
) : (
  "🗂️ Xuất hồ sơ"
)}
</button>

</div>
<div
  style={{
    marginTop: 22,
    borderTop: "1px solid #e5e7eb",
    paddingTop: 18,
  }}
>
  <div
    style={{
      fontWeight: 700,
      marginBottom: 12,
      fontSize: 15,
    }}
  >
    🏅 Bạn đã đạt
  </div>

  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
      marginBottom: 20,
    }}
  >
    {[
  ["Đạo đức", profile?.["dao-duc"]],
  ["Học tập", profile?.["hoc-tap"]],
  ["Thể lực", profile?.["the-luc"]],
  ["Tình nguyện", profile?.["tinh-nguyen"]],
  ["Hội nhập", profile?.["hoi-nhap"]],
].map(([name, value]) => (
      <div
        key={String(name)}
        style={{
          background: value ? "#DCFCE7" : "#F1F5F9",
          color: value ? "#166534" : "#64748b",
          padding: "7px 12px",
          borderRadius: 20,
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {value ? "✅" : "⬜"} {name}
      </div>
    ))}
  </div>

  <div
    style={{
      fontWeight: 700,
      marginBottom: 10,
      fontSize: 15,
    }}
  >
    📅 Hoạt động sắp tới
  </div>

{nextActivities.length > 0 ? (
  <>
    <div
      onClick={() => setShowActivities(!showActivities)}
      style={{
        background: "#F8FAFC",
        borderRadius: 12,
        padding: "12px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
  style={{
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#2563eb",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 12,
  }}
>
          {String(nextActivities.length).padStart(2, "0")}
        </div>

        <span style={{ fontWeight: 600 }}>
          Hoạt động sắp tới
        </span>
      </div>

      <span style={{ fontSize: 22 }}>
        {showActivities ? "▲" : "▼"}
      </span>
    </div>

    {showActivities && (
      <div
        style={{
          marginTop: 10,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {nextActivities.map((activity, index) => (
          <div
            key={activity.id}
            style={{
              background: "#F8FAFC",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div style={{ fontWeight: 700 }}>
              {index + 1}. {activity.title}
            </div>

            <div
              style={{
                color: "#64748b",
                marginTop: 4,
                fontSize: 14,
              }}
            >
              🎯 {criterionLabel[activity.criterion] ?? "Khác"}
            </div>

            <a
              href="/hoat-dong"
              style={{
                display: "inline-block",
                marginTop: 8,
                color: "#2563eb",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Xem chi tiết →
            </a>
          </div>
        ))}
      </div>
    )}
  </>
) : (
  <div
    style={{
      color: "#64748b",
      fontSize: 14,
    }}
  >
    Chưa có hoạt động sắp tới.
  </div>
)}
</div>
</div>
<div
  style={{
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(3, minmax(250px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  }}
>
  {/* Quản lý tiêu chí */}
  <a
    href="/tieuchi"
    style={{
      background: "#F3E8FF",
      borderRadius: "18px",
      padding: "24px",
      textDecoration: "none",
      color: "#111827",
      boxShadow: "0 4px 12px rgba(0,0,0,.08)",
      transition: ".25s",
    }}
    onMouseEnter={(e) =>
      (e.currentTarget.style.transform = "translateY(-5px)")
    }
    onMouseLeave={(e) =>
      (e.currentTarget.style.transform = "translateY(0)")
    }
  >
    <div style={{ fontSize: 38 }}>📋</div>

    <h3 style={{ margin: "15px 0 8px", fontSize: 22 }}>
      Quản lý tiêu chí
    </h3>

    <p style={{ margin: 0, color: "#8796aa" }}>
      Quản lý minh chứng theo từng tiêu chí Sinh viên 5 Tốt.
    </p>
  </a>
  

  {/* Bảng điểm */}
  <a
    href="/bang-diem"
    style={{
      background: "#DCFCE7",
      borderRadius: "18px",
      padding: "24px",
      textDecoration: "none",
      color: "#111827",
      boxShadow: "0 4px 12px rgba(0,0,0,.08)",
      transition: ".25s",
    }}
    onMouseEnter={(e) =>
      (e.currentTarget.style.transform = "translateY(-5px)")
    }
    onMouseLeave={(e) =>
      (e.currentTarget.style.transform = "translateY(0)")
    }
  >
    <div style={{ fontSize: 38 }}>📊</div>

    <h3 style={{ margin: "15px 0 8px", fontSize: 22 }}>
      Bảng điểm
    </h3>

    <p style={{ margin: 0, color: "#64748b" }}>
      Theo dõi kết quả học tập của bạn.
    </p>
  </a>
{/* Hoạt động tháng này */}
  <a
    href="/hoat-dong"
    style={{
      background: "#E0F2FE",
      borderRadius: "18px",
      padding: "24px",
      textDecoration: "none",
      color: "#111827",
      boxShadow: "0 4px 12px rgba(0,0,0,.08)",
      transition: ".25s",
    }}
    onMouseEnter={(e) =>
      (e.currentTarget.style.transform = "translateY(-5px)")
    }
    onMouseLeave={(e) =>
      (e.currentTarget.style.transform = "translateY(0)")
    }
  >
    <div style={{ fontSize: "38px" }}>📅</div>

    <h3 style={{ margin: "15px 0 8px", fontSize: 22 }}>
      Hoạt động sắp diễn ra
    </h3>

    <p style={{ margin: 0, color: "#64748b" }}>
      Xem các hoạt động sắp diễn ra trong thời gian tới.
    </p>
  </a>
  
</div>
      <div
  style={{
    marginTop: "25px",
    background:  "white",
    borderRadius: "16px",
    padding: "25px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  }}
>
  <h2
  style={{
    marginTop: 0,
    marginBottom: "15px",
    fontSize: "16px",
  }}
>
  📝 Nhận xét hồ sơ

  {profile?.nhan_xet &&
    profile.nhan_xet.trim() !== "" &&
    profile?.ngay_nhan_xet && (
      <span
        style={{
          marginLeft: "10px",
          fontSize: "14px",
          fontStyle: "italic",
          color: "#64748b",
          fontWeight: "400",
        }}
      >
        (cập nhật{" "}
        {new Date(
          profile.ngay_nhan_xet
        ).toLocaleString("vi-VN")}
        )
      </span>
    )}
</h2>

  <div
    style={{
      background: "#f8fafc",
      borderRadius: "12px",
      padding: "20px",
      minHeight: "150px",
      whiteSpace: "pre-wrap",
      lineHeight: "1.8",
      color: "#000000",
    }}
  >
    <i>{profile?.nhan_xet || "Chưa có nhận xét"}</i>
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