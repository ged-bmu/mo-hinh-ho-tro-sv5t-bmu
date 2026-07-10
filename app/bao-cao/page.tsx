"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Sidebar from "../components/Sidebar";
import CriteriaModal from "../components/CriteriaModal";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Spinner from "../components/Spinner";
import { FaFilePdf } from "react-icons/fa";
import AvatarEditor from "react-avatar-editor";
import { useRef } from "react";

export default function BaoCaoPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarMenu, setAvatarMenu] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [scale, setScale] = useState(1.2);
  const editorRef = useRef<any>(null);
  const canvas = editorRef.current?.getImageScaledToCanvas();
  useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (
      avatarRef.current &&
      !avatarRef.current.contains(event.target as Node)
    ) {
      setAvatarMenu(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener(
      "mousedown",
      handleClickOutside
    );
  };
}, []);

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  checkMobile();

  window.addEventListener("resize", checkMobile);

  return () => window.removeEventListener("resize", checkMobile);
}, []);
  const [profile, setProfile] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCriteria, setShowCriteria] = useState(false);
  const [tab, setTab] = useState("proof");

  const criteriaList = [
    { key: "dao-duc", title: "Đạo đức tốt" },
    { key: "hoc-tap", title: "Học tập tốt" },
    { key: "the-luc", title: "Thể lực tốt" },
    { key: "tinh-nguyen", title: "Tình nguyện tốt" },
    { key: "hoi-nhap", title: "Hội nhập tốt" },
    { key: "uu-tien", title: "Thành tích khác" },
  ];

  // =========================
  // INIT
  // =========================

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    await Promise.all([
      loadProfile(user.id),
      loadReports(user.id),
    ]);

    setLoading(false);
  }

  // =========================
  // PROFILE
  // =========================
