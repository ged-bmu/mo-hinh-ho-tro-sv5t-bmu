"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import { sendNotification } from "@/lib/notification";
import { createPortal } from "react-dom";
import { FaFilePdf } from "react-icons/fa";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Spinner from "../../../components/Spinner";

export default function StudentsDetailPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [reportRef, setReportRef] = useState<HTMLDivElement | null>(null);
  const params = useParams();
  const id = params.id as string;
  const [profile, setProfile] = useState<any>(null);
  const [nhanXet, setNhanXet] = useState("");
  const [daoDucFiles, setDaoDucFiles] = useState<any[]>([]);
  const [hocTapFiles, setHocTapFiles] = useState<any[]>([]);
  const [theLucFiles, setTheLucFiles] = useState<any[]>([]);
  const [tinhNguyenFiles, setTinhNguyenFiles] = useState<any[]>([]);
  const [hoiNhapFiles, setHoiNhapFiles] = useState<any[]>([]);
  const [uuTienFiles, setUuTienFiles] = useState<any[]>([]);
  const [baoCaoFiles, setBaoCaoFiles] = useState<any[]>([]);
  const [trangThai, setTrangThai] = useState("");
  const [previewAvatar, setPreviewAvatar] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({top: 0,left: 0,});
  const [previewFolder, setPreviewFolder] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const criteriaList = [
  { key: "dao-duc", title: "❤️ Đạo đức tốt" },
  { key: "hoc-tap", title: "📚 Học tập tốt" },
  { key: "the-luc", title: "💪 Thể lực tốt" },
  { key: "tinh-nguyen", title: "🤝 Tình nguyện tốt" },
  { key: "hoi-nhap", title: "🌍 Hội nhập tốt" },
   { key: "uu-tien", title: "⭐ Thành tích khác" },
];
  const [displayNames, setDisplayNames] = useState<
  Record<string, string>
>({});

  useEffect(() => {
    if (!id) return;

    loadStudent();
    loadFiles();
    loadReports();
  }, [id]);
async function loadReports() {
  console.log("ĐANG LOAD REPORT VỚI ID:", id);

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", id);

  console.log("DATA REPORT:", data);
  console.log("ERROR REPORT:", error);

  if (error) {
    return;
  }

  setReports(data || []);
}
  async function loadStudent() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.log(error);
      return;
    }

    setProfile(data);
    setNhanXet(data.nhan_xet || "");
  }
