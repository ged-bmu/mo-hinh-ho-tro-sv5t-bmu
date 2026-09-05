"use client";

import { useEffect, useState } from "react";
import Spinner from "./Spinner";
import { authFetch } from "@/lib/auth-fetch";
import Image from "next/image";

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewMimeType, setPreviewMimeType] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [zoom, setZoom] = useState(0.6); 
  const [isMobile, setIsMobile] = useState(false);
  

useEffect(() => {
  const check = () => setIsMobile(window.innerWidth <= 768);

  check();

  window.addEventListener("resize", check);

  return () => window.removeEventListener("resize", check);
}, []);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    if (previewOpen) {
      setPreviewLoading(true);
      setPreviewError(null);
      setPreviewUrl(null);
      setPreviewText(null);
      setPreviewMimeType(null);

      authFetch(url)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Không thể tải file");
          }

          const blob = await response.blob();
          const mimeType = blob.type || file.mime_type || "application/octet-stream";

          if (mimeType.startsWith("text/")) {
            const text = await blob.text();

            if (!cancelled) {
              setPreviewText(text);
              setPreviewMimeType(mimeType);
            }
          } else if (mimeType === "application/pdf" || mimeType.startsWith("image/")) {
            objectUrl = window.URL.createObjectURL(blob);

            if (!cancelled) {
              setPreviewUrl(objectUrl);
              setPreviewMimeType(mimeType);
            }
          } else if (!cancelled) {
            setPreviewMimeType(mimeType);
          }

          if (!cancelled) {
            setPreviewLoading(false);
          }
        })
        .catch((error) => {
          console.error("Preview file error:", error);
          if (!cancelled) {
            setPreviewError("Không thể tải nội dung file.");
            setPreviewLoading(false);
          }
        });
    } else {
      setPreviewUrl(null);
      setPreviewText(null);
      setPreviewMimeType(null);
      setPreviewLoading(false);
      setPreviewError(null);
    }

    return () => {
      cancelled = true;
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [previewOpen, url]);

  return (
    <div
      style={{
        background: "white",
        padding: "15px 20px",
        marginTop: "12px",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* ================= DÒNG FILE ================= */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? "12px" : "16px",
          width: "100%",
        }}
      >
        {/* LEFT */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            gap: "10px",
            flex: 1,
            minWidth: 0,
          }}
        >
          <span
            style={{
              width: "100%",
              overflowWrap: "anywhere",
              wordBreak: "break-all",
            }}
          >
            📄 {file.display_name || file.name}
          </span>

          {/* CÁC NÚT */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              width: isMobile ? "100%" : "auto",
              flexShrink: 0,
            }}
          >
            {/* XEM */}
            <button
              onClick={() => setPreviewOpen((prev) => !prev)}
              style={{
                background: previewOpen ? "#64748b" : "#2563eb",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: "8px",
                cursor: "pointer",
                width: isMobile ? "calc(50% - 4px)" : "auto",
                whiteSpace: "nowrap",
              }}
            >
              <Image
                src="/iconxem2.png"
                width={20}
                height={20}
                alt="Xem"
                style={{
                  display: "inline-block",
                  verticalAlign: "middle",
                  marginRight: 4,
                }}
              />
              {previewOpen ? "Ẩn xem" : "Xem"}
            </button>

            {/* ĐỔI TÊN */}
            <button
              onClick={() => onRename(file)}
              style={{
                background: "#22c55e",
                color: "white",
                border: "none",
                padding: isMobile ? "4px 8px" : "6px 12px",
                borderRadius: "8px",
                cursor: "pointer",
                width: isMobile ? "calc(50% - 4px)" : "auto",
              }}
            >
              <Image
                src="/iconchinhsua.png"
                width={20}
                height={20}
                alt="Đổi tên"
                style={{
                  display: "inline-block",
                  verticalAlign: "middle",
                  marginRight: 4,
                }}
              />
              Đổi tên
            </button>
          </div>
        </div>

        {/* XÓA */}
        <button
          disabled={deleting}
          onClick={async () => {
            const ok = window.confirm("Bạn có chắc muốn xóa file này không?");
            if (!ok) return;

            setDeleting(true);

            try {
              await onDelete();
            } finally {
              setDeleting(false);
            }
          }}
          style={{
            border: "none",
            background: "#ef4444",
            color: "white",
            padding: "8px 12px",
            borderRadius: "8px",
            cursor: deleting ? "not-allowed" : "pointer",
            opacity: deleting ? 0.7 : 1,
            width: isMobile ? "100%" : "auto",
            marginTop: isMobile ? "8px" : 0,
          }}
        >
          {deleting ? (
            <Spinner size={18} />
          ) : (
            <>
              <Image
                src="/iconthungrac.png"
                width={20}
                height={20}
                alt="Xóa"
                style={{
                  display: "inline-block",
                  verticalAlign: "middle",
                  marginRight: 4,
                }}
              />
              Xóa
            </>
          )}
        </button>
      </div>

      {/* ================= PREVIEW SỔ XUỐNG ================= */}
      {previewOpen && (
        <div
          style={{
            marginTop: "14px",
            width: "100%",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            overflow: "hidden",
            background: "#fff",
          }}
        >
          {/* HEADER PREVIEW */}
          <div
            style={{
              minHeight: "55px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 14px",
              borderBottom: "1px solid #eee",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {/* TẢI VỀ */}
              <button
                onClick={async () => {
                  const res = await authFetch(url);
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
            </div>
          </div>

          {/* NỘI DUNG FILE */}
          <div
            style={{
              width: "100%",
              height: isMobile ? "60vh" : "75vh",
              overflow: "auto",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
            }}
          >
            {previewLoading ? (
              <div
                style={{
                  padding: "40px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Spinner size={34} />
              </div>
            ) : previewError ? (
              <div
                style={{
                  padding: "40px",
                  color: "#b91c1c",
                }}
              >
                {previewError}
              </div>
            ) : previewText !== null ? (
              <pre
                style={{
                  width: "100%",
                  padding: "24px",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  textAlign: "left",
                }}
              >
                {previewText}
              </pre>
            ) : previewMimeType?.startsWith("image/") &&
              previewUrl ? (
              <img
                src={previewUrl}
                alt={file.display_name || file.name}
                style={{
                  maxWidth: `${zoom * 100}%`,
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
              />
            ) : previewMimeType === "application/pdf" &&
              previewUrl ? (
              <iframe
                src={`${previewUrl}#toolbar=0`}
                title={file.display_name || file.name}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
              />
            ) : (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#4b5563",
                }}
              >
                <p>
                  Định dạng này không hỗ trợ xem trực tiếp trong trình duyệt.
                </p>

                <button
                  onClick={async () => {
                    const response = await authFetch(url);

                    if (!response.ok) {
                      setPreviewError("Không thể tải file xuống.");
                      return;
                    }

                    const blob = await response.blob();
                    const blobUrl =
                      window.URL.createObjectURL(blob);

                    const link = document.createElement("a");
                    link.href = blobUrl;
                    link.download =
                      file.display_name || file.name;
                    link.click();

                    window.URL.revokeObjectURL(blobUrl);
                  }}
                  style={{
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  Tải file xuống
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}