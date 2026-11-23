"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { LogOut, ChevronLeft } from "lucide-react";
import AppIcon, { type AppIconName } from "./AppIcon";

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<any>(null);
  const [activeActivityCount, setActiveActivityCount] = useState(0);

  // submenu minh chứng
  const [showProofMenu, setShowProofMenu] = useState(false);
  const [proofMenuPosition, setProofMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    checkRole();
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();

    window.addEventListener("resize", checkMobile);

    return () =>
      window.removeEventListener("resize", checkMobile);
  }, []);
useEffect(() => {
  async function loadAcademicYear() {
    const { data, error } = await supabase
      .from("academic_years")
      .select("id, name")
      .order("id", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Lỗi lấy năm học:", error);
      return;
    }

    setCurrentAcademicYear(data);
  }

  loadAcademicYear();
}, []);
useEffect(() => {
  async function loadActiveActivityCount() {
    const { data, error } = await supabase
      .from("activities")
      .select("event_time, end_time, status");

    if (error) {
      console.error("Lỗi lấy số lượng hoạt động:", error);
      return;
    }

    const now = new Date();

    const count = (data || []).filter((activity) => {
      const startTime = activity.event_time
        ? new Date(activity.event_time)
        : null;

      const endTime = activity.end_time
        ? new Date(activity.end_time)
        : null;

      let displayStatus = activity.status;

      // Ưu tiên xác định trạng thái theo thời gian
      if (startTime && endTime) {
        if (now < startTime) {
          displayStatus = "scheduled";
        } else if (now <= endTime) {
          displayStatus = "ongoing";
        } else {
          displayStatus = "ended";
        }
      }

      return (
        displayStatus === "upcoming" ||
        displayStatus === "scheduled" ||
        displayStatus === "ongoing"
      );
    }).length;

    setActiveActivityCount(count);
  }

  loadActiveActivityCount();
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

    setIsAdmin(data?.role === "admin");
  }

  const proofMenus = [
  {
    name: "Đạo đức tốt",
    icon: "sprout" as AppIconName,
    href: `/dao-duc?year=${currentAcademicYear?.id || ""}`,
  },
  {
    name: "Học tập tốt",
    icon: "graduation" as AppIconName,
    href: `/hoc-tap?year=${currentAcademicYear?.id || ""}`,
  },
  {
    name: "Thể lực tốt",
    icon: "dumbbell" as AppIconName,
    href: `/the-luc?year=${currentAcademicYear?.id || ""}`,
  },
  {
    name: "Tình nguyện tốt",
    icon: "handshake" as AppIconName,
    href: `/tinh-nguyen?year=${currentAcademicYear?.id || ""}`,
  },
  {
    name: "Hội nhập tốt",
    icon: "globe" as AppIconName,
    href: `/hoi-nhap?year=${currentAcademicYear?.id || ""}`,
  },
  {
    name: "Thành tích khác",
    icon: "trophy" as AppIconName,
    href: `/uu-tien?year=${currentAcademicYear?.id || ""}`,
  },
];
const proofPaths = [
  "/tieuchi",
  "/dao-duc",
  "/hoc-tap",
  "/the-luc",
  "/tinh-nguyen",
  "/hoi-nhap",
  "/uu-tien",
];
  const menus = [
    {
      name: "Trang chủ",
      icon: "home" as AppIconName,
      href: "/",
    },
    {
      name: isMobile ? "Hồ sơ" : "Hồ sơ Sinh viên 5 tốt",
      icon: "folder-open" as AppIconName,
      href: "/tieuchi",
    },
    {
      name: "Xem Báo cáo",
      icon: "file" as AppIconName,
      href: "/bao-cao",
    },
    {
      name: "Mục tiêu học tập",
      icon: "chart" as AppIconName,
      href: "/bang-diem",
    },
    {
      name: "Hoạt động sắp tới",
      icon: "calendar" as AppIconName,
      href: "/hoat-dong",
    },
    {
      name: "Thông báo",
      icon: "bell" as AppIconName,
      href: "/thongbaouser",
    },
    {
      name: "Hướng dẫn",
      icon: "book" as AppIconName,
      href: "/huong-dan",
    },
    {
      name: "Cài đặt",
      icon: "settings" as AppIconName,
      href: "/caidat",
    },
  ];

  const renderMenuIcon = (icon: AppIconName, alt: string) => (
    <span
      aria-label={alt}
      style={{ display: "inline-flex", verticalAlign: "middle", marginRight: 6 }}
    >
      <AppIcon name={icon} size={22} />
    </span>
  );

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/introduce";
  }
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
    {renderMenuIcon(item.icon, item.name)} {item.name}
  </Link>
))}

