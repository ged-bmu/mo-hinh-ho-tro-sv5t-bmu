"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Sidebar() {
const [mobileMenu, setMobileMenu] = useState(false);
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
  {
    name:"Chi tiết thông báo",
    icon:"🔔",
    href: "/thongbaouser",
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
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  checkMobile();

  window.addEventListener("resize", checkMobile);

  return () => window.removeEventListener("resize", checkMobile);
}, []);
// =======================
// MOBILE
// =======================
if (isMobile) {
  return (
    <>
 {mobileMenu && (
  <div
    className="mobile-menu-overlay"
    onClick={() => setMobileMenu(false)}
  >
    <div
      className="mobile-menu"
      onClick={(e) => e.stopPropagation()}
    >
      {menus.map((item) => (
  <Link
    key={item.href}
    href={item.href}
    onClick={() => setMobileMenu(false)}
    className={pathname === item.href ? "active" : ""}
  >
    {item.icon} {item.name}
  </Link>
))}

      <button onClick={handleLogout}>
        🚪 Đăng xuất
      </button>
    </div>
  </div>
)}

      <nav className="mobile-bottom-nav">

  {/* Menu */}
  <button onClick={() => setMobileMenu(true)}>
    ☰
  </button>

  {/* Trang chủ */}
  <Link
    href="/"
    className={pathname === "/" ? "active" : ""}
  >
    <div>🏠</div>
  </Link>

{/* Đạo đức */}
  <Link
  href="/dao-duc"
  className={pathname === "/dao-duc" ? "active" : ""}
>
  <div>❤️</div>
</Link>

{/* Học tập */}
<Link
  href="/hoc-tap"
  className={pathname === "/hoc-tap" ? "active" : ""}
>
  <div>📚</div>
</Link>

{/* Thể lực */}
<Link
  href="/the-luc"
  className={pathname === "/the-luc" ? "active" : ""}
>
  <div>💪</div>
</Link>

{/* Tình nguyện */}
<Link
  href="/tinh-nguyen"
  className={pathname === "/tinh-nguyen" ? "active" : ""}
>
  <div>🤝</div>
</Link>

{/* Hội nhập */}
<Link
  href="/hoi-nhap"
  className={pathname === "/hoi-nhap" ? "active" : ""}
>
  <div>🌏</div>
</Link>

</nav>
    </>
  );
}

// =======================
// DESKTOP
// =======================

return (
  <aside
    className="sidebar desktop-sidebar"
    style={{
      width: collapsed ? "80px" : "280px",
      transition: "0.3s",
      position: "relative",
      minHeight: "100vh",
      background: "#fff",
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
          fontSize: 22,
          fontWeight: 700,
          color: "#1e3a8a",
          marginBottom: 30,
        }}
      >
        ☰ Menu
      </h2>
    )}

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
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
              borderRadius: 12,
              textDecoration: "none",
              background: active ? "#2563eb" : "transparent",
              color: active ? "#fff" : "#111",
              fontWeight: active ? 600 : 400,
            }}
          >
            {collapsed ? item.icon : `${item.icon} ${item.name}`}
          </Link>
        );
      })}
    </div>

    <div style={{ flex: 1 }} />

    <button
      className="sidebar-collapse"
      onClick={() => setCollapsed(!collapsed)}
      style={{
        position: "absolute",
        right: -15,
        top: "50%",
        transform: "translateY(-50%)",
        width: 30,
        height: 30,
        borderRadius: "50%",
        border: "none",
        background: "#b9b9b9",
        color: "#fff",
        cursor: "pointer",
      }}
    >
      {collapsed ? "❯" : "❮"}
    </button>

    <button
      onClick={handleLogout}
      style={{
        border: "none",
        background: "#ef4444",
        color: "#fff",
        padding: 14,
        borderRadius: 12,
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      {collapsed ? "🚪" : "🚪 Đăng xuất"}
    </button>
  </aside>
);
}