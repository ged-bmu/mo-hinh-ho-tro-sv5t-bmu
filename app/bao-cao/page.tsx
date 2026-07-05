"use client";

import FileItem from "../components/FileItem";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Sidebar from "../components/Sidebar";
import CriteriaModal from "../components/CriteriaModal";
import BellUserTemp from "../components/BellUserTemp";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Spinner from "../components/Spinner";

export default function BaoCaoPage() {
const [profile, setProfile] = useState<any>(null);
const [loading, setLoading] = useState(true);
const [showCriteria,setShowCriteria]=useState(false);
const [tab, setTab] = useState("proof");
const [displayNames, setDisplayNames] =
  useState<Record<string, string>>(
    {}
  );
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
if (data) {
  setProfile(data);
}
  const { data: fileData } = await supabase.storage
    .from("Ho so SV5T")
    .list(`${user.id}/bao-cao`);

  if (fileData) {
    setFiles(fileData);
  }
  const { data: uploadedFiles } =
  await supabase
    .from("uploaded_files")
    .select(
      "storage_name, display_name"
    )
    .eq("folder", "bao-cao");

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
}

  setLoading(false);
} catch (err) {
  console.error(err);
  setLoading(false);
}

}
async function uploadFile(file: File) {
  console.log("UPLOAD FILE DUOC GOI");
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
      `${user.id}/bao-cao/${fileName}`,
      file,
      {
        upsert: true,
      }
    );
    await supabase
  .from("uploaded_files")
  .insert({
    user_id: user.id,
    folder: "bao-cao",
    storage_name: fileName,
    display_name: file.name,
  });
console.log("TOI DANG GHI LOG");
const result = await supabase
  .from("activity_logs")
  .insert({
    user_id: user.id,
    ho_ten: profile?.ho_ten || "test",
    lop: profile?.lop || "test",
    

    action_type: "upload",

    target_folder: "bao-cao",
    target_file: file.name,
  });
  await fetch("/api/cleanup-logs", {
  method: "POST",
});
  

console.log("LOG RESULT =", result);

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
await supabase
  .from("activity_logs")
  .insert({
    user_id: user.id,
    ho_ten: profile?.ho_ten,
    lop: profile?.lop,

    action_type: "delete",

    target_folder: "bao-cao",
    target_file: name,
  });
  await fetch("/api/cleanup-logs", {
  method: "POST",
});

loadData();
}
async function renameFile(file: any) {
  const newName = prompt(
    "Nhập tên mới:",
    file.display_name
  );
    if (!newName) return;

  await supabase
    .from("uploaded_files")
    .update({
      display_name: newName,
    })
    await supabase
  .from("activity_logs")
  .insert({
    user_id: userId,
    ho_ten: profile?.ho_ten,
    lop: profile?.lop,

    action_type: "rename",

    target_folder: "bao-cao",
    target_file: newName,
  })
  
    .eq(
      "storage_name",
      file.storage_name || file.name
    );
    await fetch("/api/cleanup-logs", {
  method: "POST",
});

  loadData();
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
      background: "#f5f7fb",
      padding: "30px",
    }}
  >
    {loading ? (
  <div
    style={{
      minHeight: "300px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Spinner />
  </div>
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
    )}       
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
                       