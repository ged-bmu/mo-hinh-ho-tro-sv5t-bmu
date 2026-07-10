"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Sidebar from "../components/Sidebar";
import FileItem from "../components/FileItem";
import CriteriaModal from "../components/CriteriaModal";
import BellUserTemp from "../components/BellUserTemp";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ReportEditor from "../components/ReportEditor";

export default function HocTapPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [userId, setUserId] = useState("");
  const [dragging, setDragging] = useState(false);
  const [showCriteria,setShowCriteria]=useState(false);
  const [tab, setTab] = useState("proof");
  const [displayNames, setDisplayNames] = useState<  Record<string, string>>({});
  const [report, setReport] = useState("");
  const [savingReport, setSavingReport] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const defaultReport = `
<p>1. Điểm trung bình năm học 2025 - 2026: .../4.0.</p>

<p>2. &nbsp;</p>

`;

  useEffect(() => {
    loadFiles();
  }, []);

  async function loadFiles() {
      const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  setUserId(user.id);

  const { data } = await supabase.storage
    .from("Ho so SV5T")
    .list(`${user.id}/hoc-tap`);

  if (data) {
    setFiles(data);
  }

  const { data: uploadedFiles } =
    await supabase
      .from("uploaded_files")
      .select(
        "storage_name, display_name"
      )
      .eq("user_id", user.id)
      .eq("folder", "hoc-tap");

  if (uploadedFiles) {
    const map: Record<
      string,
      string
    > = {};

    uploadedFiles.forEach((f) => {
      map[f.storage_name] =
        f.display_name;
    });

    setDisplayNames(map);
    const { data: reportData } = await supabase
  .from("reports")
  .select("content")
  .eq("user_id", user.id)
  .eq("criteria", "hoc-tap")
  .maybeSingle();

setReport(reportData?.content ?? defaultReport);
  }
}
async function saveReport() {
  if (!userId) return;

  setSavingReport(true);

  const { error } = await supabase
  .from("reports")
  .upsert(
    {
      user_id: userId,
      criteria: "hoc-tap",
      content: report,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,criteria",
    }
  );

  setSavingReport(false);

if (error) {
  console.error(error);
  setSavingReport(false);
  return;
}

setSavingReport(false);
setLastSaved(new Date());
}
async function uploadFile(file: File) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

const safeName = file.name
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-zA-Z0-9._-]/g, "_");

