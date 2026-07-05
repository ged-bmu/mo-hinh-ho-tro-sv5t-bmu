"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Criteria = {
  id: number;
  title: string;
  content: string;
  updated_at: string;
};

export default function CriteriaModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const check = () => setIsMobile(window.innerWidth <= 768);

  check();
  window.addEventListener("resize", check);

  return () => window.removeEventListener("resize", check);
}, []);
  const [criteria, setCriteria] = useState<Criteria[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data, error } = await supabase
  .from("criteria_contents")
  .select("*")
  .order("id");

    if (data) setCriteria(data);
  }

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
       <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 24,
  }}
>
  <div style={{ flex: 1 }}>
    <h1
      style={{
        margin: 0,
        fontSize: isMobile ? 18 : 28,
        lineHeight: 1.4,
      }}
    >
      📑 Tiêu chuẩn Sinh viên 5 tốt cấp Trường nhiệm kỳ 2025 - 2028
    </h1>

    <div
      style={{
        marginTop: 6,
        fontSize: isMobile ? 13 : 16,
        color: "#666",
        fontStyle: "italic",
      }}
    >
      (Theo quyết định số ... của Ban Thư ký Hội Sinh viên Trường)
    </div>
  </div>

  <button
    onClick={onClose}
    style={{
      width: 38,
      height: 38,
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 25,
          }}
        >
          {criteria.map((item) => (
            <div
              key={item.id}
              style={{
                borderRadius: 18,
                padding: isMobile ? 16 : 25,
                background: "#fafafa",
                boxShadow:"0 6px 20px rgba(0,0,0,.08)",
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
    minHeight: 0,
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
                  ? `Cập nhật: ${new Date(
                      item.updated_at
                    ).toLocaleString("vi-VN")}`
                  : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}