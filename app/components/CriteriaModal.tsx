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

type TabType = "school" | "province" | "central" | "update";

export default function CriteriaModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [isMobile, setIsMobile] = useState(false);

  const [criteria, setCriteria] = useState<Criteria[]>([]);

  const [tab, setTab] = useState<TabType>("school");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);

    check();
    window.addEventListener("resize", check);

    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data } = await supabase
      .from("criteria_contents")
      .select("*")
      .order("id");

    if (data) setCriteria(data as Criteria[]);
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
{/* Header + Tabs (Sticky) */}

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
              }}
            >
              📑 Tiêu chuẩn Sinh viên 5 tốt
            </h1>
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

        {/* Tabs */}

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
        {/* Nội dung */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 22,
          }}
        >
{currentData.length === 0 ? (
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
  currentData.map((item) => (
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
        }}
      >
        {item.content?.trim() ? item.content : "Chưa cập nhật."}
      </div>

      <div
        style={{
          marginTop: 20,
          color: "#888",
          fontSize: isMobile ? 12 : 14,
        }}
      >
        {item.updated_at
          ? `Cập nhật: ${new Date(item.updated_at).toLocaleString("vi-VN")}`
          : ""}
      </div>
    </div>
  ))
)}
        </div>
      </div>
    </div>
  );
}