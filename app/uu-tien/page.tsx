"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { authFetch as fetch } from "../../lib/auth-fetch";
import { checkSubmissionAccess } from "../../lib/checkSubmissionAccess";
import Image from "next/image";
import Sidebar from "../components/Sidebar";
import FileItem from "../components/FileItem";
import CriteriaModal from "../components/CriteriaModal";
import BellUserTemp from "../components/BellUserTemp";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ReportEditor from "../components/ReportEditor";
import EvidenceReportModal from "../components/EvidenceReportModal";
import Spinner from "../components/Spinner";

function getPlainText(html: string) {
  const doc = new DOMParser().parseFromString(html || "", "text/html");

  return (doc.body.textContent || "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildReportWithEvidence(
  originalReport: string,
  evidenceFiles: any[],
  previousFiles: any[] = evidenceFiles
) {
  const doc = new DOMParser().parseFromString(
    originalReport || "",
    "text/html"
  );

  // Lấy nội dung báo cáo của cả danh sách cũ và mới
  const evidenceContents = [
    ...previousFiles,
    ...evidenceFiles,
  ]
    .map((file) => getPlainText(file.report_content || ""))
    .filter(Boolean);

  // Xóa các đoạn minh chứng đã được ghép trước đó
  doc.body.querySelectorAll("p").forEach((paragraph) => {
    const paragraphText = (paragraph.textContent || "")
      .replace(/^\s*\d+\.\s*/, "")
      .replace(/\s+/g, " ")
      .trim();

    if (
      evidenceContents.some(
        (content) => content === paragraphText
      )
    ) {
      paragraph.remove();
    }
  });

  // Xóa các đoạn chỉ còn số thứ tự
  doc.body.querySelectorAll("p").forEach((paragraph) => {
    if (/^\s*\d+\.\s*$/.test(paragraph.textContent || "")) {
      paragraph.remove();
    }
  });

  const manualContent = doc.body.innerHTML.trim();

  // Sắp xếp minh chứng theo thứ tự file
  const sortedFiles = [...evidenceFiles].sort(
    (a, b) =>
      (a.sort_order ?? 999999) -
      (b.sort_order ?? 999999)
  );

  // Tạo lại báo cáo minh chứng
  const numberedReports = sortedFiles
    .filter((file) => file.report_content?.trim())
    .map((file, index) => {
      const contentDoc = new DOMParser().parseFromString(
        file.report_content,
        "text/html"
      );

      const content = contentDoc.body.innerHTML
  .replace(/<p\b[^>]*>/gi, "")
  .replace(/<\/p>/gi, "<br>")
  .replace(/(<br>\s*)+$/gi, "")
  .trim();

      const order = index + 1;

      return `<p>${order}. ${content}</p>`;
    });

  return [
    manualContent,
    ...numberedReports,
  ]
    .filter(Boolean)
    .join("\n");
}

function UuTienPage() {
  const searchParams = useSearchParams();
  const yearId = searchParams.get("year");
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState("");
  const [dragging, setDragging] = useState(false);
  const [showCriteria,setShowCriteria]=useState(false);
  const [tab, setTab] = useState("proof");
  const [displayNames, setDisplayNames] = useState<  Record<string, string>>({});
  const [report, setReport] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);

async function loadAcademicYear() {
  const { data, error } = await supabase
    .from("academic_years")
    .select("id, name")
    .eq("id", Number(yearId))
    .single();

  if (error) {
    console.error("Lỗi lấy năm học:", error);
    return null;
  }

  return data;
}
useEffect(() => {
  if (!yearId) return;

  checkAccess();
}, [yearId]);

async function checkAccess() {
  const result = await checkSubmissionAccess(Number(yearId));

  if (!result.allowed) {
    alert(result.message);
    window.location.href = "/tieuchi";
    return;
  }

  const academicYear = await loadAcademicYear();

  if (!academicYear) {
    alert("Không xác định được năm học.");
    return;
  }

  await loadFiles(academicYear.name);
}

async function loadFiles(academicYearName?: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  setUserId(user.id);

  // Lấy file từ uploaded_files
  const { data: uploadedFiles, error } = await supabase
    .from("uploaded_files")
    .select(
      "id, storage_name, display_name, storage_type, drive_file_id, drive_url, sort_order, report_content"
    )
    .eq("user_id", user.id)
.eq("folder", "uu-tien")
.eq("academic_year_id", Number(yearId))
.order("sort_order", { ascending: true })
.order("id", { ascending: false });

  if (error) {
    console.error("LOAD UPLOADED FILES ERROR:", error);
    return;
  }

  if (uploadedFiles) {
    setFiles([...(uploadedFiles || [])].sort((a, b) => (a.sort_order ?? 999999) - (b.sort_order ?? 999999)));

    const map: Record<string, string> = {};

    uploadedFiles.forEach((f) => {
      map[f.storage_name] = f.display_name;
    });

    setDisplayNames(map);
  }

  // ================================
  // Lấy báo cáo
  // ================================
const { data: reportData } = await supabase
  .from("reports")
  .select("content")
  .eq("user_id", user.id)
  .eq("criteria", "uu-tien")
  .eq("academic_year_id", Number(yearId))
  .maybeSingle();

setReport(reportData?.content?.trim() ? reportData.content : "");
}
async function syncEvidenceReports(
  nextFiles: any[],
  previousFiles: any[] = files
) {
  const mergedReport = buildReportWithEvidence(
    report,
    nextFiles,
    previousFiles
  );

  const { error } = await supabase
    .from("reports")
    .upsert(
      {
        user_id: userId,
        criteria: "uu-tien",
        academic_year_id: Number(yearId),
        content: mergedReport,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,criteria,academic_year_id",
      }
    );

  if (error) {
    throw new Error(
      "Không thể đồng bộ báo cáo minh chứng: " + error.message
    );
  }

  setLastSaved(new Date());
}
// Lưu đồng thời tên file và báo cáo minh chứng
const saveEvidenceChanges = async (
  file: any,
  inputName: string,
  content: string
) => {
  const trimmedName = inputName.trim();

  if (!trimmedName) {
    throw new Error("Tên file không được để trống.");
  }

  try {
    // 1. Lấy thông tin file chính xác trong năm học
    const { data: fileRecord, error: findError } =
      await supabase
        .from("uploaded_files")
        .select("id, storage_name, display_name, drive_file_id")
        .eq("id", file.id)
        .eq("user_id", userId)
        .eq("folder", "uu-tien")
        .eq("academic_year_id", Number(yearId))
        .single();

    if (findError || !fileRecord) {
      throw new Error("Không tìm thấy file minh chứng.");
    }

    // 2. Giữ nguyên phần mở rộng của file
    const oldName =
      fileRecord.display_name || fileRecord.storage_name;

    const ext = oldName.includes(".")
      ? oldName.slice(oldName.lastIndexOf("."))
      : "";

    let newName = trimmedName;

    if (ext && !newName.toLowerCase().endsWith(ext.toLowerCase())) {
      newName = newName.replace(/\.[^/.]+$/, "") + ext;
    }

    const nameChanged = newName !== oldName;

    // 3. Nếu đổi tên thì cập nhật Google Drive
    if (nameChanged && fileRecord.drive_file_id) {
      const response = await fetch("/api/rename-drive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId: fileRecord.drive_file_id,
          newName,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Không thể đổi tên file trên Google Drive."
        );
      }
    }

    // 4. Cập nhật tên và báo cáo trong Supabase
    const { error: updateError } = await supabase
      .from("uploaded_files")
      .update({
        display_name: newName,
        report_content: content,
      })
      .eq("id", fileRecord.id)
      .eq("user_id", userId)
      .eq("academic_year_id", Number(yearId));

    if (updateError) {
      throw new Error(
        "Không thể lưu thay đổi: " + updateError.message
      );
    }

    // 5. Cập nhật giao diện, giữ nguyên thứ tự minh chứng
const nextFiles = files.map((item) =>
  item.id === fileRecord.id
    ? {
        ...item,
        display_name: newName,
        report_content: content,
      }
    : item
);

setFiles(nextFiles);

await syncEvidenceReports(nextFiles, files);

setReport(
  buildReportWithEvidence(report, nextFiles, files)
);
    setDisplayNames((prev) => ({
      ...prev,
      [fileRecord.storage_name]: newName,
    }));

    // 6. Ghi nhật ký nếu có đổi tên
    if (nameChanged) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("ho_ten, lop")
        .eq("id", userId)
        .single();

      await supabase.from("activity_logs").insert({
        user_id: userId,
        ho_ten: profile?.ho_ten,
        lop: profile?.lop,
        action_type: "rename",
        target_folder: "uu-tien",
        target_file: newName,
      });
    }

    // 7. Đóng modal
    setSelectedEvidence(null);

  } catch (error) {
    console.error("Save evidence changes error:", error);
    throw error;
  }
};


