"use client";

import { useState } from "react";
import requestNotificationPermission from "@/lib/messaging";

export default function NotificationsPage() {
  const [status, setStatus] = useState("Chưa bật thông báo");

  async function handleEnableNotification() {
    try {
      setStatus("Đang xử lý...");

      const token = await requestNotificationPermission();

      if (token) {
        setStatus("Đã bật thông báo ✅");

        console.log("Token:", token);
      } else {
        setStatus(
          "❌ Không lấy được FCM token. Mở Console để xem lỗi."
        );
      }
    } catch (error) {
      console.error("LỖI BẬT THÔNG BÁO:", error);

      setStatus(
        `❌ Lỗi: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`
      );
    }
  }

  return (
    <div
      style={{
        padding: 30,
      }}
    >
      <h1>🔔 Quản lý thông báo</h1>

      <p
        style={{
          marginTop: 15,
          marginBottom: 20,
        }}
      >
        {status}
      </p>

      <button
        onClick={handleEnableNotification}
        style={{
          padding: "12px 20px",
          borderRadius: 10,
          background: "#2563eb",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        Bật thông báo
      </button>
    </div>
  );
}