"use client";

import { useState } from "react";
import { registerFCMToken } from "@/lib/firebase-messaging";
import { Bell, BellOff, Loader2 } from "lucide-react";

export default function NotificationToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (loading) return;

    // ==========================================
    // ĐANG BẬT → TẮT
    // ==========================================

    if (enabled) {
      setEnabled(false);
      return;
    }

    // ==========================================
    // ĐANG TẮT → BẬT
    // ==========================================

    try {
      setLoading(true);

      console.log("🔔 BẮT ĐẦU BẬT THÔNG BÁO");

      const token = await registerFCMToken();

      if (token) {
        console.log("✅ BẬT THÔNG BÁO THÀNH CÔNG");
        setEnabled(true);
      } else {
        console.log("❌ KHÔNG BẬT ĐƯỢC THÔNG BÁO");
        setEnabled(false);
      }
    } catch (error) {
      console.error(
        "❌ LỖI BẬT THÔNG BÁO:",
        error
      );

      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      style={{
        width: "100%",
        minHeight: 52,
        border: "none",
        borderRadius: 12,
        padding: "0 18px",

        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",

        cursor: loading
          ? "wait"
          : "pointer",

        background: enabled
          ? "#ecfdf5"
          : "#eff6ff",

        color: enabled
          ? "#047857"
          : "#2563eb",

        transition:
          "all .2s ease",

        opacity: loading ? 0.7 : 1,
      }}
    >
      {/* LEFT */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {loading ? (
          <Loader2
            size={21}
            style={{
              animation:
                "spin 1s linear infinite",
            }}
          />
        ) : enabled ? (
          <Bell
            size={21}
            strokeWidth={2}
          />
        ) : (
          <BellOff
            size={21}
            strokeWidth={2}
          />
        )}

        <div
          style={{
            textAlign: "left",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            {loading
              ? "Đang xử lý..."
              : enabled
              ? "Thông báo đang bật"
              : "Bật thông báo"}
          </div>

          <div
            style={{
              marginTop: 2,
              fontSize: 12,
              opacity: 0.75,
            }}
          >
            {enabled
              ? "Bạn sẽ nhận thông báo mới"
              : "Nhận thông báo khi có tin mới"}
          </div>
        </div>
      </div>

      {/* SWITCH */}

      <div
        style={{
          width: 44,
          height: 24,
          borderRadius: 999,
          background: enabled
            ? "#10b981"
            : "#d1d5db",
          padding: 3,
          transition:
            "background .2s ease",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",

            transform: enabled
              ? "translateX(20px)"
              : "translateX(0)",

            transition:
              "transform .2s ease",

            boxShadow:
              "0 1px 3px rgba(0,0,0,.2)",
          }}
        />
      </div>
    </button>
  );
}