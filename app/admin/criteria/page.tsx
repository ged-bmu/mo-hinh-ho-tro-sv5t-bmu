"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Spinner from "../../components/Spinner";
import AdminSidebar from "../../components/AdminSidebar";

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

export default function CriteriaAdminPage() {
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [header, setHeader] = useState<CriteriaHeader>({
    id: 0,
    type: "school",
    title: "",
    period: "",
    decision: "",
    description: "",
    update_note: "",
    updated_at: "",
  });

  const [tab, setTab] = useState<TabType>("school");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(false);
  const [editingDecision, setEditingDecision] = useState(false);
  const [savingPeriod, setSavingPeriod] = useState(false);
  const [savingDecision, setSavingDecision] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // =========================
  // RESPONSIVE
  // =========================

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);

    check();
    window.addEventListener("resize", check);

    return () => window.removeEventListener("resize", check);
  }, []);

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {
    loadCriteria();
  }, [tab]);

  async function loadCriteria() {
    setLoading(true);

    const { data: headerData, error: headerError } =
      await supabase
        .from("criteria_headers")
        .select("*")
        .eq("type", tab)
        .single();

    if (!headerError && headerData) {
      setHeader(headerData);
    }

    const { data, error } = await supabase
      .from("criteria_contents")
      .select("*")
      .eq("type", tab)
      .order("id");

    if (error) {
      console.error(error);
      alert("Không tải được dữ liệu");
      setLoading(false);
      return;
    }

    setCriteria(
      (data ?? []).map((item) => ({
        ...item,
        content: item.content ?? "",
      }))
    );

    setLoading(false);
  }

  // =========================
  // SAVE PERIOD
  // =========================

  async function savePeriod() {
    if (header.id === 0) return;

    setSavingPeriod(true);

    try {
      const { error } = await supabase
        .from("criteria_headers")
        .update({
          period: header.period,
          updated_at: new Date().toISOString(),
        })
        .eq("id", header.id);

      if (error) throw error;

      const { data: freshData, error: reloadError } =
        await supabase
          .from("criteria_headers")
          .select("*")
          .eq("id", header.id)
          .single();

      if (reloadError) throw reloadError;

      setHeader(freshData);
      setEditingPeriod(false);

      alert("Đã lưu Năm học / Giai đoạn!");
    } catch (err) {
      console.error(err);
      alert("Lưu Năm học / Giai đoạn thất bại!");
    } finally {
      setSavingPeriod(false);
    }
  }

  // =========================
  // SAVE DECISION
  // =========================

  async function saveDecision() {
    if (header.id === 0) return;

    setSavingDecision(true);

    try {
      const { error } = await supabase
        .from("criteria_headers")
        .update({
          decision: header.decision,
          updated_at: new Date().toISOString(),
        })
        .eq("id", header.id);

      if (error) throw error;

      setEditingDecision(false);

      alert("Đã lưu Quyết định!");
    } catch (err) {
      console.error(err);
      alert("Lưu Quyết định thất bại!");
    } finally {
      setSavingDecision(false);
    }
  }

  // =========================
  // INSERT FORMAT
  // =========================

  function insertFormat(id: number, text: string) {
    setCriteria((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              content: item.content
                ? item.content + "\n" + text
                : text,
            }
          : item
      )
    );
  }

  // =========================
  // SAVE ALL
  // =========================

  async function saveAll() {
    setSaving(true);

    try {
      if (header.id !== 0) {
        const { error } = await supabase
          .from("criteria_headers")
          .update({
            title: header.title,
            period: header.period,
            decision: header.decision,
            description: header.description,
            update_note: header.update_note,
            updated_at: new Date().toISOString(),
          })
          .eq("id", header.id);

        if (error) throw error;
      }

      for (const item of criteria) {
        const { error } = await supabase
          .from("criteria_contents")
          .update({
            content: item.content,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        if (error) throw error;
      }

      const { data: students } = await supabase
        .from("profiles")
        .select("id");

      if (students) {
        const notifications = students.map((student) => ({
          user_id: student.id,
          type: "criteria_update",
          title: "Tiêu chuẩn vừa được cập nhật",
          content:
            "Ban chủ nhiệm vừa cập nhật nội dung tiêu chuẩn Sinh viên 5 Tốt. Hãy kiểm tra trong mục Xem tiêu chuẩn.",
          target_url: "/introduce",
        }));

        await supabase
          .from("notifications")
          .insert(notifications);
      }

      alert("Đã lưu thành công!");

      await loadCriteria();
    } catch (err) {
      console.error(err);
      alert("Lưu thất bại!");
    }

    setSaving(false);
  }

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <>
        <AdminSidebar />

        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#f5f7fb",
          }}
        >
          <Spinner />
        </div>
      </>
    );
  }

  // =========================
  // UI STYLES
  // =========================

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #e5eaf2",
    borderRadius: 18,
    padding: isMobile ? 16 : 24,
    boxShadow: "0 4px 18px rgba(15,23,42,.04)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: isMobile ? "11px 12px" : "13px 15px",
    borderRadius: 11,
    border: "1px solid #dbe2ea",
    fontSize: isMobile ? 13 : 14,
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
    color: "#334155",
  };

  const smallButtonStyle: React.CSSProperties = {
    padding: "8px 13px",
    borderRadius: 9,
    border: "1px solid #dbeafe",
    background: "#eff6ff",
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 12,
  };

  const sectionTitleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: isMobile ? 15 : 17,
    fontWeight: 750,
    color: "#1e293b",
  };

  // =========================
  // MAIN UI
  // =========================

  return (
    <>
      <AdminSidebar />

      <main
        style={{
          minHeight: "100vh",
          background: "#f4f6fb",
          padding: isMobile ? "16px 12px 35px" : "35px 40px 50px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: 1500,
            margin: "0 auto",
          }}
        >
          {/* =========================
              TOP BAR
          ========================= */}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 22,
            }}
          >
            <Link
              href="/admin"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 14px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                background: "#fff",
                textDecoration: "none",
                color: "#475569",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              <span>←</span>
              <span>Trang chủ</span>
            </Link>

          </div>

          {/* =========================
              HERO / HEADER
          ========================= */}

          <div
            style={{
              background:
                "linear-gradient(135deg,#1d4ed8 0%,#2563eb 55%,#60a5fa 100%)",
              borderRadius: isMobile ? 18 : 24,
              padding: isMobile ? 16 : 30,
              color: "#fff",
              marginBottom: 22,
              boxShadow: "0 12px 30px rgba(37,99,235,.18)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "stretch" : "center",
                justifyContent: "space-between",
                gap: 20,
              }}
            >
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: isMobile ? 21 : 28,
                    fontWeight: 800,
                    lineHeight: 1.4,
                  }}
                >
                  Cập nhật tiêu chuẩn Sinh viên 5 Tốt
                </h1>
              </div>

              <button
                onClick={saveAll}
                disabled={saving}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 9,
                  padding: isMobile ? "12px 16px" : "14px 22px",
                  borderRadius: 12,
                  background: "#fff",
                  color: "#1d4ed8",
                  border: "none",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontWeight: 800,
                  fontSize: 14,
                  whiteSpace: "nowrap",
                  opacity: saving ? 0.75 : 1,
                  boxShadow: "0 4px 15px rgba(0,0,0,.08)",
                }}
              >
                <span>{saving ? "⏳" : "💾"}</span>
                {saving ? "Đang lưu..." : "Lưu tất cả"}
              </button>
            </div>
          </div>

          {/* =========================
              TAB NAVIGATION
          ========================= */}

          <div
            style={{
              background: "#fff",
              padding: isMobile ? 7 : 9,
              border: "1px solid #e5eaf2",
              borderRadius: 15,
              display: "flex",
              gap: 7,
              overflowX: "auto",
              marginBottom: 22,
              boxShadow: "0 3px 12px rgba(15,23,42,.03)",
            }}
          >
            {[
              { key: "school", label: "Cấp Trường", icon: "🏫" },
              { key: "province", label: "Cấp Tỉnh", icon: "🏛️" },
              { key: "central", label: "Trung ương", icon: "🇻🇳" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key as TabType)}
                style={{
                  flex: isMobile ? "0 0 auto" : 1,
                  padding: isMobile ? "10px 14px" : "13px 18px",
                  borderRadius: 11,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: isMobile ? 12 : 14,
                  background:
                    tab === item.key
                      ? "#2563eb"
                      : "#f8fafc",
                  color:
                    tab === item.key
                      ? "#fff"
                      : "#64748b",
                  transition: ".2s",
                  whiteSpace: "nowrap",
                }}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>

          {/* =========================
              GENERAL INFORMATION
          ========================= */}

          <section style={{ ...cardStyle, marginBottom: 22 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 22,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                }}
              >
                📋
              </div>

              <div>
                <h2 style={sectionTitleStyle}>
                  Thông tin chung
                </h2>

                <div
                  style={{
                    fontSize: 12,
                    color: "#94a3b8",
                    marginTop: 4,
                  }}
                >
                  Năm học và căn cứ ban hành tiêu chuẩn
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "repeat(2,minmax(0,1fr))",
                gap: 16,
              }}
            >
              {/* NĂM HỌC */}

              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 15,
                  padding: isMobile ? 14 : 18,
                  background: "#f8fafc",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#64748b",
                    marginBottom: 12,
                  }}
                >
                  📅 NĂM HỌC / GIAI ĐOẠN
                </div>

                {editingPeriod ? (
                  <>
                    <input
                      value={header.period}
                      onChange={(e) =>
                        setHeader((prev) => ({
                          ...prev,
                          period: e.target.value,
                        }))
                      }
                      autoFocus
                      placeholder="Nhập năm học / giai đoạn..."
                      style={inputStyle}
                    />

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 10,
                      }}
                    >
                      <button
                        onClick={savePeriod}
                        disabled={savingPeriod}
                        style={{
                          padding: "9px 14px",
                          borderRadius: 9,
                          border: "none",
                          background: "#2563eb",
                          color: "#fff",
                          cursor: savingPeriod
                            ? "not-allowed"
                            : "pointer",
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        {savingPeriod ? "Đang lưu..." : "💾 Lưu"}
                      </button>

                      <button
                        onClick={() => setEditingPeriod(false)}
                        disabled={savingPeriod}
                        style={{
                          ...smallButtonStyle,
                          background: "#fff",
                          borderColor: "#e2e8f0",
                          color: "#64748b",
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        fontSize: isMobile ? 14 : 16,
                        fontWeight: 750,
                        color: header.period
                          ? "#1e293b"
                          : "#2563eb",
                        lineHeight: 1.5,
                      }}
                    >
                      {header.period || "Chưa nhập"}
                    </div>

                    <button
                      onClick={() => setEditingPeriod(true)}
                      style={smallButtonStyle}
                    >
                      ✏️ Chỉnh sửa
                    </button>
                  </div>
                )}
              </div>

              {/* QUYẾT ĐỊNH */}

              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 15,
                  padding: isMobile ? 14 : 18,
                  background: "#f8fafc",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#64748b",
                    marginBottom: 12,
                  }}
                >
                  📜 QUYẾT ĐỊNH
                </div>

                {editingDecision ? (
                  <>
                    <input
                      value={header.decision}
                      onChange={(e) =>
                        setHeader((prev) => ({
                          ...prev,
                          decision: e.target.value,
                        }))
                      }
                      autoFocus
                      placeholder="Nhập quyết định..."
                      style={inputStyle}
                    />

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 10,
                      }}
                    >
                      <button
                        onClick={saveDecision}
                        disabled={savingDecision}
                        style={{
                          padding: "9px 14px",
                          borderRadius: 9,
                          border: "none",
                          background: "#2563eb",
                          color: "#fff",
                          cursor: savingDecision
                            ? "not-allowed"
                            : "pointer",
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        {savingDecision
                          ? "Đang lưu..."
                          : "💾 Lưu"}
                      </button>

                      <button
                        onClick={() => setEditingDecision(false)}
                        disabled={savingDecision}
                        style={{
                          ...smallButtonStyle,
                          background: "#fff",
                          borderColor: "#e2e8f0",
                          color: "#64748b",
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        fontSize: isMobile ? 13 : 15,
                        fontWeight: 700,
                        color: header.decision
                          ? "#1e293b"
                          : "#2563eb",
                        lineHeight: 1.6,
                        flex: 1,
                      }}
                    >
                      {header.decision || "Chưa nhập"}
                    </div>

                    <button
                      onClick={() => setEditingDecision(true)}
                      style={smallButtonStyle}
                    >
                      ✏️ Chỉnh sửa
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* =========================
              CRITERIA EDITOR
          ========================= */}

          {tab !== "update" && (
            <>
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: isMobile ? "stretch" : "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: isMobile ? 17 : 20,
                      fontWeight: 800,
                      color: "#1e293b",
                    }}
                  >
                    Nội dung các tiêu chí
                  </h2>
                </div>

                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    alignSelf: isMobile ? "flex-start" : "center",
                    background: "#eff6ff",
                    color: "#2563eb",
                    borderRadius: 999,
                    padding: "7px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  5 tiêu chí
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: 18,
                }}
              >
                {criteria.map((item, index) => (
                  <section
                    key={item.id}
                    style={{
                      ...cardStyle,
                      padding: isMobile ? 14 : 22,
                    }}
                  >
                    {/* CRITERIA HEADER */}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 11,
                          background: "#eff6ff",
                          color: "#2563eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          fontSize: 14,
                          fontWeight: 800,
                        }}
                      >
                        {index + 1}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: isMobile ? 15 : 18,
                            fontWeight: 800,
                            color: "#1e293b",
                            lineHeight: 1.5,
                          }}
                        >
                          {item.title}
                        </h3>

                        <div
                          style={{
                            fontSize: 11,
                            color: "#94a3b8",
                            marginTop: 4,
                          }}
                        >
                          Nội dung tiêu chí
                        </div>
                      </div>

                      <span
                        style={{
                          background: item.content.trim()
                            ? "#dcfce7"
                            : "#fef3c7",
                          color: item.content.trim()
                            ? "#166534"
                            : "#92400e",
                          padding: "5px 9px",
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.content.trim()
                          ? "Đã nhập"
                          : "Trống"}
                      </span>
                    </div>

                    {/* CONTENT TEXTAREA */}

                    <textarea
                      value={item.content}
                      placeholder="Nhập nội dung tiêu chí..."
                      onChange={(e) => {
                        const value = e.target.value;

                        setCriteria((prev) =>
                          prev.map((c) =>
                            c.id === item.id
                              ? {
                                  ...c,
                                  content: value,
                                }
                              : c
                          )
                        );
                      }}
                      style={{
                        width: "100%",
                        minHeight: isMobile ? 190 : 240,
                        padding: isMobile ? 12 : 16,
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: isMobile ? 13 : 14,
                        resize: "vertical",
                        lineHeight: 1.8,
                        color: "#334155",
                        background: "#fcfdff",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />

                    {/* FORMAT TOOLBAR */}

                    <div
                      style={{
                        marginTop: 14,
                        padding: isMobile ? 11 : 14,
                        background: "#f8fafc",
                        border: "1px solid #e9eef5",
                        borderRadius: 13,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: "#64748b",
                          fontWeight: 700,
                          marginBottom: 10,
                        }}
                      >
                        CÔNG CỤ ĐỊNH DẠNG
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 7,
                        }}
                      >
                        {[
                          {
                            label: "🔴 Bắt buộc",
                            text: "\n## Tiêu chuẩn bắt buộc\n",
                          },
                          {
                            label: "🟠 Đạt thêm",
                            text: "\n## Đạt thêm 01 trong các tiêu chí sau\n",
                          },
                          {
                            label: "🔵 Kỹ năng",
                            text: "\n## Kỹ năng\n",
                          },
                          {
                            label: "🟣 Ngoại ngữ",
                            text: "\n## Ngoại ngữ\n",
                          },
                          {
                            label: "B",
                            text: "\n**Nội dung in đậm**\n",
                          },
                          {
                            label: "I",
                            text: "\n*Nội dung in nghiêng*\n",
                          },
                          {
                            label: "☷ Danh sách",
                            text: "\n- Nội dung\n",
                          },
                          {
                            label: "① Đánh số",
                            text: "\n1. Nội dung\n",
                          },
                        ].map((format) => (
                          <button
                            key={format.label}
                            type="button"
                            onClick={() =>
                              insertFormat(item.id, format.text)
                            }
                            style={{
                              padding: "8px 11px",
                              borderRadius: 9,
                              border: "1px solid #dbeafe",
                              background: "#fff",
                              color: "#2563eb",
                              cursor: "pointer",
                              fontWeight: 700,
                              fontSize: 11,
                              transition: ".2s",
                            }}
                          >
                            {format.label}
                          </button>
                        ))}
                      </div>

                      <div
                        style={{
                          marginTop: 9,
                          fontSize: 11,
                          color: "#94a3b8",
                          lineHeight: 1.6,
                        }}
                      >
                        Các nút định dạng sẽ chèn mẫu vào cuối
                        nội dung đang soạn.
                      </div>
                    </div>

                    {/* FOOTER */}

                    <div
                      style={{
                        marginTop: 15,
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <span
                        style={{
                          background: item.content.trim()
                            ? "#dcfce7"
                            : "#fef3c7",
                          color: item.content.trim()
                            ? "#166534"
                            : "#92400e",
                          padding: "6px 11px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {item.content.trim()
                          ? "✓ Đã cập nhật nội dung"
                          : "⚠ Chưa cập nhật nội dung"}
                      </span>

                      <span
                        style={{
                          color: "#94a3b8",
                          fontSize: 11,
                        }}
                      >
                        {item.updated_at
                          ? new Date(
                              item.updated_at
                            ).toLocaleString("vi-VN")
                          : ""}
                      </span>
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}

          {/* =========================
              BOTTOM SAVE
          ========================= */}

          <div
            style={{
              marginTop: 25,
              padding: isMobile ? 15 : 20,
              background: "#fff",
              border: "1px solid #e5eaf2",
              borderRadius: 16,
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "stretch" : "center",
              justifyContent: "space-between",
              gap: 12,
              boxShadow: "0 4px 18px rgba(15,23,42,.04)",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 750,
                  color: "#334155",
                }}
              >
                Hoàn tất chỉnh sửa?
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  marginTop: 4,
                  lineHeight: 1.6,
                }}
              >
                Lưu để cập nhật dữ liệu và gửi thông báo đến
                sinh viên.
              </div>
            </div>

            <button
              onClick={saveAll}
              disabled={saving}
              style={{
                padding: isMobile ? "12px 16px" : "13px 22px",
                borderRadius: 11,
                border: "none",
                background: "#2563eb",
                color: "#fff",
                cursor: saving ? "not-allowed" : "pointer",
                fontWeight: 800,
                fontSize: 13,
                opacity: saving ? 0.7 : 1,
                boxShadow: "0 4px 12px rgba(37,99,235,.18)",
              }}
            >
              {saving
                ? "⏳ Đang lưu dữ liệu..."
                : "💾 Lưu tất cả thay đổi"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}