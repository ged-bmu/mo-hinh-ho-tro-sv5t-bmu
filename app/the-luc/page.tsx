"use client";

import FileItem from "../components/FileItem";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Sidebar from "../components/Sidebar";

export default function TheLucPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [userId, setUserId] = useState("");
  const [dragging, setDragging] = useState(false);
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
    .list(`${user.id}/the-luc`);

  if (data) {
    setFiles(data);
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
      `${user.id}/the-luc/${fileName}`,
      file,
      {
        upsert: true,
      }
    );

  if (error) {
    alert(error.message);
    return;
  }

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
      .remove([`${user.id}/the-luc/${name}`]);

    loadFiles();
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
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
             💪 Thể lực tốt
          </h1>

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
    `/storage/v1/object/public/Ho%20so%20SV5T/${userId}/the-luc/${file.name}`;

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
      </main>
    </div>
  );
}