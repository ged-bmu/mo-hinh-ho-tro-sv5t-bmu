"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function NotificationCard({ isMobile }: { isMobile: boolean }) {
  if (isMobile) return null;
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    loadNotifications();

    let channel: any = null;
    let cancelled = false;

    async function subscribeNotifications() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) return;

      const newChannel = supabase
        .channel(`home-notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications((prev) =>
              [payload.new, ...prev].slice(0, 3)
            );
          }
        );

      if (cancelled) {
        await supabase.removeChannel(newChannel);
        return;
      }

      channel = newChannel;

      channel.subscribe((status: string) => {
        console.log("📡 Notifications realtime:", status);
      });
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
      .limit(3);

    if (error) {
      console.error("Lỗi tải thông báo:", error);
      return;
    }

    setNotifications(data || []);
  }

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 4px 18px rgba(0,0,0,.08)",
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: "18px 20px",
          borderBottom: "1px solid #eee",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 20 }}>
          🔔
        </span>

        <span
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "#0F172A",
          }}
        >
          Thông báo
        </span>
      </div>

      {/* DANH SÁCH 3 THÔNG BÁO */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
        }}
      >
        {notifications.length === 0 ? (
          <div
            style={{
              padding: 20,
              color: "#64748B",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            Không có thông báo mới.
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid #F1F5F9",
              }}
            >
              {/* TIÊU ĐỀ */}
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0F172A",
                  marginBottom: 4,
                }}
              >
                {item.title}
              </div>

              {/* NỘI DUNG */}
              <div
                style={{
                  fontSize: 13,
                  color: "#64748B",
                  lineHeight: 1.4,
                }}
              >
                {item.content}
              </div>

              {/* THỜI GIAN */}
              <div
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  color: "#94A3B8",
                }}
              >
                {new Date(item.created_at).toLocaleString("vi-VN")}
              </div>
            </div>
          ))
        )}
      </div>

      {/* XEM TẤT CẢ */}
      <Link
        href="/thongbaouser"
        style={{
          display: "block",
          padding: "14px",
          borderTop: "1px solid #eee",
          color: "#2563EB",
          textDecoration: "none",
          fontSize: 14,
          fontWeight: 700,
          textAlign: "center",
        }}
      >
        Xem tất cả →
      </Link>
    </div>
  );
}