
"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";
import ReportEditor from "./ReportEditor";
import Spinner from "./Spinner";

type Props = {
  file: any;
  url: string;
  orderNumber: number;
  reportContent: string;
  onSave: (newName: string, content: string) => Promise<void>;
  onClose: () => void;
};

export default function EvidenceReportModal({
  file,
  url,
  orderNumber,
  reportContent,
  onSave,
  onClose,
}: Props) {
  const originalName =
    file.display_name || file.storage_name || file.name || "";

  const [fileName, setFileName] = useState(originalName);
  const [content, setContent] = useState(reportContent || "");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl = "";
    let cancelled = false;

    async function loadPreview() {
      try {
        setLoading(true);
        setError("");
        setPreviewUrl("");
        setPreviewText("");

        const response = await authFetch(url);

        if (!response.ok) {
          throw new Error("Không thể tải file minh chứng.");
        }

        const blob = await response.blob();
        const type =
          blob.type ||
          file.mime_type ||
          "application/octet-stream";

        if (cancelled) return;

        setMimeType(type);

        if (type.startsWith("text/")) {
          setPreviewText(await blob.text());
        } else {
          objectUrl = URL.createObjectURL(blob);
          setPreviewUrl(objectUrl);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Không thể xem file."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPreview();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, file]);

  async function handleSave() {
    const trimmedName = fileName.trim();

    if (!trimmedName) {
      alert("Vui lòng nhập tên file.");
      return;
    }

    setSaving(true);

    try {
      await onSave(trimmedName, content);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Không thể lưu thay đổi."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "12px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "950px",
          maxHeight: "94vh",
          overflowY: "auto",
          background: "white",
          borderRadius: "14px",
          padding: "20px",
          boxShadow: "0 10px 35px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "20px" }}>
            Chỉnh sửa minh chứng số{" "}
            {String(orderNumber).padStart(2, "0")}
          </h2>

          <button
            onClick={onClose}
            disabled={saving}
            style={{
              border: "none",
              background: "#f1f5f9",
              borderRadius: "8px",
              padding: "7px 12px",
              cursor: "pointer",
              fontSize: "18px",
            }}
          >
            ✕
          </button>
        </div>

        <label
          style={{
            display: "block",
            fontWeight: 600,
            marginBottom: "7px",
          }}
        >
          Tên file minh chứng
        </label>

        <input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          disabled={saving}
          placeholder="Nhập tên file..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "11px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "15px",
            marginBottom: "18px",
            color: "#111827",
            background: "white",
          }}
        />

        <label
          style={{
            display: "block",
            fontWeight: 600,
            marginBottom: "8px",
          }}
        >
          Nội dung báo cáo minh chứng
        </label>

        <ReportEditor
          value={content}
          onChange={setContent}
        />

        <h3 style={{ margin: "22px 0 10px" }}>
          📄 Xem file minh chứng
        </h3>

        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            minHeight: "300px",
            height: "55vh",
            overflow: "auto",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#f8fafc",
          }}
        >
          {loading ? (
            <Spinner size={34} />
          ) : error ? (
            <span style={{ color: "#b91c1c", padding: "20px" }}>
              {error}
            </span>
          ) : mimeType === "application/pdf" ? (
            <iframe
              src={previewUrl}
              title="Xem minh chứng"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
            />
          ) : mimeType.startsWith("image/") ? (
            <img
              src={previewUrl}
              alt="Minh chứng"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          ) : previewText ? (
            <pre
              style={{
                width: "100%",
                padding: "20px",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              {previewText}
            </pre>
          ) : (
            <div style={{ padding: "20px", textAlign: "center" }}>
              Không hỗ trợ xem trực tiếp định dạng này.
              <br />
              <a
                href={previewUrl}
                download={file.display_name || file.storage_name}
                style={{ color: "#2563eb" }}
              >
                Tải file xuống
              </a>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "18px",
          }}
        >
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: "9px 16px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              background: "white",
              cursor: "pointer",
            }}
          >
            Đóng
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "9px 18px",
              border: "none",
              borderRadius: "8px",
              background: "#2563eb",
              color: "white",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Đang lưu..." : "💾 Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
