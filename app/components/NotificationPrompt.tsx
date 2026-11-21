
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { registerFCMToken } from "@/lib/firebase-messaging";
import "./notification-prompt.css";

const NEVER_REMIND_KEY = "sv5t_no_notification_reminder";
const SESSION_DISMISS_KEY = "sv5t_notification_prompt_dismissed";

export default function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [dontRemind, setDontRemind] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      // Chỉ chạy trong ứng dụng PWA đã cài
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

      if (!isStandalone) return;

      // Không nhắc lại nếu người dùng đã chọn
      if (localStorage.getItem(NEVER_REMIND_KEY) === "true") return;

      // Không hiện lại ngay trong cùng phiên sau khi bỏ qua
      if (sessionStorage.getItem(SESSION_DISMISS_KEY) === "true") return;

      // Chỉ người dùng đã đăng nhập
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) return;

      // Nếu đã có token thì không cần nhắc
      const { data, error } = await supabase
        .from("notification_tokens")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (error || cancelled) return;

      if (data && data.length > 0) return;

      // Trễ một chút để tránh modal xuất hiện ngay khi vừa mở app
      const timer = window.setTimeout(() => {
        if (!cancelled) setShow(true);
      }, 1500);

      return () => window.clearTimeout(timer);
    }

    check();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleEnable() {
    if (loading) return;

    setLoading(true);

    try {
      const token = await registerFCMToken();

      if (!token) {
        alert("Không thể bật thông báo. Vui lòng thử lại.");
        return;
      }

      setShow(false);
      sessionStorage.setItem(SESSION_DISMISS_KEY, "true");
    } catch (error) {
      console.error("Lỗi bật thông báo:", error);
      alert("Không thể bật thông báo.");
    } finally {
      setLoading(false);
    }
  }

  function handleLater() {
    if (dontRemind) {
      localStorage.setItem(NEVER_REMIND_KEY, "true");
    }

    sessionStorage.setItem(SESSION_DISMISS_KEY, "true");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="notification-prompt-overlay">
      <div className="notification-prompt-modal">
        <div className="notification-prompt-icon">🔔</div>

        <h2>Đừng bỏ lỡ thông báo!</h2>

        <p>
          Bật thông báo để nhận tin tức, hoạt động và những cập nhật
          mới từ Sinh viên 5 Tốt BMU.
        </p>

        <button
          type="button"
          className="notification-prompt-enable"
          onClick={handleEnable}
          disabled={loading}
        >
          {loading ? "Đang bật..." : "Bật thông báo"}
        </button>

        <button
          type="button"
          className="notification-prompt-later"
          onClick={handleLater}
          disabled={loading}
        >
          Để sau
        </button>

        <label className="notification-prompt-checkbox">
          <input
            type="checkbox"
            checked={dontRemind}
            onChange={(e) => setDontRemind(e.target.checked)}
          />
          <span>Không nhắc lại</span>
        </label>
      </div>
    </div>
  );
}
