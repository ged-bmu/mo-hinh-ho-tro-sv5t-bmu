"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { CircleHelp, X } from "lucide-react";

export default function UserGuide() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname !== "/" && pathname !== "/introduce") {
    return null;
  }

  return (
    <>
      {/* Nút ? góc dưới bên phải */}
<button
  className="user-guide-button"
  onClick={() => setOpen(true)}
  aria-label="Hướng dẫn sử dụng"
  title="Hướng dẫn sử dụng"
  style={{
    position: "fixed",
    right: "24px",
    bottom: "24px",
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    border: "1px solid #dbe3ef",
    background: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "21px",
    fontWeight: 700,
    fontFamily: "Arial, sans-serif",
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.12)",
    zIndex: 9999,
    transition: "all 0.2s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.boxShadow =
      "0 7px 20px rgba(15, 23, 42, 0.16)";
    e.currentTarget.style.borderColor = "#bfdbfe";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow =
      "0 4px 14px rgba(15, 23, 42, 0.12)";
    e.currentTarget.style.borderColor = "#dbe3ef";
  }}
>
  ?
</button>

      {/* Modal */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 10000,
          }}
        >
          {/* Nội dung modal */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "460px",
              background: "#fff",
              borderRadius: "18px",
              padding: "28px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.25)",
              position: "relative",
              textAlign: "center",
            }}
          >
            {/* Nút đóng */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Đóng"
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                border: "none",
                background: "#f1f5f9",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={19} />
            </button>

            {/* Icon */}
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <CircleHelp size={32} strokeWidth={2} />
            </div>

            {/* Tiêu đề */}
            <h2
              style={{
                margin: "0 0 10px",
                fontSize: "22px",
                fontWeight: 700,
                color: "#1e293b",
              }}
            >
              Hướng dẫn sử dụng
            </h2>

            {/* Nội dung */}
            <p
              style={{
                margin: 0,
                fontSize: "15px",
                lineHeight: 1.6,
                color: "#64748b",
              }}
            >
              Hướng dẫn sử dụng hệ thống đang được cập nhật.
              <br />
              Vui lòng quay lại sau nhé!
            </p>

            {/* Nút đóng */}
            <button
              onClick={() => setOpen(false)}
              style={{
                marginTop: "24px",
                padding: "10px 24px",
                borderRadius: "10px",
                border: "none",
                background: "#2563eb",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
}