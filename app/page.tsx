"use client";


import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Image from "next/image";
import CriteriaModal from "./components/CriteriaModal";

export default function Home() {
    const [profile, setProfile] = useState<any>(null);
    const [tab, setTab] = useState("proof");
    const [loading, setLoading] = useState(true);
    const [showCriteria,setShowCriteria]=useState(false);

useEffect(() => {
checkUser();
}, []);
useEffect(() => {
  checkUser();
  loadProfile();
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

if (data) {
  console.table(data);
  setProfile(data);
}
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
Đang tải... </div>
);
}

return (
<div
  style={{
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  }}
>
  <div
    style={{
      display: "flex",
      flex: 1,
    }}
  >
<Sidebar />
 <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header
    tab={tab}
    setTab={setTab}
    openCriteria={() => setShowCriteria(true)}
/>
  <main
    style={{
      flex: 1,
      minHeight: "100vh",
      background: "#f5f7fb",
      padding: "30px",
    }}
  >
    <div
  style={{
    maxWidth: "900px",
    margin: "0 auto",
  }}
>

      <h1
    style={{
      marginBottom: "5px",
      fontSize: "20px",
      fontWeight: 500,
      textAlign: "center",
      color: "#0f172a",
    }}
  >
    <b>CÂU LẠC BỘ SINH VIÊN 5 TỐT TRƯỜNG ĐẠI HỌC Y DƯỢC BUÔN MA THUỘT</b>
  </h1>

   <p
  style={{
    textAlign: "center",
    fontSize: "26px",
    fontWeight: "bold",
    marginBottom: "30px",
    color: "#0f65de",
  }}
>
    Mô Hình hỗ trợ sinh viên phấn đấu đạt danh hiệu Sinh viên 5 tốt các cấp
  </p>
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
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
  <h2
    style={{
      margin: 0,
      fontSize: "20px",
      fontWeight: "700",
    }}
  >
    👋 Xin chào, {profile?.ho_ten}
  </h2>

<a
  href="/bao-cao"
  style={{
    background: "#2563eb",
    color: "white",
    textDecoration: "none",
    padding: "12px 20px",
    borderRadius: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "48px",
    boxSizing: "border-box",
  }}
>
  📑 Gửi báo cáo
</a>
  
  <button
  onClick={() => {
    window.open(
      `/api/export-student/${profile.id}`,
      "_blank"
    );
  }}
  className="bg-green-600 text-white px-5 py-3 rounded-xl font-semibold"
>
  🗂️ Xuất hồ sơ
</button>
</div>
</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
        }}
      >

        {folders.map((folder) => (
          <a
            key={folder.name}
            href={folder.link}
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "18px",
              textDecoration: "none",
              color: "#111",
              boxShadow:
                "0 4px 12px rgba(0,0,0,0.08)",
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
        fontWeight: "600",
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
      background:
        profile?.[folder.field]
          ? "#dcfce7"
          : "#f3f4f6",
      color:
        profile?.[folder.field]
          ? "#166534"
          : "#f36060",
      fontSize: "12px",
      fontWeight: "600",
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
    background: "white",
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