// Đổi thứ tự minh chứng
const moveEvidence = async (
  fileId: string,
  direction: "up" | "down"
) => {
  const currentFiles = [...files].sort(
    (a, b) =>
      (a.sort_order ?? 999999) -
      (b.sort_order ?? 999999)
  );

  const index = currentFiles.findIndex(
    (file) => file.id === fileId
  );

  if (index < 0) return;

  const targetIndex =
    direction === "up" ? index - 1 : index + 1;

  if (
    targetIndex < 0 ||
    targetIndex >= currentFiles.length
  ) {
    return;
  }

  const first = currentFiles[index];
  const second = currentFiles[targetIndex];

  const firstOrder = index + 1;
  const secondOrder = targetIndex + 1;

  const { error: error1 } = await supabase
    .from("uploaded_files")
    .update({ sort_order: secondOrder })
    .eq("id", first.id)
    .eq("user_id", userId);

  if (error1) {
    alert("Không thể đổi thứ tự: " + error1.message);
    return;
  }

  const { error: error2 } = await supabase
    .from("uploaded_files")
    .update({ sort_order: firstOrder })
    .eq("id", second.id)
    .eq("user_id", userId);

  if (error2) {
    alert("Không thể đổi thứ tự: " + error2.message);
    await loadFiles();
    return;
  }

  const nextFiles = [...currentFiles];

  [nextFiles[index], nextFiles[targetIndex]] = [
    nextFiles[targetIndex],
    nextFiles[index],
  ];

  const normalizedFiles = nextFiles.map(
    (file, position) => ({
      ...file,
      sort_order: position + 1,
    })
  );

setFiles(normalizedFiles);

try {
  await syncEvidenceReports(normalizedFiles, files);

  setReport(
    buildReportWithEvidence(report, normalizedFiles, files)
  );
} catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Không thể cập nhật báo cáo."
    );
  }
};
async function uploadFile(file: File) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  try {
    // ================================
    // 1. GIỚI HẠN FILE
    // ================================
    const MAX_FILE_SIZE = 25 * 1024 * 1024;

    if (file.size <= 0) {
      throw new Error("File không hợp lệ");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File không được vượt quá 25 MB");
    }

    // ================================
    // 2. LẤY THÔNG TIN SINH VIÊN
    // ================================
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("ho_ten, mssv, lop")
        .eq("id", user.id)
        .single();

    if (profileError || !profile) {
      console.error("Profile error:", profileError);
      throw new Error("Không lấy được thông tin sinh viên");
    }

    // ================================
    // 3. KHỞI TẠO GOOGLE DRIVE SESSION
    // ================================
    const initResponse = await fetch(
      "/api/upload-drive/init",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          mimeType:
            file.type || "application/octet-stream",
          mssv: profile.mssv,
          ho_ten: profile.ho_ten,
          criteria: "uu-tien",
          academic_year_id: Number(yearId),
        }),
      }
    );

    const initResult = await initResponse.json();

    if (!initResponse.ok || !initResult.success) {
      throw new Error(
        initResult.error ||
          "Không thể khởi tạo upload Google Drive"
      );
    }

    const uploadUrl = initResult.uploadUrl;

    if (!uploadUrl) {
      throw new Error(
        "Không nhận được upload URL từ Google Drive"
      );
    }

    // ================================
    // 4. CHIA FILE THÀNH CHUNK
    // ================================
    const CHUNK_SIZE = 16 * 1024 * 1024; // 16 MB

    let start = 0;
    let driveFile: any = null;

    while (start < file.size) {
      const end = Math.min(
        start + CHUNK_SIZE,
        file.size
      );

      const chunk = file.slice(start, end);

      const contentRange =
        `bytes ${start}-${end - 1}/${file.size}`;

      console.log(
        `Upload chunk: ${start}-${end - 1}/${file.size}`
      );

      // ================================
      // 5. GỬI CHUNK QUA VERCEL API
      // ================================
      const chunkResponse = await fetch(
        "/api/upload-drive/chunk",
        {
          method: "POST",
          headers: {
            "Content-Type":
              file.type || "application/octet-stream",

            "Content-Length": String(
              chunk.size
            ),

            "Content-Range": contentRange,

            "X-Upload-Url": uploadUrl,
          },
          body: chunk,
        }
      );

      const chunkResult =
        await chunkResponse.json();

      if (
        !chunkResponse.ok ||
        !chunkResult.success
      ) {
        throw new Error(
          chunkResult.error ||
            `Upload chunk thất bại (${chunkResponse.status})`
        );
      }

      // ================================
      // 6. KIỂM TRA HOÀN THÀNH
      // ================================
      if (chunkResult.completed) {
        driveFile = chunkResult.file;
        break;
      }

      // Chunk tiếp theo
      start = end;
    }

    if (!driveFile?.id) {
      throw new Error(
        "Google Drive không trả về thông tin file sau khi upload"
      );
    }

    console.log(
      "Google Drive upload thành công:",
      driveFile
    );

    // ================================
    // 7. TẠO TÊN LƯU TRONG SUPABASE
    // ================================
    const safeName = file.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

    const fileName =
      `${Date.now()}-${safeName}`;

    // ================================
    // 8. LƯU FILE VÀO SUPABASE
    // ================================
    const nextOrder = files.length > 0 ? Math.max(...files.map((item) => item.sort_order ?? 0)) + 1 : 1;

    const {
      data: insertedFile,
      error: insertError,
    } = await supabase
      .from("uploaded_files")
      .insert({
        user_id: user.id,
        folder: "uu-tien",
        academic_year_id: Number(yearId),
        storage_name: fileName,
        display_name: file.name,
        storage_type: "google_drive",
        drive_file_id: driveFile.id,
        drive_url:
          driveFile.webViewLink ||
          `https://drive.google.com/file/d/${driveFile.id}/view`,
        sort_order: nextOrder,
        report_content: "",
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(
        `Lưu file vào Supabase thất bại: ${insertError.message}`
      );
    }

    console.log(
      "Đã lưu uploaded_files:",
      insertedFile
    );

    // ================================
    // 9. GHI LOG
    // ================================
    await supabase
      .from("activity_logs")
      .insert({
        user_id: user.id,
        ho_ten: profile.ho_ten,
        lop: profile.lop,
        action_type: "upload",
        target_folder: "uu-tien",
        target_file: file.name,
      });

    // ================================
    // 10. LOAD LẠI DANH SÁCH
    // ================================
    await loadFiles();
    setSelectedEvidence(insertedFile);

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
    // 1. Lấy đúng file của đúng năm học
    // ================================
    const { data: fileRecord, error: findError } =
      await supabase
        .from("uploaded_files")
        .select(
          "id, storage_name, display_name, drive_file_id"
        )
        .eq("user_id", user.id)
        .eq("folder", "uu-tien")
        .eq("academic_year_id", Number(yearId))
        .eq("storage_name", storageName)
        .single();

    if (findError || !fileRecord) {
      throw new Error("Không tìm thấy thông tin file");
    }

    // ================================
    // 2. Xóa trên Google Drive trước
    // ================================
    if (fileRecord.drive_file_id) {
      const response = await fetch("/api/delete-drive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId: fileRecord.drive_file_id,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Không thể xóa file trên Google Drive"
        );
      }
    }

    // ================================
    // 3. Xóa bản ghi trong Supabase
    // ================================
    const { error: dbError } = await supabase
      .from("uploaded_files")
      .delete()
      .eq("id", fileRecord.id)
      .eq("user_id", user.id)
      .eq("academic_year_id", Number(yearId));

    if (dbError) {
      throw new Error(
        "Đã xóa file trên Google Drive nhưng không thể xóa dữ liệu hệ thống: " +
          dbError.message
      );
    }

    // ================================
    // 4. Cập nhật UI
    // ================================
    const remainingFiles = files
  .filter((item) => item.id !== fileRecord.id)
  .sort(
    (a, b) =>
      (a.sort_order ?? 999999) -
      (b.sort_order ?? 999999)
  );

