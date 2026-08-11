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
  const [hoverSubmit, setHoverSubmit] = useState(false);
  const [submissionOpen, setSubmissionOpen] = useState(true);

  useEffect(() => {loadProfile();

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
     const { data: setting, error: settingError } = await supabase
    .from("site_settings")
    .select("submission_open")
    .eq("id", 1)
    .single();

  if (settingError) {
    console.error(
      "Lỗi lấy trạng thái nhận hồ sơ:",
      settingError
    );
  }

  if (setting) {
    setSubmissionOpen(setting.submission_open);
  }

  setLoading(false);
  }
async function submitProfile() {
  if (!profile?.id) return;

  // Kiểm tra trạng thái nhận hồ sơ mới nhất
  const { data: setting, error: settingError } = await supabase
    .from("site_settings")
    .select("submission_open")
    .eq("id", 1)
    .single();

  if (settingError) {
    console.error(settingError);
    alert("Không thể kiểm tra trạng thái nhận hồ sơ.");
    return;
  }

  // Đã đóng
  if (!setting?.submission_open) {
    setSubmissionOpen(false);

    alert("Hồ sơ đã hết hạn gửi. Hiện tại hệ thống không còn nhận hồ sơ.");

    return;
  }

  // Nếu đang ở trạng thái đã nộp → cho phép chỉnh sửa
  const newSubmittedState = !profile.is_submitted;

  const submittedAt = newSubmittedState
    ? new Date().toISOString()
    : null;

  const { error } = await supabase
    .from("profiles")
    .update({
      is_submitted: newSubmittedState,
      submitted_at: submittedAt,
    })
    .eq("id", profile.id);

  if (error) {
    console.error(error);
    alert("Không thể cập nhật trạng thái hồ sơ.");
    return;
  }

  setProfile((prev: any) => ({
    ...prev,
    is_submitted: newSubmittedState,
    submitted_at: submittedAt,
  }));
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
  padding: isMobile ? "12px" : "16px 20px",
  marginBottom: isMobile ? "20px" : "30px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
}}
>
<div
  style={{
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    alignItems: isMobile ? "stretch" : "center",
    justifyContent: "space-between",
    gap: isMobile ? "12px" : "20px",
  }}
>
  {/* Nội dung tiến độ */}
  <div
    style={{
      flex: 1,
      minWidth: 0,
    }}
  >
   <h2
  style={{
    margin: 0,
    fontSize: isMobile ? "16px" : "20px",
    lineHeight: "1.25",
    fontWeight: 700,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }}
>
  📊 Tiến độ Sinh viên 5 Tốt Cấp Trường
</h2>

    <p
      style={{
        margin: "8px 0 10px",
        color: "#64748b",
      }}
    >
      Bạn đã hoàn thành <b>{completed}/5</b> tiêu chí.
    </p>

    <div
      style={{
        width: "100%",
        height: "8px",
        background: "#e5e7eb",
        borderRadius: "999px",
        overflow: "hidden",
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

  {/* Hai nút */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: "10px",
      flexShrink: 0,
    }}
  >
    {/* Xem báo cáo */}
    <a
      href="/bao-cao"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px) scale(1.03)";
        e.currentTarget.style.background = "#1d4ed8";
        e.currentTarget.style.boxShadow =
          "0 6px 16px rgba(37, 99, 235, 0.25)";
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
        padding: isMobile ? "10px 12px" : "11px 16px",
        borderRadius: "12px",
        fontWeight: 600,
        fontSize: "14px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: isMobile ? "42px" : "44px",
        boxSizing: "border-box",
        transition: "all .25s ease",
        whiteSpace: "nowrap",
      }}
    >
      Xem báo cáo
    </a>

    {/* Gửi báo cáo */}
<button
  type="button"
  onClick={() => {
    if (!submissionOpen) {
      alert(
        "Hồ sơ đã hết hạn gửi. Hiện tại hệ thống không còn nhận hồ sơ."
      );
      return;
    }

    submitProfile();
  }}
  onMouseEnter={(e) => {
    if (!submissionOpen) return;

    setHoverSubmit(true);

    e.currentTarget.style.transform = "translateY(-3px) scale(1.03)";
    e.currentTarget.style.background = profile?.is_submitted
      ? "#15803d"
      : "#1d4ed8";
    e.currentTarget.style.boxShadow = profile?.is_submitted
      ? "0 6px 16px rgba(22, 163, 74, 0.25)"
      : "0 6px 16px rgba(37, 99, 235, 0.25)";
  }}
  onMouseLeave={(e) => {
    if (!submissionOpen) return;

    setHoverSubmit(false);

    e.currentTarget.style.transform = "translateY(0) scale(1)";
    e.currentTarget.style.background = profile?.is_submitted
      ? "#16a34a"
      : "#2563eb";
    e.currentTarget.style.boxShadow = "none";
  }}
  style={{
    background: !submissionOpen
      ? "#94a3b8"
      : profile?.is_submitted
        ? "#16a34a"
        : "#2563eb",

    color: "#fff",

    padding: isMobile
      ? "10px 12px"
      : "11px 16px",

    border: "none",
    borderRadius: "12px",

    fontWeight: 600,
    fontSize: "14px",

    display: "flex",
    justifyContent: "center",
    alignItems: "center",

    height: isMobile
      ? "42px"
      : "44px",

    boxSizing: "border-box",

    cursor: !submissionOpen
      ? "not-allowed"
      : "pointer",

    transition: "all .25s ease",
    whiteSpace: "nowrap",

    opacity: !submissionOpen
      ? 0.8
      : 1,
  }}
>
  {!submissionOpen
    ? "⛔ Đã hết hạn"
    : profile?.is_submitted
      ? hoverSubmit
        ? "✏️ Chỉnh sửa"
        : "✅ Đã nộp hồ sơ"
      : "Gửi hồ sơ"}
</button>
  </div>
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