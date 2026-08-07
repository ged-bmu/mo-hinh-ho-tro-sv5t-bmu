"use client";

import { useEffect, useState } from "react";

type DriveItem = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

const ROOT_FOLDER_ID = "15ombdT7_XGemlGQA53Vr8Emm_Lp__3v8";

export default function DriveProfileModal({
  open,
  onClose,
}: Props) {
  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DriveItem | null>(null);

  useEffect(() => {
    if (!open) return;

    loadFolder(ROOT_FOLDER_ID);
  }, [open]);

  async function loadFolder(folderId: string) {
    try {
      setLoading(true);
      setSelectedFile(null);

      const res = await fetch(
  `/api/drive-files?folderId=${encodeURIComponent(folderId)}`
);

      if (!res.ok) {
        throw new Error("Không thể tải Google Drive");
      }

      const data = await res.json();

      setItems(data);
    } catch (error) {
      console.error("Lỗi tải Google Drive:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function openItem(item: DriveItem) {
    // Nếu là folder → đi vào folder ngay trong modal
    if (
      item.mimeType === "application/vnd.google-apps.folder"
    ) {
      loadFolder(item.id);
      return;
    }

    // Nếu là file → mở preview NGAY TRONG MODAL
    setSelectedFile(item);
  }

  function getPreviewUrl(item: DriveItem) {
    return `https://drive.google.com/file/d/${item.id}/preview`;
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "min(1100px, 100%)",
          height: "min(850px, 92vh)",
          background: "#fff",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER MODAL */}
        <div
          style={{
            height: 58,
            minHeight: 58,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 14px 0 18px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {/* QUAY LẠI */}
            <button
              onClick={() => {
                // Nếu đang xem file thì quay lại danh sách
                if (selectedFile) {
                  setSelectedFile(null);
                  return;
                }

                // Nếu đang ở folder con thì dùng API/history sau
              }}
              disabled={!selectedFile}
              style={{
                width: 36,
                height: 36,
                border: "none",
                borderRadius: 8,
                background: "transparent",
                cursor: selectedFile
                  ? "pointer"
                  : "default",
                fontSize: 24,
                color: selectedFile ? "#333" : "#bbb",
              }}
              title="Quay lại"
            >
              ←
            </button>

            <span
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#222",
              }}
            >
              📂 Hồ sơ mẫu
            </span>
          </div>

          {/* ĐÓNG */}
          <button
            onClick={onClose}
            style={{
              width: 38,
              height: 38,
              border: "none",
              borderRadius: 8,
              background: "transparent",
              cursor: "pointer",
              fontSize: 28,
              color: "#555",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Đóng hồ sơ mẫu"
          >
            ×
          </button>
        </div>

        {/* NỘI DUNG */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {selectedFile ? (
            /* =========================
               XEM FILE TRONG MODAL
               ========================= */
            <iframe
              src={getPreviewUrl(selectedFile)}
              title={selectedFile.name}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
              allow="autoplay"
            />
          ) : (
            /* =========================
               DANH SÁCH FILE / FOLDER
               ========================= */
            <div
              style={{
                height: "100%",
                overflowY: "auto",
                padding: 20,
              }}
            >
              {loading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: 40,
                    color: "#666",
                  }}
                >
                  Đang tải hồ sơ...
                </div>
              ) : items.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: 40,
                    color: "#666",
                  }}
                >
                  Không có tệp nào.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: 16,
                  }}
                >
                  {items.map((item) => {
                    const isFolder =
                      item.mimeType ===
                      "application/vnd.google-apps.folder";

                    return (
                      <button
                        key={item.id}
                        onClick={() => openItem(item)}
                        style={{
                          border:
                            "1px solid #e5e7eb",
                          borderRadius: 12,
                          background: "#fff",
                          padding: 14,
                          cursor: "pointer",
                          textAlign: "left",
                          transition:
                            "all .2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform =
                            "translateY(-2px)";
                          e.currentTarget.style.boxShadow =
                            "0 6px 18px rgba(0,0,0,0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform =
                            "translateY(0)";
                          e.currentTarget.style.boxShadow =
                            "none";
                        }}
                      >
                        {/* ICON / THUMBNAIL */}
                        <div
                          style={{
                            height: 130,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 10,
                            background: "#f8fafc",
                            borderRadius: 8,
                            overflow: "hidden",
                          }}
                        >
                          {item.thumbnailLink &&
                          !isFolder ? (
                            <img
                              src={item.thumbnailLink}
                              alt=""
                              style={{
                                maxWidth: "100%",
                                maxHeight:
                                  "100%",
                                objectFit:
                                  "contain",
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                fontSize: 52,
                              }}
                            >
                              {isFolder
                                ? "📁"
                                : "📄"}
                            </span>
                          )}
                        </div>

                        {/* TÊN */}
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#222",
                            lineHeight: 1.4,
                            wordBreak:
                              "break-word",
                          }}
                        >
                          {item.name}
                        </div>

                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 12,
                            color: "#777",
                          }}
                        >
                          {isFolder
                            ? "Mở thư mục"
                            : "Xem tệp"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}