async function updateCriteria(
  field: string,
  value: boolean
) {
const { error } = await supabase
  .from("profiles")
  .update({
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
    const folders = [
      {
  path: "bao-cao",
  setter: setBaoCaoFiles,
      },
      {
        path: "dao-duc",
        setter: setDaoDucFiles,
      },
      {
        path: "hoc-tap",
        setter: setHocTapFiles,
      },
      {
        path: "the-luc",
        setter: setTheLucFiles,
      },
      {
        path: "tinh-nguyen",
        setter: setTinhNguyenFiles,
      },
      {
        path: "hoi-nhap",
        setter: setHoiNhapFiles,
      },
      {
        path: "uu-tien",
        setter: setUuTienFiles,
      },
    ];

    for (const folder of folders) {
      const { data } = await supabase.storage
        .from("Ho so SV5T")
        .list(`${id}/${folder.path}`);

      folder.setter(
        (data || []).sort((a, b) =>
          a.name.localeCompare(
            b.name,
            undefined,
            {
              numeric: true,
              sensitivity: "base",
            }
          )
        )
      );
      const { data: uploadedFiles } =
  await supabase
    .from("uploaded_files")
    .select(
      "storage_name, display_name"
    );

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
    }
  }

  function renderFiles(
    files: any[],
    folder: string
  ) { 
    if (files.length === 0) {
      return (
        <div
          style={{
            color: "#94a3b8",
            fontStyle: "italic",
          }}
        >
          Chưa có minh chứng
        </div>
      );
    }

    return files.map((file) => {
      const url =
        process.env
          .NEXT_PUBLIC_SUPABASE_URL +
        `/storage/v1/object/public/Ho%20so%20SV5T/${id}/${folder}/${file.name}`;
async function exportReportPDF() {
  if (!reportRef) return;

  const canvas = await html2canvas(reportRef, {
    scale: 2,
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight =
    (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(
    imgData,
    "PNG",
    0,
    0,
    pdfWidth,
    pdfHeight
  );

  pdf.save(
    `Bao-cao-SV5T-${profile?.ho_ten}.pdf`
  );
}
      return (
  <div
    key={file.name}
    onClick={() => setOpenMenu(null)}
    style={{
      background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "10px",
            marginBottom: "10px",
          }}
        >
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
  <div
  onClick={() => window.open(url, "_blank")}
  style={{
    fontSize: "14px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "230px",
    cursor: "pointer",
    color: "#000000",
  }}
>
 {displayNames[file.name] || file.name.replace(/^\d+-/, "")}
</div>
  <div
    style={{
      position: "relative",
    }}
  >
   <span
  onClick={(e) => {
  e.stopPropagation();

  setOpenMenu(
    openMenu === `${folder}-${file.name}`
      ? null
      : `${folder}-${file.name}`
  );
}}
      style={{
        cursor: "pointer",
        fontSize: "20px",
        fontWeight: "bold",
      }}
    >
      ⋮
    </span>

{openMenu === `${folder}-${file.name}` && (
  <div
  style={{
  position: "absolute",
  bottom: "28px",
  right: "0",
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  zIndex: 9999,

  width: "200px",
}}
  >
    <div
      style={{
        padding: "12px",
        fontSize: "13px",
        background: "#f8fafc",
        borderBottom: "1px solid #e5e7eb",
        overflowWrap: "break-word",
        whiteSpace: "normal",
      }}
    >
      📄 {displayNames[file.name] || file.name.replace(/^\d+-/, "")}
    </div>

<div
  onClick={() => {
    console.log("PREVIEW URL:", url);
    setPreviewFile(file);
    setPreviewUrl(url);
    setPreviewFolder(folder);
    setPreviewOpen(true);
    setOpenMenu(null);
  }}
  style={{
    display: "block",
    padding: "8px",
    color: "#000",
    fontWeight: "600",
    fontSize: "12px",
    background: "white",
    cursor: "pointer",
  }}
>
  👁 Xem
</div>
  </div>
)}
  </div>
</div>

</div>
      );
    });
  }
async function exportStudentFolder() {
  const link =
    document.createElement("a");

  link.href =
    `/api/export-student/${id}`;

  link.download = "";

  document.body.appendChild(link);

  link.click();

  link.remove();
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
  const newName = prompt(
    "Nhập tên mới:",
    displayNames[file.name] || file.name.replace(/^\d+-/, "")
  );

  if (!newName) return;

  const { error } = await supabase
    .from("uploaded_files")
    .update({
      display_name: newName,
    })
    .eq("storage_name", file.name);

  if (error) {
    alert(error.message);
    return;
  }

 window.location.reload();
}
async function deleteFile(folder: string, fileName: string) {
  const ok = window.confirm("Bạn có chắc muốn xóa file này không?");

  if (!ok) return;

  const { error } = await supabase.storage
    .from("Ho so SV5T")
    .remove([`${id}/${folder}/${fileName}`]);

  if (error) {
    alert(error.message);
    return;
  }

  await supabase
    .from("uploaded_files")
    .delete()
    .eq("storage_name", fileName);

  window.location.reload();
}
async function exportReportPDF() {
  try {
    const res = await fetch(
      `/api/export-pdf/${id}`
    );

    if (!res.ok) {
      alert("Xuất PDF thất bại");
      return;
    }

    const blob = await res.blob();

    const url =
      window.URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;
    a.download = "Báo cáo Sinh viên 5 tốt cấp Trường.pdf";

    document.body.appendChild(a);

    a.click();

    a.remove();

    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.error(err);
    alert("Có lỗi khi xuất PDF");
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
    <h1
      style={{
        fontSize: "34px",
        marginBottom: "25px",
      }}
    >
      📂 Hồ sơ Sinh viên 5 Tốt cấp Trường
    </h1>

    <div
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "30px",
        marginBottom: "25px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      }}
    >
      <a
        href="/admin"
        style={{
          display: "inline-block",
          marginBottom: "25px",
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

      <h2
  style={{
    marginTop: "-10px",
    marginBottom: "20px",
  }}
>
        👤 Thông tin sinh viên
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 250px 500px",
          gap: "40px",
          alignItems: "start",
        }}
      >
        {/* Cột 1 */}
        <div>
          <div style={{ marginBottom: "20px" }}>
            <b>Họ tên:</b> {profile.ho_ten}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <b>Lớp:</b> {profile.lop}
          </div>

          <div style={{ marginTop: "40px" }}>
  <b>Báo cáo:</b>

  <button
    onClick={() => setReportOpen(true)}
    style={{
      marginLeft: "10px",
      border: "none",
      background: "none",
      color: "#2563eb",
      cursor: "pointer",
      fontWeight: "600",
    }}
  >
    👁 Xem
  </button>
</div>
</div>

        {/* Cột 2 */}
        <div>
          <div style={{ marginBottom: "20px" }}>
            <b>MSSV:</b> {profile.mssv}
          </div>

          <div>
            <b>Email:</b> {profile.email}
          </div>

        <button
    onClick={exportStudentFolder}
    style={{
      background: "#068804",
      color: "white",
      border: "none",
      padding: "8px 12px",
      marginTop: "40px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "600",
    }}
  >
     🗂️ Xuất hồ sơ
     
  </button>
        </div>

        {/* Cột 3 */}
        <div>
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  }}
>
  <h3
    style={{
      margin: 0,
      fontSize: "16px",
      fontWeight: "600",
    }}
  >
    📝 Nhận xét của hồ sơ
  </h3>

  <button
    onClick={async () => {
  const { error } = await supabase
    .from("profiles")
    .update({
      nhan_xet: nhanXet,
      ngay_nhan_xet: new Date().toISOString(),
    })
    .eq("id", id);

if (error) {
  console.log("LỖI UPDATE:", error);
  alert(error.message);
  return;
}

  await sendNotification(
    id,
    "review",
    "Bạn vừa có nhận xét mới",
    "Ban chủ nhiệm vừa nhận xét hồ sơ của bạn.",
    "/"
  );

  alert("Đã lưu nhận xét");
}}
    style={{
      padding: "8px 12px",
      border: "none",
      borderRadius: "10px",
      background: "#5b92ff",
      color: "white",
      cursor: "pointer",
      fontWeight: "600",
    }}
  >
    💾 Lưu nhận xét
  </button>
</div>


         <div
  style={{
    background: "#f1f5f9",
    borderRadius: "16px",
    padding: "20px",
    height: "140px",
    overflowY: "auto",
    lineHeight: "1.6",
    color: "#334155",
    fontSize: "16px",
  }}
>
            <textarea
  value={nhanXet}
  onChange={(e) => setNhanXet(e.target.value)}
  style={{
    width: "100%",
    height: "100%",
    border: "none",
    outline: "none",
    resize: "none",
    background: "transparent",
    fontSize: "16px",
  }}
/>
          </div>
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
  <div
  style={{
    overflowX: "auto",
  }}
>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#f1f5f9",
              }}
            >
              <th
  style={{
    padding: "15px",
    borderRight: "1px solid #e5e7eb",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <span>❤️ Đạo đức tốt</span>

    <input
  type="checkbox"
  checked={profile?.["dao-duc"] || false}
  onChange={(e) =>
    updateCriteria(
      "dao-duc",
      e.target.checked
    )
  }
  style={{
    width: "18px",
    height: "18px",
    cursor: "pointer",
  }}
/>
  </div>
</th>
              <th
  style={{
    padding: "15px",
    borderRight: "1px solid #e5e7eb",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <span>📚 Học tập tốt</span>

    <input
      type="checkbox"
      checked={profile?.["hoc-tap"] || false}
      onChange={(e) =>
        updateCriteria(
          "hoc-tap",
          e.target.checked
        )
      }
      style={{
        width: "18px",
        height: "18px",
        cursor: "pointer",
      }}
    />
  </div>
</th>

             <th
  style={{
    padding: "15px",
    borderRight: "1px solid #e5e7eb",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <span>💪 Thể lực tốt</span>

    <input
      type="checkbox"
      checked={profile?.["the-luc"] || false}
      onChange={(e) =>
        updateCriteria(
          "the-luc",
          e.target.checked
        )
      }
      style={{
        width: "18px",
        height: "18px",
        cursor: "pointer",
      }}
    />
  </div>
</th>

              <th
  style={{
    padding: "15px",
    borderRight: "1px solid #e5e7eb",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <span>🤝 Tình nguyện tốt</span>

    <input
      type="checkbox"
      checked={profile?.["tinh-nguyen"] || false}
      onChange={(e) =>
        updateCriteria(
          "tinh-nguyen",
          e.target.checked
        )
      }
      style={{
        width: "18px",
        height: "18px",
        cursor: "pointer",
      }}
    />
  </div>
</th>

              <th
  style={{
    padding: "15px",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <span>🌍 Hội nhập tốt</span>

    <input
      type="checkbox"
      checked={profile?.["hoi-nhap"] || false}
      onChange={(e) =>
        updateCriteria(
          "hoi-nhap",
          e.target.checked
        )
      }
      style={{
        width: "18px",
        height: "18px",
        cursor: "pointer",
      }}
    />
  </div>
</th>
              <th
                style={{
                  padding: "15px",
                }}
              >
                ⭐ Ưu tiên
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td
                style={{
                  verticalAlign: "top",
                  padding: "15px",
                  borderRight:
                    "1px solid #e5e7eb",
                }}
              >
                {renderFiles(
                  daoDucFiles,
                  "dao-duc"
                )}
              </td>

              <td
                style={{
                  verticalAlign: "top",
                  padding: "15px",
                  borderRight:
                    "1px solid #e5e7eb",
                }}
              >
                {renderFiles(
                  hocTapFiles,
                  "hoc-tap"
                )}
              </td>

              <td
                style={{
                  verticalAlign: "top",
                  padding: "15px",
                  borderRight:
                    "1px solid #e5e7eb",
                }}
              >
                {renderFiles(
                  theLucFiles,
                  "the-luc"
                )}
              </td>

              <td
                style={{
                  verticalAlign: "top",
                  padding: "15px",
                  borderRight:
                    "1px solid #e5e7eb",
                }}
              >
                {renderFiles(
                  tinhNguyenFiles,
                  "tinh-nguyen"
                )}
              </td>

              <td
                style={{
                  verticalAlign: "top",
                  padding: "15px",
                  borderRight:
                    "1px solid #e5e7eb",
                }}
              >
                {renderFiles(
                  hoiNhapFiles,
                  "hoi-nhap"
                )}
              </td>

              <td
                style={{
                  verticalAlign: "top",
                  padding: "15px",
                }}
              >
                {renderFiles(
                  uuTienFiles,
                  "uu-tien"
                )}
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
{reportOpen &&
  createPortal(
    <div
      onClick={() => setReportOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "90%",
          height: "90%",
          background: "#f1f5f9",
          borderRadius: "16px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            height: "60px",
            flexShrink: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 20px",
            background: "#fff",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div
  style={{
    display:"flex",
    alignItems:"center",
    gap:"10px",
  }}
>
 
  <button
  onClick={exportReportPDF}
  style={{
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
  }}
>
  <FaFilePdf size={18} />
  Xuất
</button>
</div>


          <button
            onClick={() => setReportOpen(false)}
            style={{
              width: "36px",
              height: "36px",
              border: "none",
              borderRadius: "50%",
              background: "#64748b",
              color: "#fff",
              cursor: "pointer",
              fontSize: "18px",
            }}
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "30px",
            display: "flex",
            justifyContent: "center",
            background: "#f1f5f9",
          }}
        >
<div
 ref={setReportRef}
  style={{
    width:"297mm",
    minHeight:"420mm",
    background:"#fff",
    padding:"30px",
    borderRadius:"8px",
    boxSizing:"border-box",
    boxShadow:"0 10px 30px rgba(0,0,0,.15)",
    fontFamily:"Times New Roman, serif",
    fontSize:"13pt",
  }}
>
  {/* Tiêu đề */}

  <div
    style={{
      textAlign: "center",
      marginBottom: "18px",
    }}
  >
    <div
      style={{
    fontFamily:"Times New Roman",
    fontSize:"16pt",
    fontWeight:700,
}}
    >
      <b>BÁO CÁO THÀNH TÍCH</b>
    </div>

    <div
      style={{
    fontFamily:"Times New Roman",
    fontSize:"16pt",
    fontWeight:700,
}}
    >
      <b>ĐỀ NGHỊ CÔNG NHẬN DANH HIỆU SINH VIÊN 5 TỐT CẤP TRƯỜNG</b>

    </div>

    <div
      style={{
       fontFamily:"Times New Roman",
    fontSize:"13pt",
    fontWeight:700,
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
            width: "280px",
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
      </div>
    </div>,
    document.body
  )}

{previewOpen &&
  createPortal(
    <div
      onClick={() => setPreviewOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "90%",
          height: "90%",
          background: "#fff",
          borderRadius: "12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER */}
<div
  style={{
    height: "55px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 14px",
    borderBottom: "1px solid #eee",
  }}
>
  <strong>
    {previewFile &&
      (displayNames[previewFile.name] ||
        previewFile.name.replace(/^\d+-/, ""))}
  </strong>

  <div
    style={{
      display: "flex",
      gap: "8px",
      alignItems: "center",
    }}
  >
    {/* TẢI FILE */}
    <button
      onClick={async () => {
        const res = await fetch(previewUrl);
        const blob = await res.blob();

        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = blobUrl;
        a.download =
          displayNames[previewFile.name] ||
          previewFile.name;

        a.click();

        URL.revokeObjectURL(blobUrl);
      }}
      style={{
        background: "#2563eb",
        color: "white",
        border: "none",
        padding: "8px 14px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "600",
      }}
    >
      ⬇ Tải file
    </button>


    {/* ĐÓNG */}
    <button
      onClick={() => setPreviewOpen(false)}
      style={{
        background: "#64748b",
        color: "white",
        border: "none",
        width: "38px",
        height: "38px",
        borderRadius: "50%",
        cursor: "pointer",
        fontSize: "18px",
        fontWeight: "bold",
      }}
    >
      ✕
    </button>
  </div>
</div>

        {/* BODY */}
        <div
          style={{
            flex: 1,
            background: "#f1f5f9",
          }}
        >
          <iframe
            src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
          />
        </div>
      </div>
    </div>,
    document.body
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
      zIndex: 99999,
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
  );
}