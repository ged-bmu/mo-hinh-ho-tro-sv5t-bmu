"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function FileItem({
  file,
  url,
  onDelete,
  onRename,
}: {
  file: any;
  url: string;
  onDelete: () => void;
  onRename: (file: any) => void;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);

  // khóa scroll khi mở modal
  useEffect(() => {
    if (previewOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [previewOpen]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "white",
        padding: "15px 20px",
        marginTop: "12px",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* LEFT */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <span>📄 {file.display_name || file.name}</span>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setPreviewOpen(true)}
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            👁 Xem
          </button>

          <button
            onClick={() => onRename(file)}
            style={{
              background: "#22c55e",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            ✍️ Đổi tên
          </button>
        </div>
      </div>

<button
  onClick={() => {
    const ok = window.confirm("Bạn có chắc muốn xóa file này không?");
    if (ok) {
      onDelete();
    }
  }}
  style={{
    border: "none",
    background: "#ef4444",
    color: "white",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  }}
>
  🗑 Xóa
</button>

      {/* MODAL PREVIEW (PORTAL) */}
{previewOpen &&
  createPortal(
    <div
      onClick={() => setPreviewOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "90%",
          height: "90%",
          background: "#fff",
          borderRadius: "12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            height: "55px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 14px",
            borderBottom: "1px solid #eee",
          }}
        >
          {/* LEFT TITLE */}
          <strong
            style={{
              fontSize: "14px",
              maxWidth: "40%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {file.display_name || file.name}
          </strong>

          {/* ACTION BUTTONS */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            
            {/* DOWNLOAD */}
          <button
  onClick={async () => {
    const res = await fetch(url);
    const blob = await res.blob();

    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = file.display_name || file.name;
    document.body.appendChild(a);
    a.click();

    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  }}
  style={{
    background: "#3b82f6",
    color: "white",
    padding: "6px 10px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
  }}
>
  ⬇ Tải về
</button>

            {/* RENAME */}
            <button
              onClick={() => onRename(file)}
              style={{
                background: "#22c55e",
                color: "white",
                border: "none",
                padding: "6px 10px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              ✍️ Đổi tên
            </button>
                {/* DELETE */}
    <button
      onClick={() => {
        const ok = confirm("Bạn có chắc muốn xóa file này không?");
        if (ok) {
          onDelete();
          setPreviewOpen(false);
        }
      }}
      style={{
        background: "#ef4444",
        color: "white",
        border: "none",
        padding: "6px 10px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "13px",
      }}
    >
      🗑 Xóa
    </button>

            {/* CLOSE */}
            <button
              onClick={() => setPreviewOpen(false)}
              style={{
                border: "none",
                background: "transparent",
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <iframe
          src={`${url}#toolbar=0`}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
          }}
        />
      </div>
    </div>,
    document.body
  )}
    </div>
  );
}