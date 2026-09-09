"use client";

import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import { authFetch } from "@/lib/auth-fetch";
import { sendNotification } from "@/lib/notification";
import { FaFilePdf } from "react-icons/fa";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Spinner from "../../../components/Spinner";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function StudentsDetailPage() {
  const [reports, setReports] = useState<any[]>([]);
  const ghiChuTimer = useRef<NodeJS.Timeout | null>(null);
  const params = useParams();
  const id = params.id as string;
  const [profile, setProfile] = useState<any>(null);
  const [nhanXet, setNhanXet] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [daoDucFiles, setDaoDucFiles] = useState<any[]>([]);
  const [hocTapFiles, setHocTapFiles] = useState<any[]>([]);
  const [theLucFiles, setTheLucFiles] = useState<any[]>([]);
  const [tinhNguyenFiles, setTinhNguyenFiles] = useState<any[]>([]);
  const [hoiNhapFiles, setHoiNhapFiles] = useState<any[]>([]);
  const [uuTienFiles, setUuTienFiles] = useState<any[]>([]);
  const [baoCaoFiles, setBaoCaoFiles] = useState<any[]>([]);
  const [trangThai, setTrangThai] = useState("chua_danh_gia");
  const [previewAvatar, setPreviewAvatar] = useState(false);
  const [previewFolder, setPreviewFolder] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewBlobUrl, setPreviewBlobUrl] = useState("");
  const [zoom, setZoom] = useState(0.6);
  const [savingNhanXet, setSavingNhanXet] = useState(false);
  const criteriaList = [
  { key: "dao-duc", title: "Đạo đức tốt", icon: "/icondaoduc.png" },
  { key: "hoc-tap", title: "Học tập tốt", icon: "/iconhoctap.png" },
  { key: "the-luc", title: "Thể lực tốt", icon: "/icontheluc.png" },
  { key: "tinh-nguyen", title: "Tình nguyện tốt", icon: "/icontinhnguyen.png" },
  { key: "hoi-nhap", title: "Hội nhập tốt", icon: "/iconhoinhap.png" },
   { key: "uu-tien", title: "Thành tích khác", icon: "/iconuutien.png" },
];
useEffect(() => {
  if (!previewOpen || !previewUrl) {
    setPreviewBlobUrl("");
    return;
  }

  let objectUrl = "";
  let cancelled = false;

  async function loadPreview() {
    try {
      setPreviewBlobUrl("");
      const res = await authFetch(previewUrl);
      if (!res.ok) {
        throw new Error(`Không thể tải file: ${res.status}`);
      }

      const blob = await res.blob();

      if (!blob.size) {
        throw new Error("File tải về rỗng");
      }

      objectUrl = URL.createObjectURL(blob);

      if (!cancelled) {
        setPreviewBlobUrl(objectUrl);
      }
    } catch (error) {

      if (!cancelled) {
        setPreviewBlobUrl("");
      }
    }
  }

  loadPreview();

  return () => {
    cancelled = true;

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  };
}, [previewOpen, previewUrl]);
  useEffect(() => {
    if (!id) return;

    loadStudent();
    loadFiles();
    loadReports();
  }, [id]);
async function loadReports() {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", id);
  if (error) {
    return;
  }

  setReports(data || []);
}
async function updateGhiChu() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    alert("Không xác định được người duyệt BCH.");
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      ghi_chu: ghiChu,
    })
    .eq("id", id);

  if (error) {
    console.error("LỖI LƯU GHI CHÚ:", error);
    alert("Lưu ghi chú thất bại: " + error.message);
    return;
  }

  setProfile((prev: any) => ({
    ...prev,
    ghi_chu: ghiChu,
  }));

  alert("Đã lưu ghi chú");
}