const fileName =
  `${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
  .from("Ho so SV5T")
  .upload(
    `${user.id}/hoc-tap/${fileName}`,
    file,
    {
      upsert: true,
    }
  );

if (error) {
  alert(error.message);
  return;
}

const { data, error: insertError } = await supabase
  .from("uploaded_files")
  .insert({
    user_id: user.id,
    folder: "hoc-tap",
    storage_name: fileName,
    display_name: file.name,
  });

console.log("INSERT DATA:", data);
console.log("INSERT ERROR:", insertError);

const { data: profile } = await supabase
  .from("profiles")
  .select("ho_ten, lop")
  .eq("id", user.id)
  .single();

await supabase
  .from("activity_logs")
  .insert({
    user_id: user.id,
    ho_ten: profile?.ho_ten,
    lop: profile?.lop,

    action_type: "upload",

    target_folder: "hoc-tap",
    target_file: file.name,
  });
  await fetch("/api/cleanup-logs", {
  method: "POST",
});

  loadFiles();
}
async function handleUpload(
  event: React.ChangeEvent<HTMLInputElement>
) {
  const file = event.target.files?.[0];

  if (!file) return;

  uploadFile(file);
}

  async function deleteFile(name: string) {
      const {
    data: { user },
  } = await supabase.auth.getUser();

console.log("AUTH ID =", user?.id);
  if (!user) return;
    await supabase.storage
      .from("Ho so SV5T")
      .remove([`${user.id}/hoc-tap/${name}`]);
      const { data: profile } = await supabase
  .from("profiles")
  .select("ho_ten, lop")
  .eq("id", user.id)
  .single();

await supabase
  .from("activity_logs")
  .insert({
    user_id: user.id,
    ho_ten: profile?.ho_ten,
    lop: profile?.lop,

    action_type: "delete",

    target_folder: "hoc-tap",
    target_file: name,
  });
await fetch("/api/cleanup-logs", {
  method: "POST",
});
    loadFiles();
  }
  async function renameFile(file: any) {
  const ext = file.name.slice(file.name.lastIndexOf("."));
  const currentName = (file.display_name || file.name).replace(/\.[^/.]+$/, "");
  const input = prompt("Nhập tên mới:", currentName);
      if (!input) return;
  const newName = input.trim() + ext;

  await supabase
    .from("uploaded_files")
    .update({
      display_name: newName,
    })
    .eq("storage_name", file.storage_name || file.name)
    const {
  data: { user },
} = await supabase.auth.getUser();

const { data: profile } = await supabase
  .from("profiles")
  .select("ho_ten, lop")
  .eq("id", user?.id)
  .single();

await supabase
  .from("activity_logs")
  .insert({
    user_id: user?.id,
    ho_ten: profile?.ho_ten,
    lop: profile?.lop,

    action_type: "rename",

    target_folder: "hoc-tap",
    target_file: newName,
  });
await fetch("/api/cleanup-logs", {
  method: "POST",
});
  loadFiles();
}

  return (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
    }}
  >
  
  
    <Header
      tab={tab}
      setTab={setTab}
      openCriteria={() => setShowCriteria(true)}
    />

    <div
      style={{
        display: "flex",
        flex: 1,
      }}
    >
  
      <Sidebar />

      <main
        style={{
          flex: 1,
          minHeight: "100vh",
          background: "#f5f7fb",
          padding: "30px",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h1
            style={{
              fontSize: "32px",
              marginBottom: "20px",
            }}
          >
             📚 Học tập tốt
          </h1>
<div
  style={{
    background: "white",
    padding: "10px",
    borderRadius: "16px",
    marginBottom: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  }}
>
  <h3 style={{ marginTop: 0 }}>📝 Nhập Báo cáo Tiêu chí học tập tốt</h3>
 {lastSaved && (
    <span
      style={{
        fontSize: "12px",
        color: "#6e6c6c",
      }}
    >
      Cập nhật:{" "}
{lastSaved.toLocaleString("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})}
    </span>
  )}
<ReportEditor
  key="hoc-tap"
  value={report}
  onChange={setReport}
/>
<div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    marginTop: "16px",
  }}
>
<button
  onClick={async () => {
    if (!confirm("Tạo lại mẫu báo cáo?")) return;

    setReport(defaultReport);

    await supabase
      .from("reports")
      .upsert(
        {
          user_id: userId,
          criteria: "hoc-tap",
          content: defaultReport,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,criteria",
        }
      );

    setLastSaved(new Date());
  }}
  style={{
    padding: "6px 10px",
    background: "#fff",
    color: "#2563eb",
    border: "1px solid #2563eb",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
  }}
>
  ↺ Tạo lại mẫu
</button>
   <button
    onClick={saveReport}
    disabled={savingReport}
    style={{
      padding: "6px 12px",
      background: "#2563eb",
      color: "#fff",
      border: "1px solid #2563eb",
      borderRadius: "6px",
      cursor: savingReport ? "not-allowed" : "pointer",
      fontSize: "13px",
      fontWeight: 500,
      opacity: savingReport ? 0.7 : 1,
    }}
  >
    {savingReport ? "Đang lưu..." : "💾 Lưu"}
  </button>
</div>
</div>
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "16px",
              marginBottom: "20px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            }}
          >
          <div
  onDragOver={(e) => {
    e.preventDefault();
    setDragging(true);
  }}
  onDragLeave={() => {
    setDragging(false);
  }}
  onDrop={(e) => {
    e.preventDefault();
    setDragging(false);

    const file = e.dataTransfer.files?.[0];

    if (file) {
      uploadFile(file);
    }
  }}
  style={{
    border: dragging
      ? "3px solid #2563eb"
      : "2px dashed #94a3b8",
    borderRadius: "16px",
    padding: "16px",
    textAlign: "center",
    background: dragging
      ? "#eff6ff"
      : "#f8fafc",
    transition: "0.2s",
  }}
>
  <label
    style={{
      cursor: "pointer",
      display: "block",
    }}
  >
    <div
      style={{
        fontSize: "42px",
        marginBottom: "10px",
      }}
    >
      📤
    </div>

    <div
      style={{
        fontSize: "18px",
        fontWeight: "600",
      }}
    >
      Kéo thả file vào đây
    </div>

    <div
      style={{
        marginTop: "8px",
        color: "#64748b",
      }}
    >
      hoặc bấm để chọn file
    </div>

    <input
      type="file"
      onChange={handleUpload}
      style={{
        display: "none",
      }}
    />
  </label>
</div>
          </div>

          <h3>Danh sách minh chứng</h3>

          {files.length === 0 && (
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "12px",
                marginTop: "12px",
              }}
            >
              Chưa có minh chứng nào.
            </div>
          )}

{files.map((file) => {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL +
    `/storage/v1/object/public/Ho%20so%20SV5T/${userId}/hoc-tap/${file.name}`;

  return (
    <FileItem
      key={file.name}
      file={{
        ...file,
        storage_name: file.name,
        display_name:
          displayNames[file.name] ||
          file.name,
      }}
      url={url}
      onDelete={() => deleteFile(file.name)}
      onRename={renameFile}
    />
  );
})}
        </div>
      </main>
    </div>
     {showCriteria && (
      <CriteriaModal
        onClose={() => setShowCriteria(false)}
      />
    )}
    <Footer />
    </div>
  );
}