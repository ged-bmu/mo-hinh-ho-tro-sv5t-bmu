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

// =========================
// RENDER CHỮ ĐẬM + CHỮ NGHIÊNG
// =========================

function renderInlineText(text: string) {
  return text
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    .map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }

      if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
        return <em key={i}>{part.slice(1, -1)}</em>;
      }

      return part;
    });
}

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

  // =========================
  // ICON TIÊU CHÍ
  // =========================

  const getCriterionIcon = (title: string) => {
    const normalizedTitle = title.toLowerCase();

    if (normalizedTitle.includes("đạo đức")) {
      return "/icondaoduc.png";
    }

    if (normalizedTitle.includes("học tập")) {
      return "/iconhoctap.png";
    }

    if (normalizedTitle.includes("thể lực")) {
      return "/icontheluc.png";
    }

    if (normalizedTitle.includes("tình nguyện")) {
      return "/icontinhnguyen.png";
    }

    if (normalizedTitle.includes("hội nhập")) {
      return "/iconhoinhap.png";
    }

    if (
      normalizedTitle.includes("ưu tiên") ||
      normalizedTitle.includes("thành tích")
    ) {
      return "/iconuutien.png";
    }

    return null;
  };

  // =========================
  // XỬ LÝ TIÊU ĐỀ TRONG NỘI DUNG
  // =========================

  const normalizeHeading = (line: string) => {
    return line
      .trim()
      .replace(/^\\?#*\s*/, "")
      .replace(/^\*\*(.*?)\*\*$/, "$1")
      .trim();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        zIndex: 99999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: isMobile ? 8 : 24,
      }}
    >
      {/* MODAL */}

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: isMobile ? 14 : 18,
          width: "100%",
          maxWidth: isMobile ? "100%" : 1100,
          maxHeight: "92vh",
          overflowY: "auto",
          padding: isMobile ? 13 : 26,
          boxShadow: "0 15px 50px rgba(0,0,0,.15)",
        }}
      >
        {/* =========================
            HEADER + TABS
        ========================= */}

        <div
          style={{
            position: "sticky",
            top: isMobile ? -13 : -26,
            zIndex: 100,
            background: "#fff",

            margin: isMobile
              ? "-13px -13px 16px"
              : "-26px -26px 20px",

            padding: isMobile
              ? "13px 13px 10px"
              : "26px 26px 14px",

            borderBottom: "1px solid #eee",
          }}
        >
          {/* TIÊU ĐỀ + NÚT ĐÓNG */}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: isMobile ? 16 : 23,
                  lineHeight: 1.4,
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  flexWrap: "wrap",
                  fontWeight: 750,
                }}
              >
                <img
                  src="/bonghoa5tot.png"
                  alt=""
                  style={{
                    width: isMobile ? 28 : 34,
                    height: isMobile ? 28 : 34,
                    objectFit: "contain",
                    flexShrink: 0,
                  }}
                />

                <span>
                  Tiêu chuẩn Sinh viên 5 tốt {levelLabel}
                </span>
              </h1>

              {/* THÔNG TIN TIÊU CHUẨN */}

              {header && tab !== "update" && (
                <div
                  style={{
                    marginTop: 7,
                    paddingRight: 8,
                  }}
                >
                  {/* NĂM HỌC / GIAI ĐOẠN */}

                  {header.period && (
                    <div
                      style={{
                        marginTop: 3,
                        fontSize: isMobile ? 12 : 13,
                        color: "#334155",
                        fontWeight: 600,
                      }}
                    >
                      {header.period}
                    </div>
                  )}

                  {/* QUYẾT ĐỊNH */}

                  {header.decision && (
                    <div
                      style={{
                        marginTop: 3,
                        fontSize: isMobile ? 11 : 12,
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

                  {/* MÔ TẢ */}

                  {header.description && (
                    <div
                      style={{
                        marginTop: 5,
                        fontSize: isMobile ? 12 : 13,
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

            {/* NÚT ĐÓNG */}

            <button
              onClick={onClose}
              style={{
                width: isMobile ? 34 : 38,
                height: isMobile ? 34 : 38,
                border: "none",
                borderRadius: 9,
                cursor: "pointer",
                background: "#f3f4f6",
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>

          {/* TABS */}

          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              whiteSpace: "nowrap",
              marginTop: 17,
              paddingBottom: 2,
              WebkitOverflowScrolling: "touch",
            }}
          >
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as TabType)}
                style={{
                  minWidth: isMobile ? 105 : 130,
                  padding: isMobile ? "8px 12px" : "9px 15px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  transition: ".2s",
                  fontWeight: 600,
                  fontSize: isMobile ? 12 : 13,
                  background: tab === t.key ? "#0055ff" : "#f3f4f6",
                  color: tab === t.key ? "#fff" : "#333",
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
            gap: isMobile ? 14 : 18,
          }}
        >
          {/* TAB CẬP NHẬT MỚI */}

          {tab === "update" ? (
            <div
              style={{
                textAlign: "left",
                padding: isMobile ? 14 : 20,
                background: "#fafafa",
                borderRadius: 14,
                boxShadow: "0 4px 14px rgba(0,0,0,.05)",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: isMobile ? 16 : 19,
                  color: "#2563eb",
                }}
              >
                {header?.title || "Cập nhật mới"}
              </h2>

              <div
                style={{
                  marginTop: 10,
                  lineHeight: 1.75,
                  whiteSpace: "pre-wrap",
                  fontSize: isMobile ? 13 : 14,
                  color: "#334155",
                }}
              >
                {header?.update_note?.trim()
                  ? header.update_note
                  : "Chưa có nội dung cập nhật."}
              </div>

              {header?.updated_at && (
                <div
                  style={{
                    marginTop: 16,
                    color: "#888",
                    fontSize: isMobile ? 11 : 12,
                  }}
                >
                  Cập nhật:{" "}
                  {new Date(header.updated_at).toLocaleString("vi-VN")}
                </div>
              )}
            </div>
          ) : currentData.length === 0 ? (
            /* KHÔNG CÓ NỘI DUNG */

            <div
              style={{
                textAlign: "center",
                padding: "45px 15px",
                color: "#888",
                fontSize: isMobile ? 13 : 15,
                background: "#fafafa",
                borderRadius: 14,
              }}
            >
              Chưa có nội dung.
            </div>
          ) : (
            /* DANH SÁCH TIÊU CHÍ */

            currentData.map((item) => {
              const isExpanded = expandedItems[item.id] ?? false;
              const criterionIcon = getCriterionIcon(item.title);

              return (
                <div
                  key={item.id}
                  style={{
                    borderRadius: 14,
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    overflow: "hidden",
                    boxShadow: "0 3px 12px rgba(15,23,42,.05)",
                  }}
                >
                  {/* TÊN TIÊU CHÍ */}

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedItems((prev) => ({
                        ...prev,
                        [item.id]: !isExpanded,
                      }))
                    }
                    aria-expanded={isExpanded}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      width: "100%",
                      padding: isMobile ? "12px 13px" : "15px 18px",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      background: isExpanded ? "#eff6ff" : "#f8fafc",
                      color: "#d61f69",
                      fontSize: isMobile ? 14 : 16,
                      fontWeight: 700,
                      lineHeight: 1.45,
                      transition: "background .2s ease",
                    }}
                  >
                    {criterionIcon && (
                      <img
                        src={criterionIcon}
                        alt=""
                        aria-hidden="true"
                        style={{
                          width: isMobile ? 30 : 36,
                          height: isMobile ? 30 : 36,
                          objectFit: "contain",
                          flexShrink: 0,
                        }}
                      />
                    )}

                    <span style={{ flex: 1 }}>
                      {item.title}
                    </span>

                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: 15,
                        color: "#2563eb",
                        transform: isExpanded
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        transition: "transform .25s ease",
                      }}
                    >
                      ▼
                    </span>
                  </button>

                  {/* NỘI DUNG ĐẦY ĐỦ */}

                  {isExpanded && (
                    <div
                      style={{
                        padding: isMobile ? 13 : 20,
                        borderTop: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          lineHeight: 1.75,
                          fontSize: isMobile ? 13 : 14,
                          color: "#334155",
                        }}
                      >
                        {item.content?.trim() ? (
                          item.content.split("\n").map((line, index) => {
                            const text = line.trim();
                            const heading = normalizeHeading(text);

                            // TIÊU CHUẨN BẮT BUỘC

                            if (
                              heading.includes("Tiêu chuẩn bắt buộc")
                            ) {
                              return (
                                <div
                                  key={index}
                                  style={{
                                    display: "inline-block",
                                    margin: "14px 0 8px",
                                    padding: "6px 12px",
                                    borderRadius: 10,
                                    background: "#fee2e2",
                                    color: "#b91c1c",
                                    border: "1px solid #fecaca",
                                    fontWeight: 800,
                                    fontSize: isMobile ? 12 : 13,
                                  }}
                                >
                                  🔴 Tiêu chuẩn bắt buộc
                                </div>
                              );
                            }

                            // TIÊU CHÍ ĐẠT THÊM

                            if (
                              heading.includes(
                                "Đạt thêm 01 trong các tiêu chí sau"
                              ) ||
                              heading.includes(
                                "Đạt 01 trong các tiêu sau"
                              ) ||
                              heading.includes(
                                "Đạt 01 trong các tiêu chí sau"
                              )
                            ) {
                              return (
                                <div
                                  key={index}
                                  style={{
                                    display: "inline-block",
                                    margin: "14px 0 8px",
                                    padding: "6px 12px",
                                    borderRadius: 10,
                                    background: "#ffedd5",
                                    color: "#c2410c",
                                    border: "1px solid #fed7aa",
                                    fontWeight: 800,
                                    fontSize: isMobile ? 12 : 13,
                                  }}
                                >
                                  {["Thể lực", "Tình nguyện"].some((name) =>
                                    item.title
                                      .toLowerCase()
                                      .includes(name.toLowerCase())
                                  )
                                    ? "Đạt 01 trong các tiêu sau"
                                    : "⭐ Đạt thêm 01 trong các tiêu chí sau"}
                                </div>
                              );
                            }

                            // KỸ NĂNG

                            if (heading === "Kỹ năng") {
                              return (
                                <div
                                  key={index}
                                  style={{
                                    display: "inline-block",
                                    margin: "14px 0 8px",
                                    padding: "6px 12px",
                                    borderRadius: 10,
                                    background: "#dbeafe",
                                    color: "#1d4ed8",
                                    border: "1px solid #bfdbfe",
                                    fontWeight: 800,
                                    fontSize: isMobile ? 13 : 14,
                                  }}
                                >
                                  🧠 Kỹ năng
                                </div>
                              );
                            }

                            // NGOẠI NGỮ

                            if (heading === "Ngoại ngữ") {
                              return (
                                <div
                                  key={index}
                                  style={{
                                    display: "inline-block",
                                    margin: "14px 0 8px",
                                    padding: "6px 12px",
                                    borderRadius: 10,
                                    background: "#ede9fe",
                                    color: "#6d28d9",
                                    border: "1px solid #ddd6fe",
                                    fontWeight: 800,
                                    fontSize: isMobile ? 13 : 14,
                                  }}
                                >
                                  🌐 Ngoại ngữ
                                </div>
                              );
                            }

                            // DÒNG TRỐNG

                            if (!text) {
                              return (
                                <div
                                  key={index}
                                  style={{ height: 5 }}
                                />
                              );
                            }

                            // NỘI DUNG THƯỜNG + CHỮ ĐẬM + CHỮ NGHIÊNG

                            return (
                              <div
                                key={index}
                                style={{
                                  whiteSpace: "pre-wrap",
                                  marginBottom: 3,
                                }}
                              >
                                {renderInlineText(text)}
                              </div>
                            );
                          })
                        ) : (
                          "Chưa cập nhật."
                        )}
                      </div>

                      {/* NGÀY CẬP NHẬT */}

                      <div
                        style={{
                          marginTop: 16,
                          color: "#888",
                          fontSize: isMobile ? 11 : 12,
                        }}
                      >
                        {item.updated_at
                          ? `Cập nhật: ${new Date(
                              item.updated_at
                            ).toLocaleString("vi-VN")}`
                          : ""}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}