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
};

export default function CriteriaAdminPage() {
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCriteria();
  }, []);
  const [showSidebar, setShowSidebar] = useState(false)

  async function loadCriteria() {
    setLoading(true);

    const { data, error } = await supabase
      .from("criteria_contents")
      .select("*")
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

  async function saveAll() {
    setSaving(true);

    try {
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
      "Ban chủ nhiệm vừa cập nhật nội dung tiêu chuẩn Sinh viên 5 Tốt. Hãy kiểm tra trong mục <b>Xem tiêu chí</b>.",
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
      Tiêu chuẩn Sinh viên 5 Tốt cấp Trường
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
          display: "grid",
           gridTemplateColumns: "repeat(2,minmax(0,1fr))",
          gap: 24,
        }}
      >
        {criteria.map((item) => (
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