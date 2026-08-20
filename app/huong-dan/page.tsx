"use client";

import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function HuongDanPage() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const sections = [
    {
      id: "start",
      icon: "🚀",
      title: "Bắt đầu sử dụng hệ thống",
      content:
        "Sau khi đăng nhập, bạn sẽ được chuyển đến trang chủ. Tại đây có thể theo dõi tình trạng hồ sơ, các tiêu chí đã đạt, hoạt động sắp tới và các chức năng chính của hệ thống.",
    },
    {
      id: "profile",
      icon: "📋",
      title: "Quản lý hồ sơ",
      content:
        "Vào mục Quản lý hồ sơ để xem và bổ sung minh chứng cho từng tiêu chí Sinh viên 5 tốt. Bạn có thể lựa chọn từng tiêu chí như Đạo đức tốt, Học tập tốt, Thể lực tốt, Tình nguyện tốt và Hội nhập tốt.",
    },
    {
      id: "score",
      icon: "📊",
      title: "Mục tiêu học tập",
      content:
        "Mục tiêu học tập giúp bạn theo dõi kết quả học tập và chủ động kiểm tra tiến độ của mình trong quá trình phấn đấu đạt danh hiệu Sinh viên 5 tốt.",
    },
    {
      id: "activity",
      icon: "📅",
      title: "Hoạt động",
      content:
        "Tại mục Hoạt động, bạn có thể xem các hoạt động đang diễn ra hoặc sắp diễn ra và theo dõi tiêu chí mà hoạt động đó hỗ trợ.",
    },
    {
      id: "message",
      icon: "💬",
      title: "Nhắn tin với Ban Chủ nhiệm",
      content:
        "Sử dụng chức năng Nhắn tin để trao đổi với Ban Chủ nhiệm Câu lạc bộ Sinh viên 5 tốt BMU khi cần hỗ trợ hoặc giải đáp các vấn đề liên quan đến hồ sơ.",
    },
    {
      id: "report",
      icon: "📑",
      title: "Xem báo cáo",
      content:
        "Mục Xem báo cáo giúp bạn theo dõi tổng quan tình trạng hồ sơ, các tiêu chí đã đạt và những nội dung còn thiếu.",
    },
    {
      id: "export",
      icon: "📥",
      title: "Xuất hồ sơ",
      content:
        "Bạn có thể sử dụng nút Xuất hồ sơ tại trang chủ để tải toàn bộ hồ sơ và minh chứng của mình về máy dưới dạng tệp ZIP.",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f5f7fb",
      }}
    >
      <Header
        tab="guide"
        setTab={() => {}}
        openCriteria={() => {}}
        openProfile={() => {}}
      />

      <main
        style={{
          flex: 1,
          padding: "30px 16px 80px",
          backgroundImage:
            "linear-gradient(rgba(245,247,251,.92), rgba(245,247,251,.92)), url('/gioithieu.avif')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1000,
            margin: "0 auto",
          }}
        >
          {/* TIÊU ĐỀ */}
          <div
            style={{
              textAlign: "center",
              marginBottom: 28,
            }}
          >
            <div
              style={{
                fontSize: 42,
                marginBottom: 8,
              }}
            >
              📖
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 800,
                color: "#0F172A",
              }}
            >
              Hướng dẫn sử dụng
            </h1>

            <p
              style={{
                margin: "8px auto 0",
                maxWidth: 700,
                fontSize: 14,
                lineHeight: 1.6,
                color: "#64748B",
              }}
            >
              Hướng dẫn sử dụng Hệ thống hỗ trợ Sinh viên 5 tốt
              Trường Đại học Y Dược Buôn Ma Thuột.
            </p>
          </div>

          {/* LƯU Ý */}
          <div
            style={{
              background:
                "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
              border: "1px solid #BFDBFE",
              borderRadius: 16,
              padding: "16px 18px",
              marginBottom: 18,
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              💡
            </div>

            <div>
              <div
                style={{
                  fontWeight: 800,
                  color: "#1E40AF",
                  fontSize: 14,
                  marginBottom: 4,
                }}
              >
                Lưu ý
              </div>

              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "#1E3A8A",
                }}
              >
                Hãy kiểm tra kỹ thông tin cá nhân và minh chứng
                trước khi hoàn tất hồ sơ. Nếu gặp vấn đề, bạn có
                thể sử dụng chức năng Nhắn tin để được hỗ trợ.
              </div>
            </div>
          </div>

          {/* CÁC MỤC HƯỚNG DẪN */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {sections.map((section) => {
              const isOpen = openSection === section.id;

              return (
                <div
                  key={section.id}
                  style={{
                    background: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow:
                      "0 3px 10px rgba(15, 23, 42, 0.05)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    style={{
                      width: "100%",
                      border: "none",
                      background: "#fff",
                      padding: "16px 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: "#EFF6FF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      {section.icon}
                    </div>

                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 800,
                          color: "#0F172A",
                        }}
                      >
                        {section.title}
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: 18,
                        color: "#2563EB",
                        transform: isOpen
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        transition:
                          "transform .2s ease",
                      }}
                    >
                      ▼
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding:
                          "0 18px 18px 70px",
                        fontSize: 14,
                        lineHeight: 1.7,
                        color: "#475569",
                      }}
                    >
                      {section.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* HỖ TRỢ */}
          <div
            style={{
              marginTop: 20,
              background:
                "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
              border: "1px solid #FED7AA",
              borderRadius: 16,
              padding: "18px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 24,
                marginBottom: 6,
              }}
            >
              💬
            </div>

            <div
              style={{
                fontWeight: 800,
                fontSize: 15,
                color: "#9A3412",
              }}
            >
              Cần hỗ trợ?
            </div>

            <div
              style={{
                marginTop: 5,
                fontSize: 13,
                color: "#C2410C",
                lineHeight: 1.5,
              }}
            >
              Nếu bạn gặp khó khăn trong quá trình sử dụng hệ
              thống, hãy liên hệ với Ban Chủ nhiệm thông qua
              chức năng Nhắn tin.
            </div>

            <a
              href="/trao-doi"
              style={{
                display: "inline-block",
                marginTop: 12,
                padding: "9px 16px",
                borderRadius: 10,
                background: "#F97316",
                color: "#fff",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              💬 Nhắn tin hỗ trợ →
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}