"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { LogOut, ChevronLeft } from "lucide-react";


export default function Sidebar() {
  const pathname = usePathname();

  const [mobileMenu, setMobileMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // submenu minh chứng
  const [showProofMenu, setShowProofMenu] = useState(false);

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
      icon: "🏠",
      href: "/",
    },
    {
      name: "Báo cáo",
      icon: "📝",
      href: "/bao-cao",
    },
    {
      name: "Minh chứng",
      icon: "🗂️",
      href: "/tieuchi",
    },
    {
      name: "Bảng điểm",
      icon: "📊",
      href: "/bang-diem",
    },
    {
      name: "Hoạt động",
      icon: "🎯",
      href: "/hoat-dong",
    },
    {
      name: "Thông báo",
      icon: "🔔",
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
                  className={
                    pathname === item.href ? "active" : ""
                  }
                >
                  {item.icon} {item.name}
                </Link>
              ))}

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
            ☰
          </button>

          <Link
            href="/"
            className={pathname === "/" ? "active" : ""}
          >
            <div>🏠</div>
          </Link>

          <Link
            href="/tieuchi"
            className={
              pathname === "/tieuchi" ? "active" : ""
            }
          >
            <div>🗂️</div>
          </Link>

          <Link
            href="/bao-cao"
            className={
              pathname === "/bao-cao" ? "active" : ""
            }
          >
            <div>📝</div>
          </Link>
          <Link
            href="/bang-diem"
            className={
              pathname === "/bang-diem" ? "active" : ""
            }
          >
            <div>📊</div>
          </Link>

          <Link
            href="/hoat-dong"
            className={
              pathname === "/hoat-dong" ? "active" : ""
            }
          >
            <div>🎯</div>
          </Link>

          <Link
            href="/thongbaouser"
            className={
              pathname === "/thongbaouser"
                ? "active"
                : ""
            }
          >
            <div>🔔</div>
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
      zIndex: 1000,
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
          ☰ Menu
        </h2>
      )}
    </div>
    {/* MENU */}
    <div
      style={{
        flex: 1,
        overflowY: "visible",
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
        if (item.name === "Minh chứng") {
          return (
            <div
              key={item.href}
              style={{ position: "relative" }}
              onMouseEnter={() => setShowProofMenu(true)}
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
                  {collapsed ? "🗂️" : "🗂️ Minh chứng"}
                </span>

                {!collapsed && <span>▶</span>}
              </Link>

              {showProofMenu && (
                <div
                  style={{
                    position: "absolute",
                    left: "100%",
                    marginLeft: 2,
                    top: 0,
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
      {sub.icon} {sub.name}
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
            {collapsed
              ? item.icon
              : `${item.icon} ${item.name}`}
          </Link>
        );
      })}
    </div>

    {/* FOOTER */}
    <div
      style={{
        marginTop: "auto",
        padding: 12,
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
    border: "none",
    background: "#858585",
    color: "#fff",
    cursor: "pointer",

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
);
}