async function handleAvatarUpload(
  e: React.ChangeEvent<HTMLInputElement>
) {
  const file = e.target.files?.[0];

  if (!file || !profile) return;

  const ext = file.name.split(".").pop();
  const fileName = `${profile.id}.${ext}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, {
      upsert: true,
    });
console.log("Upload error:", error);
if (error) {
  console.log(error);
  alert(error.message);
  return;
}

  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName);
console.log(data.publicUrl);
const avatar = `${data.publicUrl}?v=${Date.now()}`;

 const { data: updateData, error: updateError } = await supabase
  .from("profiles")
  .update({ avatar })
  .eq("id", profile.id)
  .select();

console.log("Update data:", updateData);
console.log("Update error:", updateError);

  await loadProfile(profile.id);
  console.log("Profile sau khi load:", profile);
}
  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
    }
  }

  // =========================
  // REPORT
  // =========================

  async function loadReports(userId: string) {
    const { data } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", userId);

    if (data) {
      setReports(data);
      console.log("Reports:", reports);
    }
  }
async function removeAvatar() {
  if (!profile?.avatar) return;

 const fileName = profile.avatar
  .split("/")
  .pop()
  ?.split("?")[0];

await supabase.storage
  .from("avatars")
  .remove([fileName!]);

  await supabase
    .from("profiles")
    .update({ avatar: null })
    .eq("id", profile.id);

  setProfile({
    ...profile,
    avatar: null,
  });
}
  // =========================
  // EXPORT PDF
  // =========================

  async function exportPDF() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Bạn chưa đăng nhập.");
        return;
      }

      // API chỉ xuất PDF
      const res = await fetch(
        `/api/export-pdf/${user.id}`
      );

      if (!res.ok) {
        const text = await res.text();

        console.error(text);

        alert("Xuất PDF thất bại.");

        return;
      }

      const blob = await res.blob();

      const url =
        window.URL.createObjectURL(blob);

      const a =
        document.createElement("a");

      a.href = url;
      a.download = "Bao-cao-SV5T.pdf";
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra.");
    }
  }

  // =========================
  // PRINT
  // =========================

  function printReport() {
    window.print();
  }
console.log("Render avatar:", profile?.avatar);
  // =========================
  // RETURN
  // =========================

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
    minWidth: 0,
    background: "#eef3f9",
    padding: isMobile ? "12px" : "30px",
  }}
>
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "300px",
            }}
          >
            <Spinner />
          </div>
        ) : (
          <div style={{ width: "100%" }}>
           <div
  style={{
    background: "#fff",
    borderRadius: "20px",
    padding: isMobile ? "10px" : "16px",
    overflow: "hidden",
    width: "100%",
    maxWidth: "1600px",
    margin: "0 auto",
    boxShadow: "0 12px 40px rgba(0,0,0,.08)",
    border: "1px solid #e8edf5",
  }}
>
                {/* Thanh chức năng */}

{!isMobile && (
  <div
    style={{
      display: "flex",
      justifyContent: "flex-end",
      marginBottom: "16px",
    }}
  >
    <button
      onClick={exportPDF}
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
)}

                <div
  style={{
    position: "relative",
    textAlign: "center",
    paddingTop: isMobile ? "10px" : 0,
    marginBottom: "18px",
  }}
>
  {/* Ảnh thẻ */}
  <div
    ref={avatarRef}
    style={{
  position: isMobile ? "relative" : "absolute",
  left: isMobile ? "50%" : 60,
  transform: isMobile ? "translateX(-50%)" : "none",
  top: isMobile ? 0 : -60,
  marginBottom: isMobile ? 16 : 0,
      width: isMobile ? 100 : 120,
      height: isMobile ? 133 : 160,
      border: "1px solid #94a3b8",
      borderRadius: 6,
      overflow: "visible",
      background: "#f8fafc",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
<div
  onClick={() => setAvatarMenu(!avatarMenu)}
  style={{
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
  }}
>

  {profile?.avatar ? (
    <img
      src={profile.avatar}
      alt="Ảnh thẻ"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  ) : (
    <span
      style={{
        fontSize: 13,
        color: "#64748b",
        marginBottom: "5px",
      }}
    >
      Ảnh 3×4
      <br/>
      <i>(Nhấn để tải lên)</i>
      </span>
       
  )}
</div>

<input
  id="avatar-upload"
  type="file"
  accept="image/*"
  onChange={(e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setSelectedImage(file);
  setShowCrop(true);
}}
  style={{ display: "none" }}
/>
{avatarMenu && (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 120,
      width: 150,
      background: "#fff",
      border: "1px solid #ddd",
      borderRadius: 8,
      boxShadow: "0 5px 15px rgba(0,0,0,.2)",
      zIndex: 99999,
      overflow: "visible",
    }}
  >
    <label
      htmlFor="avatar-upload"
        onMouseEnter={(e) => {
    e.currentTarget.style.background = "#f1f5f9";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = "transparent";
    e.currentTarget.style.transform = "scale(1)";
  }}
  onMouseDown={(e) => {
    e.currentTarget.style.transform = "scale(0.97)";
  }}
  onMouseUp={(e) => {
    e.currentTarget.style.transform = "scale(1)";
  }}
     style={{
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 14px",
  cursor: "pointer",
  fontSize: 15,
  userSelect: "none",
}}
    >
      📤 Tải ảnh lên
    </label>

    {profile?.avatar && (
      <>
        <div
            onClick={() => {
    setPreviewAvatar(true);
    setAvatarMenu(false);
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = "#f1f5f9";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = "transparent";
    e.currentTarget.style.transform = "scale(1)";
  }}
  onMouseDown={(e) => {
    e.currentTarget.style.transform = "scale(0.97)";
  }}
  onMouseUp={(e) => {
    e.currentTarget.style.transform = "scale(1)";
  }}
          style={{
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 14px",
  cursor: "pointer",
  fontSize: 15,
  userSelect: "none",
}}
        >
          👁 Xem ảnh
        </div>

        <div
          onClick={() => {
    removeAvatar();
    setAvatarMenu(false);
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = "#fef2f2";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = "transparent";
    e.currentTarget.style.transform = "scale(1)";
  }}
  onMouseDown={(e) => {
    e.currentTarget.style.transform = "scale(0.97)";
  }}
  onMouseUp={(e) => {
    e.currentTarget.style.transform = "scale(1)";
  }}
          style={{
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 14px",
  cursor: "pointer",
  fontSize: 15,
  userSelect: "none",
}}
        >
          🗑 Xóa ảnh
        </div>
      </>
    )}
  </div>
)}
  </div>

  {/* Tiêu đề */}
  <div
    style={{
      fontSize: "24px",
      fontWeight: 700,
      color: "#1e3a8a",
    }}
  >
    BÁO CÁO THÀNH TÍCH
  </div>

  <div
    style={{
      marginTop: 4,
      fontSize: 18,
      fontWeight: 600,
    }}
  >
    ĐỀ NGHỊ CÔNG NHẬN DANH HIỆU SINH VIÊN 5 TỐT CẤP TRƯỜNG
  </div>

  <div
    style={{
      marginTop: 6,
      fontSize: 16,
      left: 35,
      color: "#64748b",
    }}
  >
    Năm học 2025 – 2026
  </div>

  <hr
    style={{
      marginTop: 14,
      border: "none",
      borderTop: "2px solid #dbeafe",
    }}
  />
  {isMobile && (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      marginTop: 16,
      marginBottom: 20,
    }}
  >
    <button
      onClick={exportPDF}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "#dc2626",
        color: "#fff",
        border: "none",
        padding: "10px 18px",
        borderRadius: 10,
        cursor: "pointer",
        fontWeight: 600,
        fontSize: 14,
      }}
    >
      <FaFilePdf size={18} />
      Xuất PDF
    </button>
  </div>
)}
</div>
<div
  style={{
    width: "100%",
    maxWidth: "100%",
    overflowX: "auto",
    overflowY: "hidden",
    WebkitOverflowScrolling: "touch",
  }}
>
                <table
  style={{
    minWidth: isMobile ? "900px" : "100%",
    width: "100%",
    tableLayout: "fixed",
    borderCollapse: "collapse",
  }}
>
                  <thead>
                    <tr>
                      <th
                        style={{
                          width: isMobile ? "250px" : "280px",
                          border:
                            "1px solid #cbd5e1",
                          background:
                            "#eff6ff",
                          padding:
                            "14px 10px",
                          fontWeight: 700,
                          fontSize: 16,
                        }}
                      >
                        Thông tin sinh viên
                      </th>

                      {criteriaList.map(
                        (item) => (
                          <th
                            key={item.key}
                            style={{
                              border:
                                "1px solid #cbd5e1",
                              background:
                                "#eff6ff",
                              padding:
                                "14px 10px",
                              fontWeight: 700,
                              fontSize: 16,
                            }}
                          >
                            {item.title}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td
                        style={{
                          border: "1px solid #cbd5e1",
                          padding: "16px",
                          verticalAlign: "top",
                          lineHeight: "1.6",
                          fontSize: "15px",
                        }}
                      >
                        <div>
                          <b>Họ và tên:</b> {profile?.ho_ten}
                        </div>

                        <div>
                          <b>MSSV:</b> {profile?.mssv}
                        </div>

                        <div>
                          <b>Nam/Nữ:</b>
                        </div>

                        <div>
                          <b>Năm sinh:</b>
                        </div>

                        <div>
                          <b>Dân tộc:</b>
                        </div>

                        <div>
                          <b>Sinh viên năm thứ:</b>
                        </div>

                        <div>
                          <b>Lớp:</b> {profile?.lop},
                          Trường Đại học Y Dược
                          Buôn Ma Thuột
                        </div>

                        <div>
                          <b>Chức vụ Đoàn - Hội:</b>
                        </div>

                        <div>
                          <b>Đảng viên/Đoàn viên:</b>
                        </div>

                        <div>
                          <b>Số điện thoại:</b>
                        </div>

                        <div>
                          <b>Email:</b>{" "}
                          {profile?.email}
                        </div>
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
        padding: "10px",
      }}
    >
      <div
        style={{
          minHeight: "300px",
          lineHeight: "1.6",
          wordBreak: "break-word",
          overflowWrap: "anywhere",
        }}
        dangerouslySetInnerHTML={{
          __html: report?.content || "",
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
    )}
  </main>
</div>

    {showCriteria && (
      <CriteriaModal
        onClose={() => setShowCriteria(false)}
      />
    )}
{previewAvatar && (
  <div
    onClick={() => setPreviewAvatar(false)}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.7)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
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
{showCrop && selectedImage && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.65)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 99999,
    }}
  >
    <div
      style={{
        width: 430,
        background: "#fff",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 20px 60px rgba(0,0,0,.25)",
      }}
    >
      <h3
        style={{
          margin: 0,
          marginBottom: 20,
          textAlign: "center",
          fontSize: 22,
          color: "#1e3a8a",
        }}
      >
        Chỉnh ảnh đại diện
      </h3>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <AvatarEditor
          ref={editorRef}
          image={selectedImage}
          width={300}
          height={400}
          border={20}
          scale={scale}
        />
      </div>

      {/* Zoom */}
      <div
        style={{
          marginTop: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
            fontWeight: 600,
          }}
        >
          <span>Thu phóng</span>
          <span>{scale.toFixed(1)}x</span>
        </div>

        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
          style={{
            width: "100%",
            cursor: "pointer",
          }}
        />
      </div>

      {/* Nút */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
          marginTop: 24,
        }}
      >
        <button
          onClick={() => {
            setShowCrop(false);
            setSelectedImage(null);
          }}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#fff",
            cursor: "pointer",
            fontSize: 15,
          }}
        >
          Hủy
        </button>

        <button
          onClick={async () => {
            const canvas =
              editorRef.current?.getImageScaledToCanvas();

            if (!canvas || !profile) return;

            canvas.toBlob(async (blob: Blob | null) => {
              if (!blob) return;

              const fileName = `${profile.id}.png`;

              const { error } = await supabase.storage
                .from("avatars")
                .upload(fileName, blob, {
                  upsert: true,
                  contentType: "image/png",
                });

              if (error) {
                alert(error.message);
                return;
              }

              const { data } = supabase.storage
                .from("avatars")
                .getPublicUrl(fileName);

              const avatar =
                data.publicUrl + "?t=" + Date.now();

              await supabase
                .from("profiles")
                .update({ avatar })
                .eq("id", profile.id);

              setProfile({
                ...profile,
                avatar,
              });

              setShowCrop(false);
              setSelectedImage(null);
            }, "image/png");
          }}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            background: "#2563eb",
            color: "#fff",
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          Lưu ảnh
        </button>
      </div>
    </div>
  </div>
)}
    <Footer />
  </div>
);
}
 