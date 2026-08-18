"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Bell } from "lucide-react";

export default function BellUserTemp() {
  const [bellRotate, setBellRotate] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  // =====================================================
  // MOBILE
  // =====================================================

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    check();

    window.addEventListener("resize", check);

    return () => {
      window.removeEventListener("resize", check);
    };
  }, []);

  // =====================================================
  // LOAD NOTIFICATIONS
  // =====================================================

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        })
        .limit(5);

      if (error) {
        console.error(
          "❌ Lỗi load notifications:",
          error
        );
        return;
      }

      const list = data || [];

      setNotifications(list);

      setUnreadCount(
        list.filter(
          (item) => !item.is_read
        ).length
      );
    } catch (error) {
      console.error(
        "❌ Lỗi load notifications:",
        error
      );
    }
  }

  // =====================================================
  // REALTIME
  // =====================================================

  useEffect(() => {
    let channel: any = null;
    let cancelled = false;

    async function subscribeNotifications() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) return;

      const newChannel = supabase
        .channel(
          `notifications-realtime-${user.id}`
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log(
              "🔔 Có thông báo mới:",
              payload.new
            );

            setNotifications((prev) =>
              [payload.new, ...prev].slice(0, 5)
            );

            setUnreadCount(
              (prev) => prev + 1
            );

            setBellRotate(true);

            setTimeout(() => {
              setBellRotate(false);
            }, 700);
          }
        );

      if (cancelled) {
        await supabase.removeChannel(
          newChannel
        );
        return;
      }

      channel = newChannel;

      channel.subscribe(
        (status: string) => {
          console.log(
            "📡 Notifications realtime:",
            status
          );
        }
      );
    }

    subscribeNotifications();

    return () => {
      cancelled = true;

      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, []);

  // =====================================================
  // MARK AS READ
  // =====================================================

  async function markAsRead() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        console.error(
          "❌ Lỗi mark notification:",
          error
        );
        return;
      }

      setUnreadCount(0);

      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          is_read: true,
        }))
      );
    } catch (error) {
      console.error(
        "❌ Lỗi mark notification:",
        error
      );
    }
  }

  // =====================================================
  // OPEN / CLOSE NOTIFICATION
  // =====================================================

  async function handleBellClick() {
    const next = !open;

    setBellRotate(true);
    setOpen(next);

    if (next) {
      await markAsRead();
    }

    setTimeout(() => {
      setBellRotate(false);
    }, 700);
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        position: "relative",
      }}
    >
      {/* ================================================= */}
      {/* BELL BUTTON */}
      {/* ================================================= */}

      <button
        type="button"
        onMouseEnter={() =>
          setBellRotate(true)
        }
        onMouseLeave={() =>
          setBellRotate(false)
        }
        onClick={handleBellClick}
        style={{
          width: isMobile ? 36 : 42,
          height: isMobile ? 36 : 42,
          borderRadius: isMobile ? 10 : 11,
          border: "none",
          background: "#fff",
          boxShadow:
            "0 2px 8px rgba(0,0,0,.12)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            animation: bellRotate
              ? "bellShake .55s ease-in-out"
              : "none",
            transformOrigin: "top center",
          }}
        >
          <Bell
            size={isMobile ? 19 : 21}
            strokeWidth={2}
            color="#6b7280"
          />
        </span>
      </button>

      {/* ================================================= */}
      {/* UNREAD BADGE */}
      {/* ================================================= */}

      {unreadCount > 0 && (
        <div
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            minWidth: 20,
            height: 20,
            padding: "0 6px",
            background: "#ef4444",
            color: "#fff",
            borderRadius: 999,
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            pointerEvents: "none",
          }}
        >
          {unreadCount > 5
            ? "5+"
            : unreadCount}
        </div>
      )}

      {/* ================================================= */}
      {/* NOTIFICATION DROPDOWN */}
      {/* ================================================= */}

      {open && (
        <div
          style={{
            position: "absolute",
            top: 60,
            right: 0,
            width: isMobile
              ? "min(350px, calc(100vw - 24px))"
              : 350,
            background: "#fff",
            borderRadius: 14,
            boxShadow:
              "0 8px 30px rgba(0,0,0,.18)",
            overflow: "hidden",
            zIndex: 9999,
          }}
        >
          {/* HEADER */}

          <div
            style={{
              padding: 18,
              fontWeight: 700,
              fontSize: 22,
            }}
          >
            Thông báo
          </div>

          {/* LIST */}

          <div
            style={{
              maxHeight: 320,
              overflowY: "auto",
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: 20,
                  color: "#666",
                }}
              >
                Không có thông báo mới.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding:
                      "14px 18px",
                    borderBottom:
                      "1px solid #eee",
                    background: item.is_read
                      ? "#fff"
                      : "#f8faff",
                  }}
                >
                  {/* TITLE */}

                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 15,
                      color: "#222",
                    }}
                  >
                    {item.type ===
                    "general"
                      ? "Có thông báo chung mới."
                      : item.title}
                  </div>

                  {/* CONTENT */}

                  <div
                    style={{
                      color: "#666",
                      marginTop: 4,
                      fontSize: 14,
                      lineHeight: 1.5,
                    }}
                  >
                    {item.type ===
                    "general"
                      ? "Vui lòng xem chi tiết tại mục Thông tin chung ở Trang chủ."
                      : item.content}
                  </div>

                  {/* TIME */}

                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      color: "#999",
                    }}
                  >
                    {new Date(
                      item.created_at
                    ).toLocaleString(
                      "vi-VN"
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ALL NOTIFICATIONS */}

          <Link
            href="/thongbaouser"
            style={{
              display: "block",
              borderTop:
                "1px solid #eee",
              padding: 16,
              color: "#2563eb",
              textDecoration: "none",
              fontWeight: 600,
              textAlign: "center",
              transition:
                "color .2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color =
                "#123bad";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color =
                "#2563eb";
            }}
          >
            Xem tất cả thông báo →
          </Link>
        </div>
      )}
    </div>
  );
}