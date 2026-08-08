"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Criteria = {
  id: number;
  title: string;
  content: string;
  updated_at: string;
  type: "school" | "province" | "central" | "update";
};

type CriteriaHeader = {
  id: number;
  type: "school" | "province" | "central" | "update";
  title: string;
  period: string;
  decision: string;
  description: string;
  update_note: string;
  updated_at: string;
};

type TabType = "school" | "province" | "central" | "update";

export default function CriteriaModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [isMobile, setIsMobile] = useState(false);

  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [header, setHeader] = useState<CriteriaHeader | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [tab, setTab] = useState<TabType>("school");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);

    check();
    window.addEventListener("resize", check);

    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    loadData();
  }, [tab]);

  async function loadData() {
    // =========================
    // LẤY THÔNG TIN CHUNG
    // =========================
    const { data: headerData, error: headerError } = await supabase
      .from("criteria_headers")
      .select("*")
      .eq("type", tab)
      .single();

    if (headerError) {
      console.error("Lỗi tải thông tin tiêu chuẩn:", headerError);
      setHeader(null);
    } else {
      setHeader(headerData as CriteriaHeader);
    }

    // =========================
    // LẤY NỘI DUNG TIÊU CHÍ
    // =========================
    const { data, error } = await supabase
      .from("criteria_contents")
      .select("*")
      .eq("type", tab)
      .order("id");

    if (error) {
      console.error("Lỗi tải tiêu chí:", error);
      return;
    }

    setCriteria((data ?? []) as Criteria[]);
  }

  const currentData = criteria.filter((item) => item.type === tab);

  const tabs = [
    {
      key: "school",
      label: "Cấp Trường",
    },
    {
      key: "province",
      label: "Cấp Tỉnh",
    },
    {
      key: "central",
      label: "Cấp Trung ương",
    },
    {
      key: "update",
      label: "Cập nhật mới",
    },
  ];

  const levelLabel =
    tab === "school"
      ? "Cấp Trường"
      : tab === "province"
      ? "Cấp Tỉnh"
      : tab === "central"
      ? "Cấp Trung ương"
      : "Cập nhật mới";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: isMobile ? 10 : 30,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: isMobile ? 14 : 20,
          width: "100%",
          maxWidth: isMobile ? "100%" : 1200,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: isMobile ? 16 : 35,
        }}
      >
        {/* =========================
            HEADER + TABS
        ========================= */}

        <div
          style={{
            position: "sticky",
            top: -35,
            zIndex: 100,
            background: "#fff",

            margin: isMobile
              ? "-16px -16px 20px"
              : "-35px -35px 25px",

            padding: isMobile
              ? "16px 16px 12px"
              : "35px 35px 16px",

            borderBottom: "1px solid #eee",
          }}
        >
          {/* Tiêu đề + nút đóng */}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: isMobile ? 19 : 28,
                  lineHeight: 1.4,
                  color: "#2563eb",
                }}
              >
                📑 Tiêu chuẩn Sinh viên 5 tốt  {levelLabel}
     
              </h1>

              {/* =========================
                  THÔNG TIN TIÊU CHUẨN
              ========================= */}

              {header && tab !== "update" && (
                <div
                  style={{
                    marginTop: 8,
                    paddingRight: 10,
                  }}
                >

                  {/* Năm học / giai đoạn */}

                  {header.period && (
                    <div
                      style={{
                        marginTop: 3,
                        fontSize: isMobile ? 13 : 15,
                        color: "#334155",
                        fontWeight: 600,
                      }}
                    >
                      {header.period}
                    </div>
                  )}

                  {/* Quyết định */}

                  {header.decision && (
                    <div
                      style={{
                        marginTop: 3,
                        fontSize: isMobile ? 12 : 14,
                        color: "#64748b",
                        fontStyle: "italic",
                        lineHeight: 1.5,
                      }}
                    >
                      {header.decision}{" "}
                      {tab === "school"
                        ? "của Ban Chấp hành Hội Sinh viên Việt Nam Trường Đại học Y Dược Buôn Ma Thuột"
                        : tab === "province"
                        ? "của Ban Chấp hành Hội Sinh viên Việt Nam Tỉnh Đắk Lắk"
                        : "của Ban Chấp hành Trung ương Hội Sinh viên Việt Nam"}
                    </div>
                  )}

                  {/* Mô tả */}

                  {header.description && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: isMobile ? 12 : 14,
                        color: "#475569",
                        lineHeight: 1.6,
                      }}
                    >
                      {header.description}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              style={{
                width: 40,
                height: 40,
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                background: "#f3f4f6",
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>

          {/* =========================
              TABS
          ========================= */}

          <div
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              whiteSpace: "nowrap",
              marginTop: 25,
              marginBottom: 0,
              paddingBottom: 0,
              borderBottom: "1px solid #eee",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as TabType)}
                style={{
                  minWidth: isMobile ? 120 : 150,
                  padding: "10px 18px",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  transition: ".25s",
                  fontWeight: 600,
                  background:
                    tab === t.key ? "#0055ff" : "#f3f4f6",
                  color:
                    tab === t.key ? "#fff" : "#333",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* =========================
            NỘI DUNG
        ========================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 22,
          }}
        >
          {tab === "update" ? (
            <div
              style={{
                textAlign: "left",
                padding: isMobile ? 18 : 25,
                background: "#fafafa",
                borderRadius: 16,
                boxShadow: "0 6px 20px rgba(0,0,0,.06)",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: isMobile ? 18 : 22,
                  color: "#2563eb",
                }}
              >
                {header?.title || "Cập nhật mới"}
              </h2>

              <div
                style={{
                  marginTop: 12,
                  lineHeight: 1.8,
                  whiteSpace: "pre-wrap",
                  fontSize: isMobile ? 15 : 16,
                }}
              >
                {header?.update_note?.trim()
                  ? header.update_note
                  : "Chưa có nội dung cập nhật."}
              </div>

              {header?.updated_at && (
                <div
                  style={{
                    marginTop: 20,
                    color: "#888",
                    fontSize: isMobile ? 12 : 14,
                  }}
                >
                  Cập nhật:{" "}
                  {new Date(header.updated_at).toLocaleString(
                    "vi-VN"
                  )}
                </div>
              )}
            </div>
          ) : currentData.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#888",
                fontSize: isMobile ? 15 : 17,
                background: "#fafafa",
                borderRadius: 16,
              }}
            >
              Chưa có nội dung.
            </div>
          ) : (
            currentData.map((item) => {
  const isExpanded = expandedItems[item.id] ?? false;

  return (
    <div
      key={item.id}
      style={{
        borderRadius: 18,
        padding: isMobile ? 16 : 25,
        background: "#fafafa",
        boxShadow: "0 6px 20px rgba(0,0,0,.08)",
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: isMobile ? 18 : 22,
          color: "#d61f69",
        }}
      >
        {item.title}
      </h2>

      <div
        style={{
          marginTop: 12,
          lineHeight: 1.8,
          whiteSpace: "pre-wrap",
          fontSize: isMobile ? 15 : 16,

          // Chỉ thu gọn trên điện thoại
          ...(isMobile && !isExpanded
            ? {
                maxHeight: "9em",
                overflow: "hidden",
                position: "relative",
              }
            : {}),
        }}
      >
        {item.content?.trim()
          ? item.content
          : "Chưa cập nhật."}
      </div>

      {/* Nút Xem thêm / Thu gọn - chỉ hiện trên điện thoại */}

      {isMobile && item.content?.trim() && (
        <button
          onClick={() =>
            setExpandedItems((prev) => ({
              ...prev,
              [item.id]: !isExpanded,
            }))
          }
          style={{
            marginTop: 10,
            padding: "7px 14px",
            border: "none",
            borderRadius: 9,
            background: "#eff6ff",
            color: "#2563eb",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {isExpanded ? "Thu gọn ↑" : "Xem thêm ↓"}
        </button>
      )}

      <div
        style={{
          marginTop: 20,
          color: "#888",
          fontSize: isMobile ? 12 : 14,
        }}
      >
        {item.updated_at
          ? `Cập nhật: ${new Date(
              item.updated_at
            ).toLocaleString("vi-VN")}`
          : ""}
      </div>
    </div>
  );
})
          )}
        </div>
      </div>
    </div>
  );
}