"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import Header from "../components/Header";
import BellUserTemp from "../components/BellUserTemp";
import Spinner from "../components/Spinner";
import CriteriaModal from "../components/CriteriaModal";

export default function TieuChiPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [tab, setTab] = useState("proof");
   const [showCriteria, setShowCriteria] = useState(false);
   const [showProfile, setShowProfile] = useState(false);


  useEffect(() => {
    loadProfile();

    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(data);
    setLoading(false);
  }

  const folders = [
  {
  name: "Đạo đức tốt",
  icon: "❤️",
  link: "/dao-duc",
  field: "dao-duc",
  color: "#FFD6E7", // Hồng pastel
},
{
  name: "Học tập tốt",
  icon: "📚",
  link: "/hoc-tap",
  field: "hoc-tap",
  color: "#ffeaca", // Xanh dương pastel
},
{
  name: "Thể lực tốt",
  icon: "💪",
  link: "/the-luc",
  field: "the-luc",
  color: "#D8F7E3", // Xanh lá pastel
},
{
  name: "Tình nguyện tốt",
  icon: "🤝",
  link: "/tinh-nguyen",
  field: "tinh-nguyen",
  color: "#FFF2CC", // Vàng kem pastel
},
{
  name: "Hội nhập tốt",
  icon: "🌏",
  link: "/hoi-nhap",
  field: "hoi-nhap",
  color: "#D9F3F8", // Xanh ngọc pastel
},
{
  name: "Tiêu chuẩn ưu tiên",
  icon: "⭐",
  link: "/uu-tien",
  field: "uu-tien",
  color: "#E9D8FD", // Tím pastel
},
  ];

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
const completed = [
  profile?.["dao-duc"],
  profile?.["hoc-tap"],
  profile?.["the-luc"],
  profile?.["tinh-nguyen"],
  profile?.["hoi-nhap"],
].filter(Boolean).length;

const percent = (completed / 5) * 100;
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
  "linear-gradient(rgba(245,247,251,.88), rgba(245, 247, 251, 0.61)), url('/gioithieu.avif')",
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

<div
  style={{
    background: "white",
    borderRadius: "16px",
    padding: "16px",
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
    <div>
      <h2
        style={{
          margin: 0,
          fontSize: isMobile ? "18px" : "20px",
          fontWeight: 700,
        }}
      >
        📊 Tiến độ Sinh viên 5 Tốt Cấp Trường
      </h2>

<p style={{ marginBottom: "10px", color: "#64748b" }}>
  Bạn đã hoàn thành <b>{completed}/5</b> tiêu chí.
</p>
      <div
  style={{
    width: "100%",
    height: "8px",
    background: "#e5e7eb",
    borderRadius: "999px",
    overflow: "hidden",
    marginTop: "8px",
  }}
>
  <div
    style={{
      width: `${percent}%`,
      height: "100%",
      background: "linear-gradient(90deg, #2563eb, #60a5fa)",
      transition: "width .4s ease",
      borderRadius: "999px",
    }}
  />
</div>
    </div>
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
  </div>
</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "20px",
              }}
            >
              {folders.map((folder) => (
                <a
                  key={folder.name}
                  href={folder.link}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                  style={{
  transition: "all .25s ease",
  cursor: "pointer",
  background: folder.color,
  padding: "25px",
  borderRadius: "18px",
  textDecoration: "none",
  color: "#111",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
}}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "28px",
                      }}
                    >
                      {folder.icon}
                    </span>

                    <div>
                      <h2
                        style={{
                          margin: 0,
                          fontSize: "18px",
                          fontWeight: 600,
                        }}
                      >
                        {folder.name}
                      </h2>

                      {folder.name !== "Tiêu chuẩn ưu tiên" && (
                        <div
                          style={{
                            marginTop: "4px",
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            background: profile?.[folder.field]
                              ? "#dcfce7"
                              : "#f3f4f6",
                            color: profile?.[folder.field]
                              ? "#166534"
                              : "#f36060",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          {profile?.[folder.field]
                            ? "✅ Đạt"
                            : "❌ Chưa đạt"}
                        </div>
                      )}
                    </div>
                  </div>

                  <p
                    style={{
                      color: "#666",
                      marginTop: "8px",
                      fontSize: "14px",
                    }}
                  >
                    Nhấn để xem và quản lý minh chứng
                  </p>
                </a>
              ))}
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