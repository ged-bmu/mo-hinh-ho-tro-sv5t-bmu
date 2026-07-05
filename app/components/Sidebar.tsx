"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { LogOut } from "lucide-react";
import { ChevronLeft } from "lucide-react";

export default function Sidebar() {
const [mobileMenu, setMobileMenu] = useState(false);
const pathname = usePathname();
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

     <button
  onClick={handleLogout}
  style={{
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#ef4444",
    color: "#fff",
  }}
>
  <LogOut
    size={20}
    style={{ transform: "scaleX(-1)" }}
  />
  <span>Đăng xuất</span>
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
      height: "100vh",
      position: "sticky",
      top: 0,
      background: "#fff",
      borderRight: "1px solid #e5e7eb",
      display: "flex",
      flexDirection: "column",
      zIndex: 1000
    }}
  >
    {/* ================= HEADER ================= */}
    <div style={{ padding: "20px 0", textAlign: "center", flexShrink: 0 }}>
      {!collapsed && (
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1e3a8a" }}>
          ☰ Menu
        </h2>
      )}
    </div>

    {/* ================= MENU (SCROLL AREA) ================= */}
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "0 10px",
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
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {collapsed ? item.icon : `${item.icon} ${item.name}`}
          </Link>
        );
      })}
    </div>

    {/* ================= FOOTER (LOGOUT FIXED) ================= */}
    <div
  style={{
    marginTop: "auto",
    padding: "12px",
    flexShrink: 0,
  }}
>
      <button
        onClick={handleLogout}
        style={{
          width: "100%",
          border: "none",
          background: "#ef4444",
          color: "#fff",
          padding: "14px 16px",
          borderRadius: 12,
          cursor: "pointer",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <LogOut size={20} style={{ transform: "scaleX(-1)" }} />
        {!collapsed && <span>Đăng xuất</span>}
      </button>
    </div>

    {/* ================= TOGGLE (FLOAT FIXED FEEL) ================= */}
    <button
  onClick={() => setCollapsed(!collapsed)}
  style={{
    position: "absolute",
    right: -15,
    top: "50%",
    transform: "translateY(-50%)",
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "none",
    background: "#858585",
    color: "#fff",
    cursor: "pointer",
    zIndex: 10,
    fontSize: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}
>
  <ChevronLeft
  size={18}
  style={{
    transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
    transition: "0.3s",
  }}
/>
</button>
  </aside>
);
}