{/* ĐĂNG XUẤT */}
<button
  onClick={handleLogout}
  style={{
    display: "flex",
    alignItems: "center",
    gap: 8,
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
          <button onClick={() => setMobileMenu(true)}>
            <AppIcon name="menu" size={20} />
          </button>

          <Link
            href="/"
            className={pathname === "/" ? "active" : ""}
          >
            <div><AppIcon name="home" size={20} /></div>
          </Link>

          <Link
            href="/tieuchi"
            className={
              pathname === "/tieuchi" ? "active" : ""
            }
          >
            <div><AppIcon name="folder-open" size={20} /></div>
          </Link>

          <Link
            href="/bao-cao"
            className={
              pathname === "/bao-cao" ? "active" : ""
            }
          >
            <div><AppIcon name="file" size={20} /></div>
          </Link>
          <Link
            href="/bang-diem"
            className={
              pathname === "/bang-diem" ? "active" : ""
            }
          >
            <div><AppIcon name="chart" size={20} /></div>
          </Link>

          <Link
  href="/hoat-dong"
  className={
    pathname === "/hoat-dong" ? "active" : ""
  }
>
  <div
    style={{
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <AppIcon name="calendar" size={20} />

    {activeActivityCount > 0 && (
      <span
        style={{
          position: "absolute",
          top: -9,
          right: -12,
          minWidth: 17,
          height: 17,
          padding: "0 4px",
          borderRadius: 20,
          background: "#ef4444",
          color: "#fff",
          fontSize: 10,
          fontWeight: 700,
          lineHeight: "17px",
          textAlign: "center",
          border: "1.5px solid #fff",
          boxSizing: "border-box",
        }}
      >
        {activeActivityCount > 99 ? "99+" : activeActivityCount}
      </span>
    )}
  </div>
</Link>

          <Link
            href="/caidat"
            className={
              pathname === "/caidat"
                ? "active"
                : ""
            }
          >
            <div><AppIcon name="settings" size={20} /></div>
          </Link>
        </nav>
      </>
    );
  }

// =======================
// DESKTOP
// =======================

return (
  <>

  <aside
    style={{
      width: collapsed ? "80px" : "280px",
      transition: "0.3s",
      height: "calc(100dvh - 90px)",
      maxHeight: "calc(100dvh - 90px)",
      position: "sticky",
      top: 0,
      background: "#fff",
      borderRight: "1px solid #e5e7eb",
      display: "flex",
      flexDirection: "column",
      overflow: "visible",
      zIndex: 9998,
    }}
  >
    {/* HEADER */}
    <div
      style={{
        padding: "20px 0",
        textAlign: "center",
        flexShrink: 0,
      }}
    >
      {!collapsed && (
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#1e3a8a",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <AppIcon name="menu" size={20} /> Menu
          </span>
        </h2>
      )}
    </div>
    {/* MENU */}
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "0 10px",
      }}
    >
      {menus.map((item) => {
        const active = pathname === item.href;
        const proofActive = proofPaths.includes(pathname);

        // ===== MENU MINH CHỨNG =====
        if (item.name === "Hồ sơ Sinh viên 5 tốt") {
          return (
            <div
              key={item.href}
              style={{ position: "relative" }}
              onMouseEnter={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                setProofMenuPosition({
                  top: rect.top,
                  left: rect.right,
                });
                setShowProofMenu(true);
              }}
              onMouseLeave={() => setShowProofMenu(false)}
            >
              <Link
                href="/tieuchi"
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  textDecoration: "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: proofActive ? "#2563eb" : "transparent",
                  color: proofActive ? "#fff" : "#111",
                  transition: ".25s",
                }}
              >
                <span>
                  {collapsed ? (
                    <AppIcon name="folder-open" size={22} />
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <AppIcon name="folder-open" size={22} /> Hồ sơ Sinh viên 5 tốt
                    </span>
                  )}
                </span>

                {!collapsed && <AppIcon name="chevron-right" size={18} />}
              </Link>

              {showProofMenu && (
                <div
                  style={{
                    position: "fixed",
                    left: proofMenuPosition.left,
                    top: proofMenuPosition.top,
                    width: 220,
                    background: "#fff",
                    borderRadius: 14,
                    boxShadow:
                      "0 10px 30px rgba(0,0,0,.18)",
                    padding: 8,
                    zIndex: 99999,
                  }}
                >
{proofMenus.map((sub) => {
  const subActive = pathname === sub.href;

  return (
    <Link
      key={sub.href}
      href={sub.href}
      style={{
        display: "block",
        padding: "10px 14px",
        borderRadius: 10,
        textDecoration: "none",
        background: subActive ? "#2563eb" : "transparent",
        color: subActive ? "#fff" : "#111",
        fontWeight: subActive ? 600 : 400,
        transition: "all .25s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
  if (!subActive) {
    e.currentTarget.style.background = "#dbeafe";
    e.currentTarget.style.color = "#1e3a8a";
    e.currentTarget.style.transform = "translateX(6px) translateY(-2px)";
    e.currentTarget.style.boxShadow =
      "0 6px 16px rgba(37,99,235,.18)";
  }
}}

onMouseLeave={(e) => {
  if (!subActive) {
    e.currentTarget.style.background = "transparent";
    e.currentTarget.style.color = "#111";
    e.currentTarget.style.transform = "translateX(0) translateY(0)";
    e.currentTarget.style.boxShadow = "none";
  }
}}
    >
      {renderMenuIcon(sub.icon, sub.name)} {sub.name}
    </Link>
  );
})}
                </div>
              )}
            </div>
          );
        }

        // ===== MENU THƯỜNG =====
        return (
          <Link
            key={item.href}
            href={item.href}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.background =
                  "#bed5f4";
                e.currentTarget.style.color =
                  "#1e3a8a";
                e.currentTarget.style.transform =
                  "translateX(6px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.background =
                  "transparent";
                e.currentTarget.style.color = "#111";
                e.currentTarget.style.transform =
                  "translateX(0)";
              }
            }}
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              textDecoration: "none",
              background: active
                ? "#2563eb"
                : "transparent",
              color: active ? "#fff" : "#111",
              transition: ".25s",
              whiteSpace: "nowrap",
            }}
          >
            {renderMenuIcon(item.icon, item.name)}
            {!collapsed && ` ${item.name}`}
          </Link>
        );
      })}
    </div>
    {/* FOOTER */}
    <div
      style={{
        marginTop: "auto",
        padding: 12,
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
          padding: "14px",
          borderRadius: 12,
          cursor: "pointer",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
        }}
      >
        <LogOut
          size={20}
          style={{
            transform: "scaleX(-1)",
          }}
        />
        {!collapsed && "Đăng xuất"}
      </button>
    </div>

    {/* TOGGLE */}
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
    border: "2px solid #fff",
    background: "#374151",
    color: "#fff",
    cursor: "pointer",
    zIndex: 10001,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",

    display: "flex",
    justifyContent: "center",
    alignItems: "center",   // <-- thêm 2 dòng này
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
  </>
);
}