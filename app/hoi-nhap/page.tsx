"use client";

import { Suspense, useEffect, useState, useRef } from "react";
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

  // Láº¥y ná»™i dung bÃ¡o cÃ¡o cá»§a cáº£ danh sÃ¡ch cÅ© vÃ  má»›i
  const evidenceContents = [
    ...previousFiles,
    ...evidenceFiles,
  ]
    .map((file) => getPlainText(file.report_content || ""))
    .filter(Boolean);

  // XÃ³a cÃ¡c Ä‘oáº¡n minh chá»©ng Ä‘Ã£ Ä‘Æ°á»£c ghÃ©p trÆ°á»›c Ä‘Ã³
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

  // XÃ³a cÃ¡c Ä‘oáº¡n chá»‰ cÃ²n sá»‘ thá»© tá»±
  doc.body.querySelectorAll("p").forEach((paragraph) => {
    if (/^\s*\d+\.\s*$/.test(paragraph.textContent || "")) {
      paragraph.remove();
    }
  });

  const manualContent = doc.body.innerHTML.trim();

  // Sáº¯p xáº¿p minh chá»©ng theo thá»© tá»± file
  const sortedFiles = [...evidenceFiles].sort(
    (a, b) =>
      (a.sort_order ?? 999999) -
      (b.sort_order ?? 999999)
  );

  // Táº¡o láº¡i bÃ¡o cÃ¡o minh chá»©ng
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

function HoiNhapPage() {
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
  const filesRef = useRef<any[]>([]);
  const deletingRef = useRef<Set<string>>(new Set());
  const [deletingFiles, setDeletingFiles] = useState<string[]>([]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);


async function loadAcademicYear() {
  const { data, error } = await supabase
    .from("academic_years")
    .select("id, name")
    .eq("id", Number(yearId))
    .single();

  if (error) {
    console.error("Lá»—i láº¥y nÄƒm há»c:", error);
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
    alert("KhÃ´ng xÃ¡c Ä‘á»‹nh Ä‘Æ°á»£c nÄƒm há»c.");
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

  // Láº¥y file tá»« uploaded_files
  const { data: uploadedFiles, error } = await supabase
    .from("uploaded_files")
    .select(
      "id, storage_name, display_name, storage_type, drive_file_id, drive_url, sort_order, report_content"
    )
    .eq("user_id", user.id)
.eq("folder", "hoi-nhap")
.eq("academic_year_id", Number(yearId))
.order("sort_order", { ascending: true })
.order("id", { ascending: false });

  if (error) {
    console.error("LOAD UPLOADED FILES ERROR:", error);
    return;
  }

  if (uploadedFiles) {
    const sortedFiles = [...uploadedFiles].sort(
      (a, b) =>
        (a.sort_order ?? 999999) -
        (b.sort_order ?? 999999)
    );

    setFiles(sortedFiles);
    filesRef.current = sortedFiles;

    const map: Record<string, string> = {};

    uploadedFiles.forEach((f) => {
      map[f.storage_name] = f.display_name;
    });

    setDisplayNames(map);
  }

  // ================================
  // Láº¥y bÃ¡o cÃ¡o
  // ================================
const { data: reportData } = await supabase
  .from("reports")
  .select("content")
  .eq("user_id", user.id)
  .eq("criteria", "hoi-nhap")
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
        criteria: "hoi-nhap",
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
      "KhÃ´ng thá»ƒ Ä‘á»“ng bá»™ bÃ¡o cÃ¡o minh chá»©ng: " + error.message
    );
  }

  setLastSaved(new Date());
}
// LÆ°u Ä‘á»“ng thá»i tÃªn file vÃ  bÃ¡o cÃ¡o minh chá»©ng
const saveEvidenceChanges = async (
  file: any,
  inputName: string,
  content: string
) => {
  const trimmedName = inputName.trim();

  if (!trimmedName) {
    throw new Error("TÃªn file khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.");
  }

  try {
    // 1. Láº¥y thÃ´ng tin file chÃ­nh xÃ¡c trong nÄƒm há»c
    const { data: fileRecord, error: findError } =
      await supabase
        .from("uploaded_files")
        .select("id, storage_name, display_name, drive_file_id")
        .eq("id", file.id)
        .eq("user_id", userId)
        .eq("folder", "hoi-nhap")
        .eq("academic_year_id", Number(yearId))
        .single();

    if (findError || !fileRecord) {
      throw new Error("KhÃ´ng tÃ¬m tháº¥y file minh chá»©ng.");
    }

    // 2. Giá»¯ nguyÃªn pháº§n má»Ÿ rá»™ng cá»§a file
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

    // 3. Náº¿u Ä‘á»•i tÃªn thÃ¬ cáº­p nháº­t Google Drive
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
          result.error || "KhÃ´ng thá»ƒ Ä‘á»•i tÃªn file trÃªn Google Drive."
        );
      }
    }

    // 4. Cáº­p nháº­t tÃªn vÃ  bÃ¡o cÃ¡o trong Supabase
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
        "KhÃ´ng thá»ƒ lÆ°u thay Ä‘á»•i: " + updateError.message
      );
    }

    // 5. Cáº­p nháº­t giao diá»‡n, giá»¯ nguyÃªn thá»© tá»± minh chá»©ng
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

    // 6. Ghi nháº­t kÃ½ náº¿u cÃ³ Ä‘á»•i tÃªn
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
        target_folder: "hoi-nhap",
        target_file: newName,
      });
    }

    // 7. ÄÃ³ng modal
    setSelectedEvidence(null);

  } catch (error) {
    console.error("Save evidence changes error:", error);
    throw error;
  }
};