async function loadStudent() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return;
  }

  const trangThaiValue =
    data.trang_thai === "da_dat" ||
    data.trang_thai === "khong_dat" ||
    data.trang_thai === "can_xem_xet"
      ? data.trang_thai
      : "chua_danh_gia";

  setProfile({
    ...data,
    trang_thai: trangThaiValue,
  });

  setNhanXet(data.nhan_xet || "");
  setTrangThai(trangThaiValue);
  setGhiChu(data.ghi_chu || "");
}

async function updateCriteria(
  field: string,
  value: boolean
) {
const { error } = await supabase
  .from("profiles")
  .update({
    [field]: value,
    nhan_xet: nhanXet,
    ngay_nhan_xet: new Date().toISOString(),
  })
  .eq("id", id);

  if (error) {
    alert("Cập nhật thất bại");
    return;
  }

  setProfile({
    ...profile,
    [field]: value,
  });

  const titleMap: Record<string, string> = {
    "dao-duc": "Đạo đức tốt",
    "hoc-tap": "Học tập tốt",
    "the-luc": "Thể lực tốt",
    "tinh-nguyen": "Tình nguyện tốt",
    "hoi-nhap": "Hội nhập tốt",
  };

  await sendNotification(
    id,
    "criteria",
    value
      ? "Bạn vừa Đạt tiêu chí mới 🎉"
      : "Tiêu chí của bạn vừa được cập nhật",
    value
      ? `Tiêu chí ${titleMap[field]} đã được xác nhận đạt.`
      : `Tiêu chí ${titleMap[field]} không còn được đánh dấu đạt.`,
    "/"
  );
}
async function loadFiles() {
  const { data, error } = await supabase
    .from("uploaded_files")
    .select("*")
    .eq("user_id", id);

  if (error) {
    return;
  }
  const files = data || [];
  const sortFiles = (files: any[]) => {
    return [...files].sort((a, b) => {
      const nameA =
        a.display_name ||
        a.storage_name ||
        a.file_name ||
        a.name ||
        "";

      const nameB =
        b.display_name ||
        b.storage_name ||
        b.file_name ||
        b.name ||
        "";

      return nameA.localeCompare(nameB, "vi", {
        numeric: true,
        sensitivity: "base",
      });
    });
  };

  setBaoCaoFiles(
    sortFiles(files.filter((file) => file.folder === "bao-cao"))
  );

  setDaoDucFiles(
    sortFiles(files.filter((file) => file.folder === "dao-duc"))
  );

  setHocTapFiles(
    sortFiles(files.filter((file) => file.folder === "hoc-tap"))
  );

  setTheLucFiles(
    sortFiles(files.filter((file) => file.folder === "the-luc"))
  );

  setTinhNguyenFiles(
    sortFiles(files.filter((file) => file.folder === "tinh-nguyen"))
  );

  setHoiNhapFiles(
    sortFiles(files.filter((file) => file.folder === "hoi-nhap"))
  );

  setUuTienFiles(
    sortFiles(files.filter((file) => file.folder === "uu-tien"))
  );
}
async function updateTrangThai(value: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    alert("Không xác định được người duyệt BCH.");
    return;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      trang_thai: value,
      nguoi_duyet_id:
        value === "chua_danh_gia" ? null : user.id,
    })
    .eq("id", id)
    .select("trang_thai, nguoi_duyet_id")
    .single();

  if (error) {
    alert(
      "Cập nhật trạng thái thất bại: " +
        error.message
    );
    return;
  }

  setTrangThai(value);

  setProfile((prev: any) => ({
    ...prev,
    trang_thai: value,
    nguoi_duyet_id:
      data?.nguoi_duyet_id ?? null,
  }));
}
function getDriveFileId(url: string) {
  if (!url) return "";

  const match = url.match(/\/file\/d\/([^/]+)/);

  if (match) {
    return match[1];
  }

  const idMatch = url.match(/[?&]id=([^&]+)/);

  if (idMatch) {
    return idMatch[1];
  }

  return "";
}

function getDrivePreviewUrl(url: string) {
  const fileId = getDriveFileId(url);

  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }

  return url;
}

