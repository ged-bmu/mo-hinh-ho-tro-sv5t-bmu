"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { authFetch as fetch } from "../../lib/auth-fetch";
import Sidebar from "../components/Sidebar";
import FileItem from "../components/FileItem";
import CriteriaModal from "../components/CriteriaModal";
import BellUserTemp from "../components/BellUserTemp";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ReportEditor from "../components/ReportEditor";
import Spinner from "@/app/components/Spinner";
import Image from "next/image";
import { checkSubmissionAccess } from "../../lib/checkSubmissionAccess";

export default function TheLucPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState("");
  const [dragging, setDragging] = useState(false);
  const [showCriteria,setShowCriteria]=useState(false);
  const [tab, setTab] = useState("proof");
  const [displayNames, setDisplayNames] = useState<  Record<string, string>>({});
  const [report, setReport] = useState("");
  const [savingReport, setSavingReport] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showProfile, setShowProfile] = useState(false);

function sortFilesByName(fileList: any[]) {
  return [...fileList].sort((firstFile, secondFile) =>
    (firstFile.display_name || firstFile.storage_name || "").localeCompare(
      secondFile.display_name || secondFile.storage_name || "",
      "vi",
      { sensitivity: "base", numeric: true }
    )
  );
}

useEffect(() => {
  checkAccess();
}, []);

async function checkAccess() {
  const result = await checkSubmissionAccess();

  if (!result.allowed) {
    alert(result.message);
    window.location.href = "/tieuchi";
    return;
  }

  loadFiles();
}

