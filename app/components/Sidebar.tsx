"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Sidebar() {
const pathname = usePathname();
if (pathname === "doi-mat-khau") {
  return null;
}
const [collapsed, setCollapsed] = useState(true);
const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
useEffect(() => {
  checkRole();
}, []);

async function checkRole() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (data?.role === "admin") {
    setIsAdmin(true);
  }
  if (data?.role === "admin") {
  setIsAdmin(true);
} else {
  setIsAdmin(false);
}
}
const menus = [
  {
    name: "Trang chủ",
    icon: "🏠",
    href: "/",
  },
  {
    name: "Báo cáo thành tích",
    icon: "📑",
    href: "/bao-cao",
  },
  {
    name: "Đạo đức tốt",
    icon: "❤️",
    href: "/dao-duc",
  },
  {
    name: "Học tập tốt",
    icon: "📚",
    href: "/hoc-tap",
  },
  {
    name: "Thể lực tốt",
    icon: "💪",
    href: "/the-luc",
  },
  {
    name: "Tình nguyện tốt",
    icon: "🤝",
    href: "/tinh-nguyen",
  },
  {
    name: "Hội nhập tốt",
    icon: "🌏",
    href: "/hoi-nhap",
  },
  {
    name: "Tiêu chuẩn ưu tiên",
    icon: "⭐",
    href: "/uu-tien",
  },

  ...(isAdmin === false
    ? [
        {
          name: "Đổi mật khẩu",
          icon: "🔐",
          href: "/doi-mat-khau",
        },
      ]
    : []),
];

async function handleLogout() {
await supabase.auth.signOut();
window.location.href = "/introduce";
}

return (
<aside
style={{
width: collapsed ? "80px" : "280px",
transition: "0.3s",
position: "relative",
minHeight: "100vh",
background: "white",
borderRight: "1px solid #e5e7eb",
padding: "20px",
display: "flex",
flexDirection: "column",
}}
>
{!collapsed && (
  <h2
  style={{
    textAlign: "center",
    fontSize: "22px",
    fontWeight: "700",
    color: "#1e3a8a",
    marginTop: "10px",
    marginBottom: "40px",
  }}
>
  ☰ Menu
</h2>
)}

  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    }}
  >
    {menus.map((item) => {
      const active = pathname === item.href;

      return (
        <Link
          key={item.href}
          href={item.href}
          style={{
            padding: "12px 14px",
            borderRadius: "12px",
            textDecoration: "none",
            fontSize: "17px",

            background: active
              ? "#2563eb"
              : "transparent",

            color: active
              ? "white"
              : "#111827",

            fontWeight: active
              ? "600"
              : "400",

            transition: "0.2s",
          }}
        >
          {collapsed ? item.icon : `${item.icon} ${item.name}`}
        </Link>
      );
    })}
  </div>

  <div style={{ flex: 1 }} />

<button
  onClick={() => setCollapsed(!collapsed)}
  style={{
    position: "absolute",
    right: "-15px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    border: "none",
    background: "#b9b9b9",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    zIndex: 100,
  }}
>
  {collapsed ? "❯" : "❮"}
</button>

<button
  onClick={handleLogout}
  style={{
    border: "none",
    background: "#ef4444",
    color: "white",
    padding: "14px",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "17px",
    fontWeight: "600",
  }}
>
  {collapsed ? "🚪" : "🚪 Đăng xuất"}
</button>
</aside>


);
}
