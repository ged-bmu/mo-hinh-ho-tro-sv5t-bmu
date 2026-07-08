"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Sidebar from "../components/Sidebar";
import CriteriaModal from "../components/CriteriaModal";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Spinner from "../components/Spinner";
import { FaFilePdf } from "react-icons/fa";

export default function BaoCaoPage() {
  const [profile, setProfile] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCriteria, setShowCriteria] = useState(false);
  const [tab, setTab] = useState("proof");
  const [isMobile, setIsMobile] = useState(false);

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

  useEffect(() => {
    const resize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    resize();

    window.addEventListener("resize", resize);

    return () =>
      window.removeEventListener("resize", resize);
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
          background: "#eef3f9",
          padding: "30px",
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
            {isMobile ? (
              <div
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: "16px",
                  lineHeight: "1.8",
                }}
              >
                <div
                  style={{
                    fontSize: "52px",
                    marginBottom: "12px",
                  }}
                >
                  💻
                </div>

                <b>Vui lòng sử dụng máy tính</b>

                <div
                  style={{
                    marginTop: "8px",
                  }}
                >
                  để xem chi tiết báo cáo.
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: "#fff",
                  borderRadius: "20px",
                  padding: "24px 28px",
                  maxWidth: "1600px",
                  margin: "0 auto",
                  boxShadow:
                    "0 12px 40px rgba(0,0,0,.08)",
                  border:
                    "1px solid #e8edf5",
                }}
              >
                {/* Thanh chức năng */}

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

                {/* Tiêu đề */}

                <div
                  style={{
                    textAlign: "center",
                    marginBottom: "18px",
                  }}
                >
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
                    ĐỀ NGHỊ CÔNG NHẬN
                    DANH HIỆU SINH VIÊN
                    5 TỐT CẤP TRƯỜNG
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 16,
                      color: "#64748b",
                    }}
                  >
                    Năm học 2025 – 2026
                  </div>

                  <hr
                    style={{
                      marginTop: 14,
                      border: "none",
                      borderTop:
                        "2px solid #dbeafe",
                    }}
                  />
                </div>

                <table
                  style={{
                    width: "100%",
                    tableLayout: "fixed",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          width: "280px",
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
            )}
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
 