// Äá»•i thá»© tá»± minh chá»©ng
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
    alert("KhÃ´ng thá»ƒ Ä‘á»•i thá»© tá»±: " + error1.message);
    return;
  }

  const { error: error2 } = await supabase
    .from("uploaded_files")
    .update({ sort_order: firstOrder })
    .eq("id", second.id)
    .eq("user_id", userId);

  if (error2) {
    alert("KhÃ´ng thá»ƒ Ä‘á»•i thá»© tá»±: " + error2.message);
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
        : "KhÃ´ng thá»ƒ cáº­p nháº­t bÃ¡o cÃ¡o."
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
    // 1. GIá»šI Háº N FILE
    // ================================
    const MAX_FILE_SIZE = 25 * 1024 * 1024;

    if (file.size <= 0) {
      throw new Error("File khÃ´ng há»£p lá»‡");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File khÃ´ng Ä‘Æ°á»£c vÆ°á»£t quÃ¡ 25 MB");
    }

    // ================================
    // 2. Láº¤Y THÃ”NG TIN SINH VIÃŠN
    // ================================
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("ho_ten, mssv, lop")
        .eq("id", user.id)
        .single();

    if (profileError || !profile) {
      console.error("Profile error:", profileError);
      throw new Error("KhÃ´ng láº¥y Ä‘Æ°á»£c thÃ´ng tin sinh viÃªn");
    }

    // ================================
    // 3. KHá»žI Táº O GOOGLE DRIVE SESSION
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
          criteria: "hoi-nhap",
          academic_year_id: Number(yearId),
        }),
      }
    );

    const initResult = await initResponse.json();

    if (!initResponse.ok || !initResult.success) {
      throw new Error(
        initResult.error ||
          "KhÃ´ng thá»ƒ khá»Ÿi táº¡o upload Google Drive"
      );
    }

    const uploadUrl = initResult.uploadUrl;

    if (!uploadUrl) {
      throw new Error(
        "KhÃ´ng nháº­n Ä‘Æ°á»£c upload URL tá»« Google Drive"
      );
    }

    // ================================
    // 4. CHIA FILE THÃ€NH CHUNK
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
      // 5. Gá»¬I CHUNK QUA VERCEL API
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
            `Upload chunk tháº¥t báº¡i (${chunkResponse.status})`
        );
      }

      // ================================
      // 6. KIá»‚M TRA HOÃ€N THÃ€NH
      // ================================
      if (chunkResult.completed) {
        driveFile = chunkResult.file;
        break;
      }

      // Chunk tiáº¿p theo
      start = end;
    }

    if (!driveFile?.id) {
      throw new Error(
        "Google Drive khÃ´ng tráº£ vá» thÃ´ng tin file sau khi upload"
      );
    }

    console.log(
      "Google Drive upload thÃ nh cÃ´ng:",
      driveFile
    );

    // ================================
    // 7. Táº O TÃŠN LÆ¯U TRONG SUPABASE
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
    // 8. LÆ¯U FILE VÃ€O SUPABASE
    // ================================
    const nextOrder = files.length > 0 ? Math.max(...files.map((item) => item.sort_order ?? 0)) + 1 : 1;

    const {
      data: insertedFile,
      error: insertError,
    } = await supabase
      .from("uploaded_files")
      .insert({
        user_id: user.id,
        folder: "hoi-nhap",
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
        `LÆ°u file vÃ o Supabase tháº¥t báº¡i: ${insertError.message}`
      );
    }

    console.log(
      "ÄÃ£ lÆ°u uploaded_files:",
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
        target_folder: "hoi-nhap",
        target_file: file.name,
      });

    // ================================
    // 10. LOAD Láº I DANH SÃCH
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
        : "KhÃ´ng thá»ƒ upload file"
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
  if (deletingRef.current.has(storageName)) return;

  const currentFiles = [...filesRef.current];
  const targetFile = currentFiles.find(
    (file) => file.storage_name === storageName
  );

  if (!targetFile) return;

  deletingRef.current.add(storageName);
  setDeletingFiles((prev) => [...prev, storageName]);

  try {
    const response = await fetch("/api/queue-delete-file", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        storageName,
        folder: "hoi-nhap",
        academicYearId: Number(yearId),
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.error || "Không thể gửi yêu cầu xóa."
      );
    }

    const optimisticFiles = currentFiles.filter(
      (file) => file.storage_name !== storageName
    );

    setFiles(optimisticFiles);
    filesRef.current = optimisticFiles;

    alert("Đã đưa file vào hàng đợi xóa. Hệ thống sẽ xử lý tự động.");
  } catch (error) {
    console.error("Queue delete error:", error);
    alert(
      error instanceof Error
        ? error.message
        : "Không thể gửi yêu cầu xóa file."
    );
  } finally {
    deletingRef.current.delete(storageName);
    setDeletingFiles((prev) =>
      prev.filter((item) => item !== storageName)
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
            â† Quay láº¡i
          </button>

          <h1
            style={{
              display: "inline-block",
              fontSize: "32px",
              marginBottom: "20px",
            }}
          >
             <Image src="/iconhoinhap.png" width={32} height={32} alt="Há»™i nháº­p tá»‘t" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }} /> Há»™i nháº­p tá»‘t
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
  <h3 style={{ marginTop: 0 }}>ðŸ“ Nháº­p BÃ¡o cÃ¡o TiÃªu chÃ­ Há»™i nháº­p tá»‘t</h3>
 {lastSaved && (
    <span
      style={{
        fontSize: "12px",
        color: "#6e6c6c",
      }}
    >
      Cáº­p nháº­t:{" "}
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
  key="hoi-nhap"
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
      ðŸ“¤
    </div>

    <div
      style={{
        fontSize: "18px",
        fontWeight: "600",
      }}
    >
      KÃ©o tháº£ file vÃ o Ä‘Ã¢y
    </div>

    <div
      style={{
        marginTop: "8px",
        color: "#64748b",
      }}
    >
      hoáº·c báº¥m Ä‘á»ƒ chá»n file
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

          <h3>Danh sÃ¡ch minh chá»©ng</h3>

          {files.length === 0 && (
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "12px",
                marginTop: "12px",
              }}
            >
              ChÆ°a cÃ³ minh chá»©ng nÃ o.
            </div>
          )}

{files
  .filter((file) => !deletingFiles.includes(file.storage_name))
  .map((file, index) => {
  const fileUrl =
    file.storage_type === "google_drive"
      ? `/api/view-drive?fileId=${encodeURIComponent(
          file.drive_file_id
        )}`
      : supabase.storage
          .from("Ho so SV5T")
          .getPublicUrl(
            `${userId}/hoi-nhap/${file.storage_name}`
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
    folder: "hoi-nhap",
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
                .getPublicUrl(`${userId}/hoi-nhap/${selectedEvidence.storage_name}`).data.publicUrl
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
export default function HoiNhapPageWrapper() {
  return (
    <Suspense fallback={null}>
      <HoiNhapPage />
    </Suspense>
  );
}