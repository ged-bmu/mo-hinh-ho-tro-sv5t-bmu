"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { LogOut, ChevronLeft } from "lucide-react";

export default function SidebarChutichhsv() {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();

    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const menus = [
    {
      name: "Trang chủ",
      icon: "🏠",
      href: "/chutichhsv",
    },
    {
      name: "Quản lý Ban Chấp hành",
      icon: "👥",
      href: "/admin/accounts",
    },
    {
      name: "Xét duyệt hồ sơ SV5T",
      icon: "📋",
      href: "/chutichhsv/xetduyet",
    },
    {
      name: "Báo cáo & thống kê",
      icon: "📊",
      href: "/chutichhsv/baocao",
    },
    {
      name: "Đổi mật khẩu",
      icon: "🔑",
      href: "/doi-mat-khau",
    },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/introduce";
  }

  // Chờ client mount để tránh Hydration Error
  if (!mounted) {
    return null;
  }

  // =========================================================
  // MOBILE
  // =========================================================

  if (isMobile) {
    return (
      <>
        {mobileMenu && (
          <div
            onClick={() => setMobileMenu(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              zIndex: 99999,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "280px",
                background: "#fff",
                boxShadow: "4px 0 20px rgba(0,0,0,0.15)",
                padding: "20px 12px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* HEADER */}

              <div
                style={{
                  padding: "15px 10px 25px",
                  textAlign: "center",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "#1e3a8a",
                  }}
                >
                  ☰ Menu
                </h2>
              </div>

              {/* MENU */}

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  flex: 1,
                  overflowY: "auto",
                }}
              >
                {menus.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/chutichhsv" &&
                      pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenu(false)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 12,
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: active
                          ? "#2563eb"
                          : "transparent",
                        color: active ? "#fff" : "#111",
                        fontWeight: active ? 600 : 500,
                        transition: ".25s",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "21px",
                          width: "28px",
                          minWidth: "28px",
                          textAlign: "center",
                          lineHeight: 1,
                        }}
                      >
                        {item.icon}
                      </span>

                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              {/* ĐĂNG XUẤT */}

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
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  <LogOut
                    size={20}
                    style={{
                      transform: "scaleX(-1)",
                    }}
                  />

                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NÚT MỞ MENU */}

        {!mobileMenu && (
          <button
            onClick={() => setMobileMenu(true)}
            style={{
              position: "fixed",
              left: 15,
              top: 105,
              width: 45,
              height: 45,
              borderRadius: 12,
              border: "none",
              background: "#2563eb",
              color: "#fff",
              cursor: "pointer",
              fontSize: 22,
              zIndex: 9998,
              boxShadow:
                "0 4px 12px rgba(37,99,235,.25)",
            }}
          >
            ☰
          </button>
        )}
      </>
    );
  }

  // =========================================================
  // DESKTOP
  // =========================================================

  return (
    <aside
      style={{
        width: collapsed ? "80px" : "280px",
        transition: "0.3s",

        height: "calc(100dvh - 90px)",
        maxHeight: "calc(100dvh - 90px)",

        position: "sticky",
        top: 0,

        flexShrink: 0,
        alignSelf: "flex-start",

        background: "#fff",
        borderRight: "1px solid #e5e7eb",

        display: "flex",
        flexDirection: "column",

        overflow: "visible",

        zIndex: 9998,

        boxShadow:
          "2px 0 10px rgba(15,23,42,0.04)",
      }}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

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
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: "#1e3a8a",
            }}
          >
            ☰ Menu
          </h2>
        )}
      </div>

      {/* =====================================================
          MENU
      ===================================================== */}

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
          const active =
            pathname === item.href ||
            (item.href !== "/chutichhsv" &&
              pathname.startsWith(item.href));

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

                  if (!collapsed) {
                    e.currentTarget.style.transform =
                      "translateX(6px)";
                  }
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background =
                    "transparent";

                  e.currentTarget.style.color =
                    "#111";

                  e.currentTarget.style.transform =
                    "translateX(0)";
                }
              }}
              style={{
                minHeight: "48px",

                padding: "12px 14px",

                borderRadius: 12,

                textDecoration: "none",

                display: "flex",
                alignItems: "center",

                justifyContent: collapsed
                  ? "center"
                  : "flex-start",

                gap: 10,

                background: active
                  ? "#2563eb"
                  : "transparent",

                color: active ? "#fff" : "#111",

                transition: ".25s",

                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  fontSize: "22px",
                  width: "28px",
                  minWidth: "28px",
                  textAlign: "center",
                  lineHeight: 1,
                }}
              >
                {item.icon}
              </span>

              {!collapsed && (
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: active ? 600 : 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

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

            padding: collapsed
              ? "14px 8px"
              : "14px",

            borderRadius: 12,

            cursor: "pointer",

            display: "flex",
            justifyContent: "center",
            alignItems: "center",

            gap: 8,

            transition: ".25s",

            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              "#dc2626";

            if (!collapsed) {
              e.currentTarget.style.transform =
                "translateX(3px)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              "#ef4444";

            e.currentTarget.style.transform =
              "translateX(0)";
          }}
        >
          <LogOut
            size={20}
            style={{
              transform: "scaleX(-1)",
              flexShrink: 0,
            }}
          />

          {!collapsed && "Đăng xuất"}
        </button>
      </div>

      {/* =====================================================
          NÚT THU / MỞ
      ===================================================== */}

      <button
        type="button"
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

          boxShadow:
            "0 2px 8px rgba(0,0,0,0.25)",

          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ChevronLeft
          size={18}
          style={{
            transform: collapsed
              ? "rotate(180deg)"
              : "rotate(0deg)",

            transition: "0.3s",
          }}
        />
      </button>
    </aside>
  );
}