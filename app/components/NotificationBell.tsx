"use client";

import { FaBell } from "react-icons/fa";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    const { data } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("is_read", false)
      .order("created_at", {
        ascending: false,
      });

    setLogs(data || []);
    setCount(data?.length || 0);
  }

  async function markAllAsRead() {
    await supabase
      .from("activity_logs")
      .update({
        is_read: true,
      })
      .eq("is_read", false);

    setCount(0);
  }

  async function handleBellClick() {
    setOpen(!open);

    if (!open) {
      await markAllAsRead();
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "35px",
        right: "43px",
        zIndex: 999,
      }}
    >
      <div
        onClick={handleBellClick}
        style={{
          cursor: "pointer",
          position: "relative",
        }}
      >
        <FaBell
          size={22}
          color="#6b7280"
        />

        {count > 0 && (
          <div
            style={{
              position: "absolute",
              top: -8,
              right: -8,
              background: "#ef4444",
              color: "white",
              borderRadius: "999px",
              minWidth: "18px",
              height: "18px",
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "600",
            }}
          >
            {count > 5 ? "5+" : count}
          </div>
        )}
      </div>

      {open && (
        <div
style={{
  position: "absolute",
  top: "35px",
  right: 0,
  width: "380px",
  height: "500px",
  background: "white",
  borderRadius: "12px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
  padding: "15px",
  display: "flex",
  flexDirection: "column",
}}
        >
          
          <h3
            style={{
              marginBottom: "12px",
            }}
          >
            <b>Thông báo</b>
          </h3>
<div
  style={{
    flex: 1,
    overflowY: "auto",
  }}
>
          {logs.length === 0 ? (
            <div
              style={{
                color: "#64748b",
              }}
            >
              Không có thông báo mới
            </div>
          ) : (
            logs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                style={{
                  padding: "10px 0",
                  borderBottom:
                    "1px solid #e5e7eb",
                }}
              >
                <div>
<div
  style={{
    fontSize: "14px",
    color: "#111827",
    lineHeight: "1.5",
  }}
>
  <b>
    {log.ho_ten} - {log.lop}
  </b>{" "}

  {log.action_type === "upload" &&
    `vừa tải lên file "${log.target_file}"`}

  {log.action_type === "delete" &&
    `vừa xóa file "${log.target_file}"`}

  {log.action_type === "rename" &&
    `vừa đổi tên file thành "${log.target_file}"`}
</div>

  <div
    style={{
      fontSize: "12px",
      color: "#6b7280",
      marginTop: "4px",
    }}
  >
    📁 {log.target_folder}
  </div>
</div>

               <div
  style={{
    fontSize: "11px",
    color: "#9ca3af",
    marginTop: "8px",
  }}
>
  🕒{" "}
  {new Date(
    log.created_at
  ).toLocaleString("vi-VN")}
</div>
              </div>
            ))
          )}
</div>
          <div
            style={{
              marginTop: "10px",
              borderTop:
                "1px solid #e5e7eb",
              paddingTop: "10px",
            }}
          >
            <a
              href="/admin/activity"
              style={{
                color: "#2563eb",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Xem chi tiết →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}