"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function BellUserTemp() {
  const [bellRotate, setBellRotate] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
  const check = () => setIsMobile(window.innerWidth <= 768);

  check();
  window.addEventListener("resize", check);

  return () => window.removeEventListener("resize", check);
}, []);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error(error);
      return;
    }

    const list = data || [];

    setNotifications(list);

    setUnreadCount(
      list.filter((item) => !item.is_read).length
    );
  }

  async function markAsRead() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    setUnreadCount(0);

    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        is_read: true,
      }))
    );
  }

  return (
    <div style={{ position: "relative" }}>
    <button
  onMouseEnter={() => setBellRotate(true)}
  onMouseLeave={() => setBellRotate(false)}
  onClick={async () => {
    setOpen(!open);

    if (!open) {
      await markAsRead();
    }
  }}
  style={{
    width: isMobile ? 32 : 50,
    height: isMobile ? 32 : 50,
    borderRadius: 12,
    border: "none",
    background: "#fff",
    boxShadow: "0 3px 10px rgba(0,0,0,.15)",
    cursor: "pointer",
    fontSize: isMobile ? 16 : 22,
  }}
>
  <span
    style={{
      display: "inline-block",
      animation: bellRotate ? "bellShake .6s ease-in-out" : "none",
      transformOrigin: "top center",
    }}
  >
    🔔
  </span>
</button>

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
          }}
        >
          {unreadCount > 5 ? "5+" : unreadCount}
        </div>
      )}

      {open && (
        <div
          style={{
            position: "absolute",
            top: 60,
            right: 0,
            width: 350,
            background: "#fff",
            borderRadius: 14,
            boxShadow: "0 8px 30px rgba(0,0,0,.18)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: 18,
              fontWeight: 700,
              fontSize: 22,
            }}
          >
            Thông báo
          </div>

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
                  padding: "14px 18px",
                  borderBottom: "1px solid #eee",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                  }}
                >
                  {item.title}
                </div>

                <div
                  style={{
                    color: "#666",
                    marginTop: 4,
                    fontSize: 14,
                  }}
                >
                  {item.content}
                </div>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: "#999",
                  }}
                >
                  {new Date(item.created_at).toLocaleString("vi-VN")
}
                </div>
              </div>
            ))
          )}
</div>
<Link
  href="/thongbaouser"
  onMouseEnter={(e) => {
    e.currentTarget.style.color = "#123bad";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.color = "#2563eb";
  }}
  style={{
    display: "block",
    borderTop: "1px solid #eee",
    padding: 16,
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: 600,
    textAlign: "center",
    transition: "color .2s ease",
  }}
>
  Xem tất cả thông báo →
</Link>
        </div>
      )}
    </div>
  );
}