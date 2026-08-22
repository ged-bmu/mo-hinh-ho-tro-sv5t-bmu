"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { sendNotification } from "@/lib/notification";
import Spinner from "../../components/Spinner";

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
const [tab, setTab] = useState<
  "school" | "province" | "central" | "update"
>("school");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(false);
  const [editingDecision, setEditingDecision] = useState(false);
  const [savingPeriod, setSavingPeriod] = useState(false);
  const [savingDecision, setSavingDecision] = useState(false);

useEffect(() => {
  loadCriteria();
}, [tab]);
  const [showSidebar, setShowSidebar] = useState(false)

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
async function savePeriod() {
  if (header.id === 0) return;

  setSavingPeriod(true);

  try {
    const { data, error } = await supabase
      .from("criteria_headers")
      .update({
        period: header.period,
        updated_at: new Date().toISOString(),
      })
      .eq("id", header.id)
      .select()
      .single();

    console.log("✅ UPDATE PERIOD DATA:", data);
    console.log("❌ UPDATE PERIOD ERROR:", error);

    if (error) throw error;

    // Lấy lại dữ liệu thật từ Supabase
    const { data: freshData, error: reloadError } = await supabase
      .from("criteria_headers")
      .select("*")
      .eq("id", header.id)
      .single();

    console.log("🔄 DATA SAU KHI LƯU:", freshData);
    console.log("❌ RELOAD ERROR:", reloadError);

    if (reloadError) throw reloadError;

    setHeader(freshData);
    setEditingPeriod(false);

    alert("Đã lưu Năm học / Giai đoạn!");
  } catch (err) {
    console.error("❌ SAVE PERIOD ERROR:", err);
    alert("Lưu Năm học / Giai đoạn thất bại!");
  } finally {
    setSavingPeriod(false);
  }
}

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

  if (loading) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Spinner />
    </div>
  );
}

  return (
    <div
      style={{
    background:"#f7f8fc",
    minHeight:"100vh",
    padding:"50px"
}}
    >
        
    <Link
      href="/admin"
      style={{
        display: "inline-flex",
        gap: "24px",
        alignItems: "flex-start",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        padding: "10px 16px",
        borderRadius: "12px",
        textDecoration: "none",
        color: "#334155",
        fontWeight: 600,
        marginBottom: "20px",
      }}
    >
      ← Trang chủ
    </Link>
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 40,
  }}
>
  <div>
    <h1
      style={{
        margin: 0,
        fontSize: "26px",
        fontWeight: 700,
      }}
    >
      Tiêu chuẩn Sinh viên 5 Tốt
    </h1>
    

    <p
      style={{
        marginTop: 8,
        fontSize: "16px",
        color: "#666",
      }}
    >
      Nhập để chỉnh sửa nội dung các tiêu chí
    </p>
  </div>

 <button
  onClick={saveAll}
  disabled={saving}
  style={{
    padding: "14px 26px",
    borderRadius: 12,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    cursor: saving ? "not-allowed" : "pointer",
    fontWeight: 700,
    fontSize: 15,
    opacity: saving ? 0.7 : 1,
  }}
>
  {saving ? "Đang lưu..." : "💾 Lưu tất cả"}
</button>
</div>

<div
  style={{
    display: "flex",
    gap: 12,
    marginBottom: 25,
    overflowX: "auto",
  }}
>
  {[
    { key: "school", label: "Cấp Trường" },
    { key: "province", label: "Cấp Tỉnh" },
    { key: "central", label: "Trung ương" },
    { key: "update", label: "Cập nhật mới" },
  ].map((item) => (
    <button
      key={item.key}
      onClick={() => setTab(item.key as any)}
      style={{
        padding: "10px 20px",
        borderRadius: 12,
        border: "none",
        cursor: "pointer",
        fontWeight: 600,
        background: tab === item.key ? "#2563eb" : "#fff",
        color: tab === item.key ? "#fff" : "#333",
        boxShadow:
          tab === item.key
            ? "0 6px 18px rgba(37,99,235,.25)"
            : "0 2px 8px rgba(0,0,0,.06)",
      }}
    >
      {item.label}
    </button>
  ))}