async function loadFiles() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  setUserId(user.id);

  // Lấy file từ uploaded_files
  const { data: uploadedFiles, error } = await supabase
    .from("uploaded_files")
    .select(
      "id, storage_name, display_name, storage_type, drive_file_id, drive_url"
    )
    .eq("user_id", user.id)
    .eq("folder", "the-luc")
    .order("id", { ascending: false });

  if (error) {
    console.error("LOAD UPLOADED FILES ERROR:", error);
    return;
  }

  if (uploadedFiles) {
    setFiles(sortFilesByName(uploadedFiles));

    const map: Record<string, string> = {};

    uploadedFiles.forEach((f) => {
      map[f.storage_name] = f.display_name;
    });

    setDisplayNames(map);
  }

  // Lấy báo cáo
  const { data: reportData } = await supabase
    .from("reports")
    .select("content")
    .eq("user_id", user.id)
    .eq("criteria", "the-luc")
    .maybeSingle();

  setReport(reportData?.content ?? "");
}
async function saveReport() {
  if (!userId) return;

  setSavingReport(true);

  const { error } = await supabase
  .from("reports")
  .upsert(
    {
      user_id: userId,
      criteria: "the-luc",
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
  if (file.size <= 0 || file.size > 25 * 1024 * 1024) {
    alert("File phải lớn hơn 0 và không vượt quá 25 MB");
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  try {
    // ================================
    // 1. Lấy thông tin sinh viên
    // ================================
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("ho_ten, mssv, lop")
        .eq("id", user.id)
        .single();

    if (profileError || !profile) {
      console.error("Profile error:", profileError);
      alert("Không lấy được thông tin sinh viên");
      return;
    }

    // ================================
    // 2. Chuẩn bị dữ liệu Google Drive
    // ================================
    const formData = new FormData();

    formData.append("file", file);
    formData.append("mssv", profile.mssv);
    formData.append("ho_ten", profile.ho_ten);
    formData.append("criteria", "the-luc");

    // ================================
    // 3. Upload lên Google Drive
    // ================================
    const response = await fetch("/api/upload-drive", {
      method: "POST",
      body: formData,
    });

    const responseText = await response.text();
    let driveResult: any;

    try {
      driveResult = JSON.parse(responseText);
    } catch {
      throw new Error(
        responseText.includes("Request Entity")
          ? "File vượt quá giới hạn upload của máy chủ"
          : "Máy chủ trả về phản hồi không hợp lệ"
      );
    }

    if (!response.ok || !driveResult.success) {
      throw new Error(
        driveResult.error ||
          "Không thể upload lên Google Drive"
      );
    }

    console.log(
      "Google Drive upload:",
      driveResult
    );

    // ================================
    // 4. Tạo storage_name
    // ================================
    const safeName = file.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_");

    const fileName = `${Date.now()}-${safeName}`;

    // ================================
    // 5. Lưu thông tin vào Supabase
    // ================================
    const {
      data: insertedFile,
      error: insertError,
    } = await supabase
      .from("uploaded_files")
      .insert({
        user_id: user.id,
        folder: "the-luc",
        storage_name: fileName,
        display_name: file.name,
        storage_type: "google_drive",
        drive_file_id: driveResult.file.id,
        drive_url: driveResult.file.webViewLink,
      })
      .select()
      .single();

    console.log(
      "SUPABASE INSERT DATA:",
      insertedFile
    );

    console.log(
      "SUPABASE INSERT ERROR:",
      insertError
    );

    if (insertError) {
      throw new Error(
        `Lưu file vào Supabase thất bại: ${insertError.message}`
      );
    }

    // ================================
    // 6. Ghi log upload
    // ================================
    await supabase
      .from("activity_logs")
      .insert({
        user_id: user.id,
        ho_ten: profile.ho_ten,
        lop: profile.lop,
        action_type: "upload",
        target_folder: "the-luc",
        target_file: file.name,
      });

    // Không alert thành công
    loadFiles();
  } catch (error) {
    console.error(
      "Upload error:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : "Không thể upload file"
    );
  }
}
async function handleUpload(
  event: React.ChangeEvent<HTMLInputElement>
) {
  const file = event.target.files?.[0];

  if (!file) return;

  setUploading(true);

  try {
    await uploadFile(file);
  } finally {
    setUploading(false);
  }
}

async function deleteFile(storageName: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  try {
    // ================================
    // 1. Lấy bản ghi file
    // ================================
    const {
      data: fileRecord,
      error: findError,
    } = await supabase
      .from("uploaded_files")
      .select(
        "id, storage_name, display_name, drive_file_id"
      )
      .eq("user_id", user.id)
      .eq("folder", "the-luc")
      .eq("storage_name", storageName)
      .single();

    if (findError || !fileRecord) {
      throw new Error(
        "Không tìm thấy thông tin file"
      );
    }

    // ================================
    // 2. Xóa Google Drive
    // ================================
    if (fileRecord.drive_file_id) {
      const response = await fetch(
        "/api/delete-drive",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileId: fileRecord.drive_file_id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Không thể xóa file trên Google Drive"
        );
      }
    }

    // ================================
    // 3. Xóa Supabase record
    // ================================
    const { error: dbError } =
      await supabase
        .from("uploaded_files")
        .delete()
        .eq("id", fileRecord.id)
        .eq("user_id", user.id);

    if (dbError) {
      throw new Error(
        "Đã xóa file trên Drive nhưng không thể xóa dữ liệu Supabase: " +
          dbError.message
      );
    }

    // ================================
    // 4. Cập nhật UI ngay
    // ================================
    setFiles((prevFiles) =>
      prevFiles.filter(
        (item) => item.id !== fileRecord.id
      )
    );

    setDisplayNames((prev) => {
      const updated = { ...prev };
      delete updated[fileRecord.storage_name];
      return updated;
    });

    // ================================
    // 5. Lấy profile
    // ================================
    const { data: profile } =
      await supabase
        .from("profiles")
        .select("ho_ten, lop")
        .eq("id", user.id)
        .single();

    // ================================
    // 6. Ghi log
    // ================================
    await supabase
      .from("activity_logs")
      .insert({
        user_id: user.id,
        ho_ten: profile?.ho_ten,
        lop: profile?.lop,
        action_type: "delete",
        target_folder: "the-luc",
        target_file:
          fileRecord.display_name ||
          fileRecord.storage_name,
      });

  } catch (error) {
    console.error(
      "Delete error:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : "Không thể xóa file"
    );
  }
}
async function renameFile(file: any) {
  const currentName =
    file.display_name || file.name;

  const ext = currentName.includes(".")
    ? currentName.slice(
        currentName.lastIndexOf(".")
      )
    : "";

  const currentNameWithoutExt =
    currentName.replace(/\.[^/.]+$/, "");

  const input = prompt(
    "Nhập tên mới:",
    currentNameWithoutExt
  );

  if (!input || !input.trim()) return;

  const newName = input.trim() + ext;

  try {
    // ================================
    // 1. Đổi tên trên Google Drive
    // ================================
    if (file.drive_file_id) {
      const response = await fetch(
        "/api/rename-drive",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileId: file.drive_file_id,
            newName,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Không thể đổi tên file trên Google Drive"
        );
      }
    }

    // ================================
    // 2. Đổi tên trong Supabase
    // ================================
    const { error: updateError } =
      await supabase
        .from("uploaded_files")
        .update({
          display_name: newName,
        })
        .eq("id", file.id)
        .eq("user_id", userId);

    if (updateError) {
      throw new Error(
        "Đã đổi tên Google Drive nhưng không thể cập nhật tên hiển thị: " +
          updateError.message
      );
    }

    // ================================
    // 3. Cập nhật UI
    // ================================
    setFiles((prevFiles) =>
      sortFilesByName(
        prevFiles.map((item) =>
          item.id === file.id
            ? {
                ...item,
                display_name: newName,
              }
            : item
        )
      )
    );

    setDisplayNames((prev) => ({
      ...prev,
      [file.storage_name]: newName,
    }));

    // ================================
    // 4. Lấy profile
    // ================================
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } =
      await supabase
        .from("profiles")
        .select("ho_ten, lop")
        .eq("id", user?.id)
        .single();

    // ================================
    // 5. Ghi log
    // ================================
    await supabase
      .from("activity_logs")
      .insert({
        user_id: user?.id,
        ho_ten: profile?.ho_ten,
        lop: profile?.lop,
        action_type: "rename",
        target_folder: "the-luc",
        target_file: newName,
      });

  } catch (error) {
    console.error(
      "Rename error:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : "Không thể đổi tên file"
    );
  }
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

  openProfile={() => setShowProfile(true)}

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
          <button
            type="button"
            onClick={() => (window.location.href = "/tieuchi")}
            style={{
              display: "inline-block",
              marginRight: "12px",
              marginBottom: "20px",
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              background: "#e5e7eb",
              color: "#111827",
              cursor: "pointer",
            }}
          >
            ← Quay lại
          </button>

          <h1
            style={{
              display: "inline-block",
              fontSize: "32px",
              marginBottom: "20px",
            }}
          >
             <Image src="/icontheluc.png" width={32} height={32} alt="Thể lực tốt" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }} /> Thể lực tốt
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
  <h3 style={{ marginTop: 0 }}>📝 Nhập Báo cáo Tiêu chí Thể lực tốt</h3>
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
{uploading ? (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "12px",
    }}
  >
    <Spinner size={32} />

    <Spinner size={20} />
  </div>
) : (
  <>
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
  </>
)}


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
  const fileUrl =
    file.storage_type === "google_drive"
      ? `/api/view-drive?fileId=${encodeURIComponent(
          file.drive_file_id
        )}`
      : supabase.storage
          .from("Ho so SV5T")
          .getPublicUrl(
            `${userId}/the-luc/${file.storage_name}`
          ).data.publicUrl;

  return (
    <FileItem
      key={file.id}
      file={{
        ...file,
        name:
          file.display_name ||
          file.storage_name,
        storage_name: file.storage_name,
        display_name:
          file.display_name ||
          file.storage_name,
      }}
      url={fileUrl}
      onDelete={() =>
        deleteFile(file.storage_name)
      }
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