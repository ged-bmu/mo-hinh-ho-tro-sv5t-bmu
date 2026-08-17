"use client";

import { useState } from "react";

export default function GoogleDriveTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const uploadFile = async () => {
    if (!file) {
      setMessage("Vui lòng chọn file");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/google-drive/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload thất bại");
      }

      setMessage(`Upload thành công: ${data.file?.name}`);
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          padding: "30px",
          border: "1px solid #ddd",
          borderRadius: "12px",
        }}
      >
        <h1>Test Google Drive</h1>

        <input
          type="file"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setMessage("");
          }}
        />

        <button
          type="button"
          onClick={uploadFile}
          disabled={!file || loading}
          style={{
            marginTop: "20px",
            padding: "10px 16px",
            cursor: !file || loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Đang upload..." : "Upload lên Google Drive"}
        </button>

        {message && (
          <p style={{ marginTop: "20px" }}>
            {message}
          </p>
        )}
      </div>
    </main>
  );
}