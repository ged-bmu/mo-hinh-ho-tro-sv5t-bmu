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

export default function HoiNhapPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [userId, setUserId] = useState("");
  const [dragging, setDragging] = useState(false);
  const [showCriteria,setShowCriteria]=useState(false);
  const [tab, setTab] = useState("proof");
  const [displayNames, setDisplayNames] = useState<  Record<string, string>>({});
  const [report, setReport] = useState("");
  const [savingReport, setSavingReport] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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
    .list(`${user.id}/hoi-nhap`);

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
      .eq("folder", "hoi-nhap");

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
  .eq("criteria", "hoi-nhap")
  .maybeSingle();

setReport(reportData?.content ?? "");
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
      criteria: "hoi-nhap",
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
    `${user.id}/hoi-nhap/${fileName}`,
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
    folder: "hoi-nhap",
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

    target_folder: "hoi-nhap",
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
      .remove([`${user.id}/hoi-nhap/${name}`]);
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

    target_folder: "hoi-nhap",
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

    target_folder: "hoi-nhap",
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
             🌏 Hội nhập tốt
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
  <h3 style={{ marginTop: 0 }}>📝 Nhập Báo cáo Tiêu chí Hội nhập tốt</h3>
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
  value={report}
  onChange={setReport}
/>
<div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: "16px",
  }}
>
  <button
    onClick={saveReport}
    disabled={savingReport}
    style={{
      padding: "6px 14px",
      background: "#2563eb",
      color: "#fff",
      border: "1px solid #2563eb",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: 500,
    }}
  >
    {savingReport ? "Đang lưu..." : <b>💾 Lưu</b>}
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
    `/storage/v1/object/public/Ho%20so%20SV5T/${userId}/hoi-nhap/${file.name}`;

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