function getDriveImageUrl(url: string) {
  const fileId = getDriveFileId(url);

  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
  }

  return url;
}

function getFolderFiles(folder: string) {
  switch (folder) {
    case "dao-duc": return daoDucFiles;
    case "hoc-tap": return hocTapFiles;
    case "the-luc": return theLucFiles;
    case "tinh-nguyen": return tinhNguyenFiles;
    case "hoi-nhap": return hoiNhapFiles;
    case "uu-tien": return uuTienFiles;
    default: return [];
  }
}

function getCriterionInfo(folder: string) {
  return criteriaList.find((item) => item.key === folder) || {
    key: folder, title: "Minh chứng", icon: "",
  };
}

function openEvidence(folder: string, index: number) {
  const files = getFolderFiles(folder);
  const file = files[index];
  if (!file) return;

  let url = "";
  if (file.storage_type === "google_drive") {
    const fileId = file.drive_file_id || getDriveFileId(file.drive_url || "");
    if (fileId) url = `/api/view-drive?fileId=${fileId}`;
  } else {
    url = process.env.NEXT_PUBLIC_SUPABASE_URL +
      `/storage/v1/object/public/Ho%20so%20SV5T/${id}/${folder}/${file.storage_name}`;
  }

  if (!url) {
    alert("Không tìm thấy đường dẫn file");
    return;
  }

  setPreviewFile(file);
  setPreviewUrl(url);
  setPreviewFolder(folder);
  setPreviewIndex(index);
  setPreviewOpen(true);
  setZoom(0.6);
}

function renderFiles(files: any[], folder: string) {
  if (files.length === 0) {
    return <div style={{ color: "#94a3b8", fontStyle: "italic" }}>Chưa có minh chứng</div>;
  }

  return files.map((file, index) => {
    const fileName = file.display_name || file.storage_name || file.file_name || file.name || "File minh chứng";
    return (
      <div
        key={file.id}
        style={{
          background: "#f8fafc", border: "1px solid #e2e8f0",
          borderRadius: "10px", padding: "10px", marginBottom: "10px",
        }}
      >
        <div
          onClick={() => openEvidence(folder, index)}
          title={fileName}
          style={{
            fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden",
            textOverflow: "ellipsis", maxWidth: "230px", cursor: "pointer", color: "#000000",
          }}
        >
          {fileName}
        </div>
      </div>
    );
  });
}

if (!profile) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f1f5f9",
      }}
    >
      <Spinner />
    </div>
  );
}
async function renameFile(folder: string, file: any) {
  const currentName =
    file.display_name ||
    file.storage_name ||
    file.file_name ||
    file.name ||
    "File minh chứng";

  const newName = prompt("Nhập tên mới:", currentName);

  if (!newName || newName.trim() === "") return;

  const { error } = await supabase
    .from("uploaded_files")
    .update({
      display_name: newName.trim(),
    })
    .eq("id", file.id);

  if (error) {
    alert(error.message);
    return;
  }

  await loadFiles();
}

async function deleteFile(folder: string, file: any) {
  const ok = window.confirm("Bạn có chắc muốn xóa file này không?");
  if (!ok) return;

  try {
    // =========================
    // GOOGLE DRIVE
    // =========================
    if (file.storage_type === "google_drive") {
      const fileId =
        file.drive_file_id ||
        getDriveFileId(file.drive_url || "");

      if (!fileId) {
        alert("Không tìm thấy ID file Google Drive");
        return;
      }

      const res = await authFetch("/api/delete-drive", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.error || "Không thể xóa file trên Google Drive"
        );
      }

      // Xóa record trong Supabase
      const { error } = await supabase
        .from("uploaded_files")
        .delete()
        .eq("id", file.id);

      if (error) {
        throw error;
      }

      await loadFiles();
      setPreviewOpen(false);
      return;
    }

    // =========================
    // SUPABASE STORAGE CŨ
    // =========================
    const storageName =
      file.storage_name ||
      file.file_name ||
      file.name;

    if (!storageName) {
      alert("Không tìm thấy tên file");
      return;
    }

    const { error: storageError } = await supabase.storage
      .from("Ho so SV5T")
      .remove([`${id}/${folder}/${storageName}`]);

    if (storageError) {
      throw storageError;
    }

    const { error: dbError } = await supabase
      .from("uploaded_files")
      .delete()
      .eq("id", file.id);

    if (dbError) {
      throw dbError;
    }

    await loadFiles();
    setPreviewOpen(false);
  } catch (error: any) {
    alert(error?.message || "Không thể xóa file");
  }
}