</div>
<div
  style={{
    background: "#fff",
    borderRadius: 18,
    padding: 24,
    marginBottom: 24,
    border: "1px solid #eee",
    boxShadow: "0 8px 30px rgba(0,0,0,.05)",
  }}
>
  <h2
    style={{
      marginTop: 0,
      marginBottom: 20,
      fontSize: 20,
    }}
  >
    Thông tin chung
  </h2>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 20,
    }}
  >
    {/* NĂM HỌC / GIAI ĐOẠN */}
    <div
  onClick={() => {
    if (!editingPeriod && !header.period) {
      setEditingPeriod(true);
    }
  }}
  style={{
    border: header.period
      ? "1px solid #e5e7eb"
      : "1px solid #93c5fd",
    borderRadius: 14,
    padding: 18,
    background: header.period
      ? "#fafafa"
      : "#eff6ff",
    cursor: !editingPeriod && !header.period
      ? "pointer"
      : "default",
  }}
>
      <div
        style={{
          fontSize: 14,
          color: "#64748b",
          marginBottom: 8,
          fontWeight: 600,
        }}
      >
        📅 Năm học / Giai đoạn
      </div>

      {editingPeriod ? (
        <div>
          <input
            value={header.period}
            onChange={(e) =>
              setHeader((prev) => ({
                ...prev,
                period: e.target.value,
              }))
            }
            autoFocus
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #2563eb",
              fontSize: 15,
              outline: "none",
              boxSizing: "border-box",
              background: "#fff",
            }}
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
      padding: "8px 14px",
      borderRadius: 9,
      border: "none",
      background: "#2563eb",
      color: "#fff",
      cursor: savingPeriod ? "not-allowed" : "pointer",
      fontWeight: 600,
      opacity: savingPeriod ? 0.7 : 1,
    }}
  >
    {savingPeriod ? "Đang lưu..." : "💾 Lưu"}
  </button>

<button
  onClick={() => setEditingPeriod(false)}
  disabled={savingPeriod}
    style={{
      padding: "8px 14px",
      borderRadius: 9,
      border: "1px solid #e2e8f0",
      background: "#fff",
      color: "#475569",
      cursor: "pointer",
      fontWeight: 600,
    }}
  >
    Hủy
  </button>
</div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: header.period ? "#1e293b" : "#2563eb",
            }}
          >
            {header.period || "Chưa nhập – Bấm để nhập"}
          </div>

          <button
            onClick={() => setEditingPeriod(true)}
            style={{
              padding: "8px 12px",
              borderRadius: 9,
              border: "1px solid #dbeafe",
              background: "#eff6ff",
              color: "#2563eb",
              cursor: "pointer",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            Chỉnh sửa
          </button>
        </div>
      )}
    </div>

    {/* QUYẾT ĐỊNH */}
   <div
  onClick={() => {
    if (!editingDecision && !header.decision) {
      setEditingDecision(true);
    }
  }}
  style={{
    border: header.decision
      ? "1px solid #e5e7eb"
      : "1px solid #93c5fd",
    borderRadius: 14,
    padding: 18,
    background: header.decision
      ? "#fafafa"
      : "#eff6ff",
    cursor: !editingDecision && !header.decision
      ? "pointer"
      : "default",
  }}
