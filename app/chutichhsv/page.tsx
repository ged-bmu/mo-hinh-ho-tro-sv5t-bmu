"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Spinner from "@/app/components/Spinner";
import Header from "../components/Header";
import CriteriaModal from "../components/CriteriaModal";
import Footer from "../components/Footer";
import SidebarChutichhsv from "./sidebarchutichhsv/page";

export default function ChuTichHSVPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [tab, setTab] = useState("");
  const [showCriteria, setShowCriteria] = useState(false);

  useEffect(() => {
    checkAccount();
  }, []);

  async function checkAccount() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/introduce";
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("ho_ten, email, roles")
      .eq("id", user.id)
      .single();

    if (!data?.roles?.includes("chu_tich_hsv")) {
      window.location.href = "/";
      return;
    }

    setProfile(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
        }}
      >
        <Spinner />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f8fafc",
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
          alignItems: "stretch",
          minWidth: 0,
          background: "#f8fafc",
        }}
      >
        {/* ===================================================
            SIDEBAR
        =================================================== */}

        <SidebarChutichhsv />

        {/* ===================================================
            MAIN CONTENT
        =================================================== */}

        <main
          style={{
            flex: 1,
            minWidth: 0,
            background: "#f8fafc",
          }}
        >
          <div
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "30px",
            }}
          >
            <div
              style={{
                maxWidth: "1200px",
                margin: "0 auto",
                width: "100%",
              }}
            >
              {/* =================================================
                  HEADER BLUE
              ================================================= */}

              <div
                style={{
                  background:
                    "linear-gradient(135deg, #1d4ed8, #2563eb)",
                  borderRadius: "20px",
                  padding: "32px",
                  color: "#fff",
                  marginBottom: "25px",
                  boxShadow:
                    "0 8px 25px rgba(37, 99, 235, 0.18)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "14px",
                        opacity: 0.85,
                        marginBottom: "8px",
                        fontWeight: 500,
                      }}
                    >
                      HỆ THỐNG QUẢN LÝ HỘI SINH VIÊN
                    </div>

                    <h1
                      style={{
                        fontSize: "20px",
                        fontWeight: 700,
                        margin: 0,
                        lineHeight: 1.3,
                      }}
                    >
                      Chủ tịch Hội Sinh viên Việt Nam Trường Đại học
                      Y Dược Buôn Ma Thuột
                    </h1>
                  </div>

                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "18px",
                      background:
                        "rgba(255,255,255,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "30px",
                      border:
                        "1px solid rgba(255,255,255,0.2)",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src="/bonghoa5tot.png"
                      alt="Bông hoa 5 tốt"
                      style={{
                        width: "42px",
                        height: "42px",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* =================================================
                  WELCOME
              ================================================= */}

              <div
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "22px 25px",
                  marginBottom: "25px",
                  border: "1px solid #e2e8f0",
                  boxShadow:
                    "0 2px 8px rgba(15, 23, 42, 0.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: "#dbeafe",
                      color: "#1d4ed8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {profile?.ho_ten
                      ?.charAt(0)
                      ?.toUpperCase() || "C"}
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      Xin chào, Đồng chí {profile?.ho_ten} - Chủ tịch Hội Sinh viên Trường
                    </div>
                  </div>
                </div>
              </div>

              {/* =================================================
                  SECTION TITLE
              ================================================= */}

              <div
                style={{
                  marginBottom: "15px",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  Trung tâm điều hành
                </h2>

                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#64748b",
                    fontSize: "14px",
                  }}
                >
                  Quản lý và theo dõi hoạt động của Ban Chấp hành
                </p>
              </div>

              {/* =================================================
                  MENU CARDS
              ================================================= */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "18px",
                  marginBottom: "30px",
                }}
              >
                {/* =================================================
                    QUẢN LÝ BCH
                ================================================= */}

                <button
                  type="button"
                  onClick={() => {
                    window.location.href = "/admin/accounts";
                  }}
                  style={{
                    textAlign: "left",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    background: "#fff",
                    padding: "22px",
                    cursor: "pointer",
                    boxShadow:
                      "0 2px 8px rgba(15, 23, 42, 0.04)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "#dbeafe",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "23px",
                      marginBottom: "15px",
                    }}
                  >
                    👥
                  </div>

                  <div
                    style={{
                      fontSize: "17px",
                      fontWeight: 700,
                      color: "#0f172a",
                      marginBottom: "6px",
                    }}
                  >
                    Quản lý Ban Chấp hành
                  </div>

                  <div
                    style={{
                      fontSize: "14px",
                      color: "#64748b",
                      lineHeight: 1.5,
                    }}
                  >
                    Tạo, chỉnh sửa và quản lý tài khoản thành viên
                    BCH.
                  </div>

                  <div
                    style={{
                      marginTop: "16px",
                      color: "#2563eb",
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    Quản lý →
                  </div>
                </button>

                {/* =================================================
                    XÉT DUYỆT
                ================================================= */}

                <button
                  type="button"
                  onClick={() => {
                    window.location.href =
                      "/chutichhsv/xetduyet";
                  }}
                  style={{
                    textAlign: "left",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    background: "#fff",
                    padding: "22px",
                    cursor: "pointer",
                    boxShadow:
                      "0 2px 8px rgba(15, 23, 42, 0.04)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "#dcfce7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "23px",
                      marginBottom: "15px",
                    }}
                  >
                    📋
                  </div>

                  <div
                    style={{
                      fontSize: "17px",
                      fontWeight: 700,
                      color: "#0f172a",
                      marginBottom: "6px",
                    }}
                  >
                    Xét duyệt hồ sơ SV5T
                  </div>

                  <div
                    style={{
                      fontSize: "14px",
                      color: "#64748b",
                      lineHeight: 1.5,
                    }}
                  >
                    Theo dõi và quản lý quá trình xét duyệt hồ sơ
                    Sinh viên 5 tốt.
                  </div>

                  <div
                    style={{
                      marginTop: "16px",
                      color: "#16a34a",
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    Xem hồ sơ →
                  </div>
                </button>

                {/* =================================================
                    BÁO CÁO
                ================================================= */}

                <button
                  type="button"
                  onClick={() => {
                    alert(
                      "Chức năng báo cáo sẽ được phát triển."
                    );
                  }}
                  style={{
                    textAlign: "left",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    background: "#fff",
                    padding: "22px",
                    cursor: "pointer",
                    boxShadow:
                      "0 2px 8px rgba(15, 23, 42, 0.04)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "#fef3c7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "23px",
                      marginBottom: "15px",
                    }}
                  >
                    📊
                  </div>

                  <div
                    style={{
                      fontSize: "17px",
                      fontWeight: 700,
                      color: "#0f172a",
                      marginBottom: "6px",
                    }}
                  >
                    Báo cáo & thống kê
                  </div>

                  <div
                    style={{
                      fontSize: "14px",
                      color: "#64748b",
                      lineHeight: 1.5,
                    }}
                  >
                    Theo dõi tiến độ xét duyệt và tổng hợp kết quả
                    hoạt động.
                  </div>

                  <div
                    style={{
                      marginTop: "16px",
                      color: "#d97706",
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    Xem báo cáo →
                  </div>
                </button>
              </div>
            </div>
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