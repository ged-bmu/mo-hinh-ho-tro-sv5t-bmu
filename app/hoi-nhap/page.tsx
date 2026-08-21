"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { authFetch as fetch } from "../../lib/auth-fetch";
import Sidebar from "../components/Sidebar";
import FileItem from "../components/FileItem";
import CriteriaModal from "../components/CriteriaModal";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ReportEditor from "../components/ReportEditor";
import Spinner from "@/app/components/Spinner";
import { checkSubmissionAccess } from "../../lib/checkSubmissionAccess";

export default function HoiNhapPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState("");
  const [dragging, setDragging] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);
  const [tab, setTab] = useState("proof");
  const [displayNames, setDisplayNames] = useState<Record<string, string>>(
    {}
  );
  const [report, setReport] = useState("");
  const [savingReport, setSavingReport] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  const defaultReport = `
<p style="margin: 0;">1. Có ý thức hội nhập, giao lưu và tích cực tham gia các hoạt động học thuật, văn hóa, xã hội.</p>
<p style="margin: 0;">2. Có khả năng sử dụng ngoại ngữ và công nghệ thông tin phục vụ học tập, công việc.</p>
<p style="margin: 0;">3. &nbsp;</p>
`;

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

  // =====================================================
  // LOAD FILE + REPORT
  // =====================================================
  async function loadFiles() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setUserId(user.id);

    const {
      data: uploadedFiles,
      error,
    } = await supabase
      .from("uploaded_files")
      .select(
        "id, storage_name, display_name, storage_type, drive_file_id, drive_url"
      )
      .eq("user_id", user.id)
      .eq("folder", "hoi-nhap")
      .order("id", { ascending: false });

    if (error) {
      console.error("LOAD UPLOADED FILES ERROR:", error);
      return;
    }

    if (uploadedFiles) {
      setFiles(sortFilesByName(uploadedFiles));

      const map: Record<string, string> = {};

      uploadedFiles.forEach((file) => {
        map[file.storage_name] = file.display_name;
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
      .eq("criteria", "hoi-nhap")
      .maybeSingle();

    setReport(
      reportData?.content?.trim()
        ? reportData.content
        : defaultReport
    );
  }

  // =====================================================
  // SAVE REPORT
  // =====================================================
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
      console.error("SAVE REPORT ERROR:", error);
      return;
    }

    setLastSaved(new Date());
  }

  // =====================================================
  // UPLOAD GOOGLE DRIVE
  // =====================================================
  async function uploadFile(file: File) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    try {
      // ================================
      // 1. Lấy thông tin sinh viên
      // ================================
      const {
        data: profile,
        error: profileError,
      } = await supabase
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
      // 2. Chuẩn bị FormData
      // ================================
      const formData = new FormData();

      formData.append("file", file);
      formData.append("mssv", profile.mssv);
      formData.append("ho_ten", profile.ho_ten);
      formData.append("criteria", "hoi-nhap");

      // ================================
      // 3. Upload Google Drive
      // ================================
      const response = await fetch("/api/upload-drive", {
        method: "POST",
        body: formData,
      });

      const driveResult = await response.json();

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

      const fileName =
        `${Date.now()}-${safeName}`;

      // ================================
      // 5. Lưu DB
      // ================================
      const {
        data: insertedFile,
        error: insertError,
      } = await supabase
        .from("uploaded_files")
        .insert({
          user_id: user.id,
          folder: "hoi-nhap",
          storage_name: fileName,
          display_name: file.name,
          storage_type: "google_drive",
          drive_file_id: driveResult.file.id,
          drive_url: driveResult.file.webViewLink,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(
          `Lưu file vào Supabase thất bại: ${insertError.message}`
        );
      }

      console.log(
        "Đã lưu file:",
        insertedFile
      );

      // ================================
      // 6. Cập nhật giao diện ngay
      // ================================
      setFiles((prev) => [
        insertedFile,
        ...prev,
      ]);

      setDisplayNames((prev) => ({
        ...prev,
        [fileName]: file.name,
      }));

      // ================================
      // 7. Ghi log
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

      // Không alert thành công nữa

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

  // =====================================================
  // INPUT UPLOAD
  // =====================================================
  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setUploading(true);

    try {
      await uploadFile(file);
    } finally {
      setUploading(false);

      // Cho phép chọn lại cùng file
      event.target.value = "";
    }
  }

  // =====================================================
  // DELETE GOOGLE DRIVE
  // =====================================================
  async function deleteFile(
    storageName: string
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    try {
      // ================================
      // 1. Lấy record
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
        .eq("folder", "hoi-nhap")
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
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              fileId:
                fileRecord.drive_file_id,
            }),
          }
        );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.error ||
              "Không thể xóa file trên Google Drive"
          );
        }
      }

      // ================================
      // 3. Xóa Supabase
      // ================================
      const {
        error: dbError,
      } = await supabase
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
      // 4. XÓA KHỎI GIAO DIỆN NGAY
      // ================================
      setFiles((prevFiles) =>
        prevFiles.filter(
          (item) =>
            item.id !== fileRecord.id
        )
      );

      setDisplayNames((prev) => {
        const updated = {
          ...prev,
        };

        delete updated[
          fileRecord.storage_name
        ];

        return updated;
      });

      // ================================
      // 5. Lấy profile
      // ================================
      const {
        data: profile,
      } = await supabase
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
          target_folder: "hoi-nhap",
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

  // =====================================================
  // RENAME GOOGLE DRIVE
  // =====================================================
  async function renameFile(
    file: any
  ) {
    const currentName =
      file.display_name ||
      file.name;

    const ext =
      currentName.includes(".")
        ? currentName.slice(
            currentName.lastIndexOf(".")
          )
        : "";

    const currentNameWithoutExt =
      currentName.replace(
        /\.[^/.]+$/,
        ""
      );

    const input = prompt(
      "Nhập tên mới:",
      currentNameWithoutExt
    );

    if (
      !input ||
      !input.trim()
    ) {
      return;
    }

    const newName =
      input.trim() + ext;

    try {
      // ================================
      // 1. Đổi tên Google Drive
      // ================================
      if (file.drive_file_id) {
        const response =
          await fetch(
            "/api/rename-drive",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                fileId:
                  file.drive_file_id,
                newName,
              }),
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.error ||
              "Không thể đổi tên file trên Google Drive"
          );
        }
      }

      // ================================
      // 2. Đổi tên Supabase
      // ================================
      const {
        error: updateError,
      } = await supabase
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
      // 3. Cập nhật UI ngay
      // ================================
      setFiles((prevFiles) =>
        sortFilesByName(
          prevFiles.map((item) =>
            item.id === file.id
              ? {
                  ...item,
                  display_name:
                    newName,
                }
              : item
          )
        )
      );

      setDisplayNames((prev) => ({
        ...prev,
        [file.storage_name]:
          newName,
      }));

      // ================================
      // 4. Lấy profile
      // ================================
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      const {
        data: profile,
      } = await supabase
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
          target_folder: "hoi-nhap",
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
        openCriteria={() =>
          setShowCriteria(true)
        }
        openProfile={() =>
          setShowProfile(true)
        }
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
          <div
            style={{
              maxWidth: "900px",
              margin: "0 auto",
            }}
          >
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
              🌏 Hội nhập tốt
            </h1>

            {/* ================================
                BÁO CÁO
            ================================= */}

            <div
              style={{
                background: "white",
                padding: "10px",
                borderRadius: "16px",
                marginBottom: "10px",
                boxShadow:
                  "0 2px 10px rgba(0,0,0,0.08)",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                }}
              >
                📝 Nhập Báo cáo Tiêu chí Hội nhập tốt
              </h3>

              {lastSaved && (
                <span
                  style={{
                    fontSize: "12px",
                    color: "#6e6c6c",
                  }}
                >
                  Cập nhật:{" "}
                  {lastSaved.toLocaleString(
                    "vi-VN",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </span>
              )}

              <ReportEditor
                value={report}
                onChange={setReport}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  alignItems: "center",
                  marginTop: "16px",
                }}
              >
                <button
                  onClick={saveReport}
                  disabled={savingReport}
                  style={{
                    padding:
                      "6px 14px",
                    background:
                      "#2563eb",
                    color: "#fff",
                    border:
                      "1px solid #2563eb",
                    borderRadius:
                      "6px",
                    cursor:
                      savingReport
                        ? "not-allowed"
                        : "pointer",
                    fontSize: "14px",
                    fontWeight: 500,
                    opacity:
                      savingReport
                        ? 0.7
                        : 1,
                  }}
                >
                  {savingReport
                    ? "Đang lưu..."
                    : "💾 Lưu"}
                </button>
              </div>
            </div>

            {/* ================================
                UPLOAD
            ================================= */}

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

                  const file =
                    e.dataTransfer.files?.[0];

                  if (file) {
                    setUploading(true);

                    uploadFile(file).finally(
                      () => {
                        setUploading(false);
                      }
                    );
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
                        flexDirection:
                          "column",
                        alignItems:
                          "center",
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
                          marginBottom:
                            "10px",
                        }}
                      >
                        📤
                      </div>

                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: 600,
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
                    onChange={
                      handleUpload
                    }
                    style={{
                      display: "none",
                    }}
                  />
                </label>
              </div>
            </div>

            {/* ================================
                DANH SÁCH FILE
            ================================= */}

            <h3>
              Danh sách minh chứng
            </h3>

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
      onRename={renameFile}
    />
  );
})}
          </div>
        </main>
      </div>

      {showCriteria && (
        <CriteriaModal
          onClose={() =>
            setShowCriteria(false)
          }
        />
      )}

      <Footer />
    </div>
  );
}