return (
  <div
    style={{
      padding: "30px",
      maxWidth: "1800px",
      margin: "0 auto",
    }}
  >
    <a
      href="/bch"
      style={{
        display: "inline-block",
        marginBottom: "20px",
        padding: "10px 16px",
        background: "#f6f6f6",
        color: "#0f172a",
        textDecoration: "none",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        fontWeight: "600",
      }}
    >
      ← Trang chủ
    </a>

    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "20px",
        alignItems: "start",
        marginBottom: "25px",
      }}
    >
      {/* BÁO CÁO - HIỂN THỊ TRỰC TIẾP */}
      <div
        style={{
          flex: "1 1 700px",
          minWidth: "0",
          background: "#f1f5f9",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          padding: "16px",
          height: "min(75vh, 900px)",
          minHeight: "500px",
          overflow: "auto",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1120px",
            minHeight: "420mm",
            margin: "0 auto",
            background: "#fff",
            padding: "30px",
            borderRadius: "8px",
            boxSizing: "border-box",
            boxShadow: "0 4px 18px rgba(0,0,0,.08)",
            fontFamily: "Times New Roman, serif",
            fontSize: "13pt",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                fontFamily: "Times New Roman",
                fontSize: "16pt",
                fontWeight: 700,
              }}
            >
              <b>BÁO CÁO THÀNH TÍCH</b>
            </div>

            <div
              style={{
                fontFamily: "Times New Roman",
                fontSize: "16pt",
                fontWeight: 700,
              }}
            >
              <b>ĐỀ NGHỊ CÔNG NHẬN DANH HIỆU SINH VIÊN 5 TỐT CẤP TRƯỜNG</b>
            </div>

            <div
              style={{
                fontFamily: "Times New Roman",
                fontSize: "13pt",
                fontWeight: 700,
              }}
            >
              <b>Năm học 2025 – 2026</b>
            </div>

            <hr
              style={{
                marginTop: 14,
                border: "none",
                borderTop: "2px solid #dbeafe",
              }}
            />
          </div>

          <div
            style={{
              position: "relative",
              height: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 20,
                top: -150,
                width: 95,
                height: 125,
                border: "1px solid #94a3b8",
                borderRadius: 6,
                overflow: "hidden",
                background: "#fff",
                zIndex: 10,
              }}
            >
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  onClick={() => setPreviewAvatar(true)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    cursor: "zoom-in",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: 12,
                    color: "#64748b",
                  }}
                >
                  Ảnh 3×4
                </div>
              )}
            </div>
          </div>

          <table
            style={{
              marginTop: 30,
              width: "100%",
              borderCollapse: "collapse",
              tableLayout: "fixed",
              fontFamily: "Times New Roman",
              fontSize: "13pt",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    width: "210px",
                    border: "1px solid #cbd5e1",
                    background: "#eff6ff",
                    padding: "14px 10px",
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  Thông tin sinh viên
                </th>

                {criteriaList.map((item) => (
                  <th
                    key={item.key}
                    style={{
                      border: "1px solid #cbd5e1",
                      background: "#eff6ff",
                      padding: "14px 10px",
                      fontWeight: 700,
                      fontSize: 16,
                    }}
                  >
                    {item.title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr>
                <td
                  style={{
                    border: "1px solid #cbd5e1",
                    padding: "16px",
                    verticalAlign: "top",
                    fontSize: "15px",
                    lineHeight: "1.6",
                  }}
                >
                  <div><b>Họ và tên:</b> {profile?.ho_ten}</div>
                  <div><b>MSSV:</b> {profile?.mssv}</div>
                  <div><b>Nam/Nữ:</b></div>
                  <div><b>Năm sinh:</b></div>
                  <div><b>Dân tộc:</b></div>
                  <div><b>Sinh viên năm thứ:</b></div>
                  <div><b>Lớp:</b> {profile?.lop}, Trường Đại học Y Dược Buôn Ma Thuột</div>
                  <div><b>Chức vụ Đoàn - Hội:</b></div>
                  <div><b>Đảng viên/Đoàn viên:</b></div>
                  <div><b>Số điện thoại:</b></div>
                  <div><b>Email:</b> {profile?.email}</div>
                </td>

                {criteriaList.map((item) => {
                  const report = reports.find(
                    (r) => r.criteria === item.key
                  );

                  return (
                    <td
                      key={item.key}
                      style={{
                        border: "1px solid #cbd5e1",
                        verticalAlign: "top",
                        padding: "14px",
                      }}
                    >
                      <div
                        style={{
                          minHeight: "520px",
                          lineHeight: "1.6",
                          fontSize: "15px",
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                        }}
                        dangerouslySetInnerHTML={{
                          __html:
                            report?.content ||
                            "<i>Chưa có nội dung báo cáo</i>",
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* KHU VỰC ĐÁNH GIÁ / NHẬN XÉT / GHI CHÚ */}
{/* KHU VỰC ĐÁNH GIÁ / NHẬN XÉT / GHI CHÚ */}
<div
  style={{
    flex: "0 1 360px",
    minWidth: "280px",
    position: "sticky",
    top: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "clamp(8px, 1.2vw, 16px)",
    fontSize: "clamp(12px, 0.85vw, 14px)",
  }}
>
  <div
    style={{
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: "14px",
      padding: "clamp(10px, 1.2vw, 18px)",
      boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
    }}
  >
    <b
      style={{
        fontSize: "clamp(12px, 0.95vw, 14px)",
      }}
    >
      Trạng thái hồ sơ
    </b>

    <select
      value={trangThai || "chua_danh_gia"}
      onChange={(e) => updateTrangThai(e.target.value)}
      style={{
        display: "block",
        marginTop: "clamp(5px, 0.6vw, 8px)",
        width: "100%",
        padding: "clamp(7px, 0.7vw, 10px) clamp(9px, 0.8vw, 12px)",
        borderRadius: "10px",
        border: "1px solid #cbd5e1",
        fontSize: "clamp(12px, 0.85vw, 15px)",
        fontWeight: "600",
        cursor: "pointer",
        boxSizing: "border-box",
        background:
          trangThai === "khong_dat"
            ? "#fee2e2"
            : trangThai === "da_dat"
            ? "#dcfce7"
            : trangThai === "can_xem_xet"
            ? "#dbeafe"
            : "#f1f5f9",
        color:
          trangThai === "khong_dat"
            ? "#b91c1c"
            : trangThai === "da_dat"
            ? "#15803d"
            : trangThai === "can_xem_xet"
            ? "#1d4ed8"
            : "#64748b",
      }}
    >
      <option value="chua_danh_gia">Chưa đánh giá</option>
      <option value="can_xem_xet">Cần xem xét</option>
      <option value="da_dat">Hồ sơ đã đạt</option>
      <option value="khong_dat">Hồ sơ không đạt</option>
    </select>
  </div>

  <div
    style={{
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: "14px",
      padding: "clamp(10px, 1.2vw, 18px)",
      boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "8px",
        marginBottom: "clamp(5px, 0.6vw, 8px)",
      }}
    >
      <b
        style={{
          fontSize: "clamp(12px, 0.95vw, 14px)",
        }}
      >
        Ghi chú nội bộ
      </b>

      <span
        style={{
          fontSize: "clamp(10px, 0.7vw, 12px)",
          color: "#94a3b8",
          whiteSpace: "nowrap",
        }}
      >
        Tự động lưu
      </span>
    </div>

    <textarea
      value={ghiChu}
      onChange={(e) => {
        const value = e.target.value;
        setGhiChu(value);

        if (ghiChuTimer.current) {
          clearTimeout(ghiChuTimer.current);
        }

        ghiChuTimer.current = setTimeout(async () => {
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError || !user) return;

          const { error } = await supabase
            .from("profiles")
            .update({
              ghi_chu: value,
              nguoi_duyet_id: user.id,
            })
            .eq("id", id);

          if (!error) {
            setProfile((prev: any) => ({
              ...prev,
              ghi_chu: value,
              nguoi_duyet_id: user.id,
            }));
          }
        }, 800);
      }}
      placeholder="Nhập ghi chú nội bộ..."
      style={{
        display: "block",
        width: "100%",
        height: "clamp(75px, 12vh, 120px)",
        padding: "clamp(8px, 0.8vw, 10px) clamp(9px, 0.8vw, 12px)",
        borderRadius: "10px",
        border: "1px solid #cbd5e1",
        fontSize: "clamp(11px, 1.0vw, 14px)",
        lineHeight: "1.5",
        resize: "vertical",
        outline: "none",
        boxSizing: "border-box",
      }}
    />
  </div>

  <div
    style={{
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: "14px",
      padding: "clamp(10px, 1.2vw, 18px)",
      boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "8px",
        marginBottom: "clamp(5px, 0.6vw, 8px)",
      }}
    >
      <b
        style={{
          fontSize: "clamp(12px, 0.95vw, 14px)",
        }}
      >
        Nhận xét gửi sinh viên
      </b>

      <span
        style={{
          fontSize: "clamp(9px, 0.65vw, 12px)",
          color: "#64748b",
          textAlign: "right",
        }}
      >
        Sinh viên sẽ nhận được thông báo
      </span>
    </div>

    <textarea
      value={nhanXet}
      onChange={(e) => setNhanXet(e.target.value)}
      placeholder="Nhập nhận xét về hồ sơ..."
      style={{
        width: "100%",
        height: "clamp(110px, 18vh, 180px)",
        padding: "clamp(9px, 0.9vw, 12px)",
        border: "1px solid #cbd5e1",
        borderRadius: "10px",
        outline: "none",
        resize: "vertical",
        fontSize: "clamp(11px, 1.0vw, 14px)",
        lineHeight: "1.6",
        boxSizing: "border-box",
      }}
    />

    <button
      type="button"
      disabled={savingNhanXet}
      onClick={async () => {
        if (savingNhanXet) return;

        setSavingNhanXet(true);

        try {
          const { error } = await supabase
            .from("profiles")
            .update({
              nhan_xet: nhanXet,
              ngay_nhan_xet: new Date().toISOString(),
            })
            .eq("id", id);

          if (error) {
            alert(error.message);
            return;
          }

          await sendNotification(
            id,
            "review",
            "Bạn vừa có nhận xét mới",
            "Hội Sinh viên vừa nhận xét hồ sơ của bạn. Hãy kiểm tra trong mục Quản lí hồ sơ",
            "/"
          );

          try {
            await authFetch("/api/send-notification", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: id,
                type: "review",
                title: "Bạn vừa có nhận xét mới",
                message:
                  "Hội Sinh viên vừa nhận xét hồ sơ của bạn. Hãy kiểm tra trong mục Quản lí hồ sơ.",
                url: "/",
              }),
            });
          } catch (error) {
            console.error("Lỗi gửi Push:", error);
          }

          alert("Đã lưu nhận xét");
        } finally {
          setSavingNhanXet(false);
        }
      }}
      style={{
        width: "100%",
        marginTop: "clamp(7px, 0.7vw, 10px)",
        padding: "clamp(8px, 0.8vw, 11px) clamp(12px, 1vw, 18px)",
        border: "none",
        borderRadius: "8px",
        background: savingNhanXet
          ? "#94a3b8"
          : "linear-gradient(135deg, #2563eb, #1d4ed8)",
        color: "#fff",
        fontSize: "clamp(11px, 0.8vw, 14px)",
        fontWeight: 600,
        cursor: savingNhanXet ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        boxShadow: "0 3px 8px rgba(37, 99, 235, 0.25)",
      }}
    >
     {savingNhanXet ? (
  <>
    <span
      style={{
        display: "inline-flex",
        transform: "scale(0.55)",
        transformOrigin: "center",
        width: "18px",
        height: "18px",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Spinner />
    </span>
    Đang gửi...
  </>
) : (
  <>💾 Lưu & gửi nhận xét</>
)}
    </button>
  </div>
</div>
    </div>

<div
  style={{
    background: "white",
    borderRadius: "16px",
    overflow: "visible",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  }}
>
  {!previewOpen ? (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead>
          <tr style={{ background: "#f1f5f9" }}>
            {criteriaList.map((criterion, index) => (
              <th key={criterion.key} style={{ padding: "15px", borderRight: index < criteriaList.length - 1 ? "1px solid #e5e7eb" : undefined }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                  <span>
                    {criterion.icon && <Image src={criterion.icon} width={24} height={24} alt={criterion.title} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }} />}
                    {criterion.title}
                  </span>
                  <input type="checkbox" checked={profile?.[criterion.key] || false} onChange={(e) => updateCriteria(criterion.key, e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer", flexShrink: 0 }} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ verticalAlign: "top", padding: "15px", borderRight: "1px solid #e5e7eb" }}>{renderFiles(daoDucFiles, "dao-duc")}</td>
            <td style={{ verticalAlign: "top", padding: "15px", borderRight: "1px solid #e5e7eb" }}>{renderFiles(hocTapFiles, "hoc-tap")}</td>
            <td style={{ verticalAlign: "top", padding: "15px", borderRight: "1px solid #e5e7eb" }}>{renderFiles(theLucFiles, "the-luc")}</td>
            <td style={{ verticalAlign: "top", padding: "15px", borderRight: "1px solid #e5e7eb" }}>{renderFiles(tinhNguyenFiles, "tinh-nguyen")}</td>
            <td style={{ verticalAlign: "top", padding: "15px", borderRight: "1px solid #e5e7eb" }}>{renderFiles(hoiNhapFiles, "hoi-nhap")}</td>
            <td style={{ verticalAlign: "top", padding: "15px" }}>{renderFiles(uuTienFiles, "uu-tien")}</td>
          </tr>
        </tbody>
      </table>
    </div>
  ) : (
    (() => {
      const criterion = getCriterionInfo(previewFolder);
      const criterionFiles = getFolderFiles(previewFolder);
      const currentFile = criterionFiles[previewIndex];
      const currentName = currentFile?.display_name || currentFile?.storage_name || currentFile?.file_name || currentFile?.name || "File minh chứng";

      return (
        <div style={{ width: "100%", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ minHeight: "58px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "10px 14px", background: "#f1f5f9", borderBottom: "1px solid #e5e7eb", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
              {criterion.icon && <Image src={criterion.icon} width={24} height={24} alt={criterion.title} />}
              <strong style={{ fontSize: "16px", whiteSpace: "nowrap" }}>
                Minh chứng {criterion.title.replace(" tốt", "").toLowerCase()}
              </strong>
              <input type="checkbox" checked={profile?.[previewFolder] || false} onChange={(e) => updateCriteria(previewFolder, e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer", flexShrink: 0 }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "7px", marginLeft: "auto" }}>
              <button type="button" disabled={previewIndex <= 0} onClick={() => openEvidence(previewFolder, previewIndex - 1)} style={{ width: "36px", height: "36px", border: "1px solid #d1d5db", borderRadius: "8px", background: previewIndex <= 0 ? "#f8fafc" : "#fff", color: previewIndex <= 0 ? "#cbd5e1" : "#334155", cursor: previewIndex <= 0 ? "not-allowed" : "pointer", fontSize: "20px" }}>←</button>
              <span style={{ minWidth: "58px", textAlign: "center", fontWeight: 600, fontSize: "14px" }}>{previewIndex + 1} / {criterionFiles.length}</span>
              <button type="button" disabled={previewIndex >= criterionFiles.length - 1} onClick={() => openEvidence(previewFolder, previewIndex + 1)} style={{ width: "36px", height: "36px", border: "1px solid #d1d5db", borderRadius: "8px", background: previewIndex >= criterionFiles.length - 1 ? "#f8fafc" : "#fff", color: previewIndex >= criterionFiles.length - 1 ? "#cbd5e1" : "#334155", cursor: previewIndex >= criterionFiles.length - 1 ? "not-allowed" : "pointer", fontSize: "20px" }}>→</button>
              <button type="button" onClick={() => { setPreviewOpen(false); setPreviewFile(null); setPreviewUrl(""); setPreviewBlobUrl(""); setPreviewFolder(""); setPreviewIndex(0); }} style={{ background: "#64748b", color: "white", border: "none", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}>✕</button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", padding: "10px 14px", borderBottom: "1px solid #e5e7eb", flexWrap: "wrap" }}>
            <strong style={{ fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flex: 1 }} title={currentName}>{currentName}</strong>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
              <button type="button" onClick={async () => {
                if (!previewUrl || !currentFile) return;
                try {
                  const res = await authFetch(previewUrl);
                  if (!res.ok) throw new Error("Không thể tải file");
                  const blob = await res.blob();
                  const blobUrl = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = blobUrl; a.download = currentName; a.click();
                  URL.revokeObjectURL(blobUrl);
                } catch { alert("Không thể tải file"); }
              }} style={{ background: "#2563eb", color: "white", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>⬇ Tải file</button>
              <button type="button" onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))} style={{ width: "38px", height: "38px", border: "1px solid #d1d5db", borderRadius: "8px", background: "#fff", cursor: "pointer", fontSize: "18px" }}>➖</button>
              <span style={{ minWidth: "50px", textAlign: "center", fontWeight: 600 }}>{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={() => setZoom((z) => Math.min(3, z + 0.1))} style={{ width: "38px", height: "38px", border: "1px solid #d1d5db", borderRadius: "8px", background: "#fff", cursor: "pointer", fontSize: "18px" }}>➕</button>
            </div>
          </div>

          <div style={{ height: "min(75vh, 850px)", minHeight: "500px", overflow: "auto", background: "#f1f5f9", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "20px", boxSizing: "border-box" }}>
            {previewBlobUrl ? (
              currentName.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/) ? (
                <img src={previewBlobUrl} style={{ width: `${zoom * 100}%`, height: "auto", maxWidth: "none", objectFit: "contain" }} alt="Xem minh chứng" />
              ) : (
                <iframe src={`${previewBlobUrl}#toolbar=0&navpanes=0&scrollbar=0`} style={{ width: `${zoom * 100}%`, height: "100%", minHeight: "700px", border: "none", background: "white" }} title="Xem minh chứng" />
              )
            ) : (
              <Spinner />
            )}
          </div>
        </div>
      );
    })()
  )}
  {previewAvatar && profile?.avatar && (
  <div
    onClick={() => setPreviewAvatar(false)}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.7)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000000,
    }}
  >
    <img
      src={profile.avatar}
      style={{
        maxWidth: "90%",
        maxHeight: "90%",
        borderRadius: 10,
      }}
    />
  </div>
)}
    </div>
  </div>
  );
}