>
      <div
        style={{
          fontSize: 14,
          color: "#64748b",
          marginBottom: 8,
          fontWeight: 600,
        }}
      >
        📜 Quyết định
      </div>

      {editingDecision ? (
        <div>
          <input
            value={header.decision}
            onChange={(e) =>
              setHeader((prev) => ({
                ...prev,
                decision: e.target.value,
              }))
            }
            autoFocus
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #2563eb",
              fontSize: 15,
              outline: "none",
              boxSizing: "border-box",
              background: "#fff",
            }}
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
      padding: "8px 14px",
      borderRadius: 9,
      border: "none",
      background: "#2563eb",
      color: "#fff",
      cursor: savingDecision ? "not-allowed" : "pointer",
      fontWeight: 600,
      opacity: savingDecision ? 0.7 : 1,
    }}
  >
    {savingDecision ? "Đang lưu..." : "💾 Lưu"}
  </button>

<button
  onClick={() => setEditingDecision(false)}
  disabled={savingDecision}
    style={{
      padding: "8px 14px",
      borderRadius: 9,
      border: "1px solid #e2e8f0",
      background: "#fff",
      color: "#475569",
      cursor: "pointer",
      fontWeight: 600,
    }}
  >
    Hủy
  </button>
</div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: header.decision ? "#1e293b" : "#2563eb",
            }}
          >
            {header.decision || "Chưa nhập – Bấm để nhập"}
          </div>

          <button
            onClick={() => setEditingDecision(true)}
            style={{
              padding: "8px 12px",
              borderRadius: 9,
              border: "1px solid #dbeafe",
              background: "#eff6ff",
              color: "#2563eb",
              cursor: "pointer",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            Chỉnh sửa
          </button>
        </div>
      )}
    </div>
  </div>
</div>
      <div
        style={{
          display: "grid",
           gridTemplateColumns: "repeat(1,minmax(0,1fr))",
          gap: 24,
        }}
      >
        {tab === "update" && (
  <div
    style={{
      background: "#fff",
      borderRadius: 18,
      padding: 24,
      border: "1px solid #eee",
      boxShadow: "0 8px 30px rgba(0,0,0,.05)",
      marginBottom: 24,
    }}
  >
    <h2
      style={{
        marginTop: 0,
        marginBottom: 16,
      }}
    >
      Nội dung cập nhật mới
    </h2>

    <textarea
      value={header?.update_note ?? ""}
      onChange={(e) =>
        setHeader((prev) =>
          prev
            ? {
                ...prev,
                update_note: e.target.value,
              }
            : prev
        )
      }
      placeholder="Nhập nội dung cập nhật..."
      style={{
        width: "100%",
        minHeight: 180,
        padding: 16,
        borderRadius: 12,
        border: "1px solid #ddd",
        fontSize: 15,
        lineHeight: 1.6,
      }}
    />
  </div>
)}
        {tab !== "update" && criteria.map((item) => (
          <div
            key={item.id}
            style={{
    background:"#fff",
    borderRadius:18,
    padding:24,
    border:"1px solid #eee",
    boxShadow:"0 8px 30px rgba(0,0,0,.05)"
}}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: 16,
                fontSize: 22,
              }}
            >
              {item.title}
            </h2>

            <textarea
              value={item.content}
              placeholder="Chưa cập nhật nội dung..."
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
    width:"100%",
    minHeight:150,
    padding:16,
    borderRadius:12,
    border:"1px solid #ddd",
    fontSize:15,
    resize:"vertical",
    lineHeight:1.6
              }}
            />

           <div
    style={{
        marginTop:16,
        display:"flex",
        justifyContent:"space-between",
        alignItems:"center"
    }}
>

<span
style={{
    background:item.content.trim()
        ? "#dcfce7"
        : "#fef3c7",
    color:item.content.trim()
        ? "#166534"
        : "#92400e",
    padding:"5px 12px",
    borderRadius:999,
    fontSize:13,
    fontWeight:600
}}
>
{
item.content.trim()
?"Đã cập nhật"
:"Chưa cập nhật"
}
</span>

<span
style={{
    color:"#888",
    fontSize:13
}}
>
{
item.updated_at
?new Date(item.updated_at).toLocaleString("vi-VN")
:""
}
</span>

</div>
          </div>
        ))}
      </div>
    </div>
  );
}