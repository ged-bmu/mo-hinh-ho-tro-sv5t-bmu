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
        padding: 30,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 20,
          width: "100%",
          maxWidth: 1200,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 35,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 30,
          }}
        >
          <h1><b>📑 Tiêu chuẩn Sinh viên 5 tốt cấp Trường nhiệm kỳ 2025 - 2028</b>
          <i> (Theo quyết định số:...QĐ/HSV của Ban Thư ký Hội sinh viên Trường)</i></h1>
      
       <button
            onClick={onClose}
            style={{
              width: 42,
              height: 42,
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(1fr)",
            gap: 25,
          }}
        >
          {criteria.map((item) => (
            <div
              key={item.id}
              style={{
                borderRadius: 18,
                padding: 25,
                background: "#fafafa",
                boxShadow:
                  "0 6px 20px rgba(0,0,0,.08)",
              }}
            >
              <h2>{item.title}</h2>

              <div
                style={{
                  marginTop: 15,
                  lineHeight: 1.8,
                  whiteSpace: "pre-wrap",
                  minHeight: 150,
                }}
              >
                {item.content?.trim()
                  ? item.content
                  : "Chưa cập nhật."}
              </div>

              <div
                style={{
                  marginTop: 20,
                  color: "#888",
                  fontSize: 14,
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