const normalizedFiles = remainingFiles.map(
  (item, index) => ({
    ...item,
    sort_order: index + 1,
  })
);

setFiles(normalizedFiles);

// Đánh số lại trong cơ sở dữ liệu
for (const item of normalizedFiles) {
  const { error } = await supabase
    .from("uploaded_files")
    .update({ sort_order: item.sort_order })
    .eq("id", item.id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(
      "Không thể cập nhật thứ tự sau khi xóa: " +
        error.message
    );
  }
}

await syncEvidenceReports(normalizedFiles);

    setDisplayNames((prev) => {
      const updated = { ...prev };
      delete updated[fileRecord.storage_name];
      return updated;
    });

    // ================================
    // 5. Lấy thông tin sinh viên để ghi log
    // ================================
    const { data: profile } = await supabase
      .from("profiles")
      .select("ho_ten, lop")
      .eq("id", user.id)
      .single();

    // ================================
    // 6. Ghi log
    // ================================
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      ho_ten: profile?.ho_ten,
      lop: profile?.lop,
      action_type: "delete",
      target_folder: "uu-tien",
      target_file:
        fileRecord.display_name ||
        fileRecord.storage_name,
    });

    // ================================
    // 7. Load lại danh sách
    // ================================
    await loadFiles();

  } catch (error) {
    console.error("Delete error:", error);

    alert(
      error instanceof Error
        ? error.message
        : "Không thể xóa file"
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
             <Image src="/iconuutien.png" width={32} height={32} alt="Thành tích khác tốt" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }} /> Thành tích khác tốt
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
  <h3 style={{ marginTop: 0 }}>📝 Nhập Báo cáo Tiêu chí Thành tích khác tốt</h3>
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
  key={`uu-tien-${yearId}`}
  value={report}
  onChange={setReport}
  editable={false}
