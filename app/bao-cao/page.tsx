"use client";

import FileItem from "../components/FileItem";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Sidebar from "../components/Sidebar";

export default function BaoCaoPage() {
const [profile, setProfile] = useState<any>(null);
const [loading, setLoading] = useState(true);

const [files, setFiles] = useState<any[]>([]);
const [userId, setUserId] = useState("");
const [dragging, setDragging] = useState(false);

useEffect(() => {
loadData();
}, []);

async function loadData() {
try {
const {
data: {user},
} = await supabase.auth.getUser();

  if (!user) return;
console.log("USER ID =", user.id);
  setUserId(user.id);

const { data, error } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .single();
console.log("PROFILE =", data);
console.log("ERROR =", error);
  const { data: fileData } = await supabase.storage
    .from("Ho so SV5T")
    .list(`${user.id}/bao-cao`);

  if (fileData) {
    setFiles(fileData);
  }
  if (data) {
  setProfile(data);
}

  setLoading(false);
} catch (err) {
  console.error(err);
  setLoading(false);
}

}
async function uploadFile(file: File) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const fileName =
    Date.now() +
    "-" +
    file.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replaceAll(" ", "_");

  const { error } = await supabase.storage
    .from("Ho so SV5T")
    .upload(
      `${user.id}/bao-cao/${fileName}`,
      file,
      {
        upsert: true,
      }
    );

  if (error) {
    alert(error.message);
    return;
  }

  loadData();
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

if (!user) return;

const { error } = await supabase.storage
  .from("Ho so SV5T")
  .remove([
    `${user.id}/bao-cao/${name}`,
  ]);

if (error) {
  alert(error.message);
  return;
}

loadData();
}

return (
<div
style={{
display: "flex",
minHeight: "100vh",
}}
> <Sidebar />

  <main
    style={{
      flex: 1,
      background: "#f5f7fb",
      padding: "30px",
    }}
  >
    {loading ? (
      <div>Đang tải...</div>
    ) : (
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
<div
  style={{
    background: "white",
    padding: "24px",
    borderRadius: "20px",
    marginBottom: "25px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
  }}
>
          <h1
            style={{
              marginBottom: "25px",
              fontSize: "24px",
            }}
          >
            📑 Hồ sơ Sinh viên 5 tốt cấp Trường
          </h1>

 <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(2,1fr)",
    gap: "20px",
    marginTop: "20px",
  }}
>
  <div>Sinh viên: <b>{profile?.ho_ten}</b></div>

  <div>Mã số sinh viên: <b>{profile?.mssv}</b></div>

  <div>Chi hội: <b>{profile?.lop}</b></div>

  <div>Gmail: {profile?.email || "Chưa cập nhật"}</div>
</div>
        </div>

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "16px",
            marginBottom: "20px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >
        <h3
  style={{
    marginBottom: "15px",
  }}
>
  📤 Tải báo cáo lên
</h3>

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
    padding: "20px",
    textAlign: "center",
    background: dragging
      ? "#eff6ff"
      : "#f8fafc",
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
        fontSize: "28px",
        marginBottom: "10px",
      }}
    >
      📤
    </div>

    <div
      style={{
        fontSize: "16px",
        fontWeight: "600",
      }}
    >
      Kéo thả báo cáo vào đây
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

        <h3
  style={{
    marginBottom: "15px",
  }}
>
  📁 Danh sách báo cáo
</h3>

        {files.length === 0 && (
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
            }}
          >
            Chưa có báo cáo nào.
          </div>
        )}
{files.map((file) => {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL +
    "/storage/v1/object/public/Ho%20so%20SV5T/" +
    userId +
    "/bao-cao/" +
    file.name;

  return (
    <FileItem
      key={file.name}
      file={file}
      url={url}
      onDelete={() => deleteFile(file.name)}
    />
  );
})}

</div>
)}
</main>
</div>

);
}