/>
<div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    marginTop: "16px",
  }}
>

  
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

{files.map((file, index) => {
  const fileUrl =
    file.storage_type === "google_drive"
      ? `/api/view-drive?fileId=${encodeURIComponent(
          file.drive_file_id
        )}`
      : supabase.storage
          .from("Ho so SV5T")
          .getPublicUrl(
            `${userId}/uu-tien/${file.storage_name}`
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
onRename={(file) =>
  setSelectedEvidence({
    ...file,
    folder: "uu-tien",
  })
      }
  orderNumber={index + 1}
  isFirst={index === 0}
  onMoveUp={() => moveEvidence(file.id, "up")}
  onMoveDown={() => moveEvidence(file.id, "down")}
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
    {selectedEvidence && (
      <EvidenceReportModal
        file={selectedEvidence}
        url={
          selectedEvidence.storage_type === "google_drive"
            ? `/api/view-drive?fileId=${encodeURIComponent(selectedEvidence.drive_file_id)}`
            : supabase.storage
                .from("Ho so SV5T")
                .getPublicUrl(`${userId}/uu-tien/${selectedEvidence.storage_name}`).data.publicUrl
        }
        orderNumber={files.findIndex((item) => item.id === selectedEvidence.id) + 1}
        reportContent={selectedEvidence.report_content || ""}
        onSave={(newName, content) => saveEvidenceChanges(selectedEvidence, newName, content)}
        onClose={() => setSelectedEvidence(null)}
      />
    )}
    </div>
  );
}
export default function UuTienPageWrapper() {
  return (
    <Suspense fallback={null}>
      <UuTienPage />
    </Suspense>
  );
}