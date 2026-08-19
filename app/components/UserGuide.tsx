"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { CircleHelp, X } from "lucide-react";

export default function UserGuide() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("start");

  if (pathname !== "/" && pathname !== "/introduce") {
    return null;
  }

  return (
    <>
      {/* Nút ? góc dưới bên phải */}
<button
  className="user-guide-button"
  onClick={() => setOpen(true)}
  aria-label="Hướng dẫn sử dụng"
  title="Hướng dẫn sử dụng"
  style={{
    position: "fixed",
    right: "24px",
    bottom: "24px",
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#dbe3ef",
    background: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "21px",
    fontWeight: 700,
    fontFamily: "Arial, sans-serif",
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.12)",
    zIndex: 9999,
    transition: "all 0.2s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.boxShadow =
      "0 7px 20px rgba(15, 23, 42, 0.16)";
    e.currentTarget.style.borderColor = "#bfdbfe";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow =
      "0 4px 14px rgba(15, 23, 42, 0.12)";
    e.currentTarget.style.borderColor = "#dbe3ef";
  }}
>
  ?
</button>

      {/* Modal */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 10000,
          }}
        >
          {/* Nội dung modal */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "820px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: "18px",
              padding: "28px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.25)",
              position: "relative",
              textAlign: "left",
            }}
          >
            {/* Nút đóng */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Đóng"
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                borderWidth: 0,
                borderStyle: "solid",
                borderColor: "transparent",
                background: "#f1f5f9",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={19} />
            </button>

            {/* Icon */}
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <CircleHelp size={32} strokeWidth={2} />
            </div>

            {/* Tiêu đề */}
            <h2
              style={{
                margin: "0 48px 8px 0",
                fontSize: "22px",
                fontWeight: 700,
                color: "#1e293b",
                textAlign: "center",
              }}
            >
              Hướng dẫn sử dụng
            </h2>

            <p style={introStyle}>
              Chọn một tab bên dưới để xem hướng dẫn theo từng nhóm thao tác.
              Các bước được sắp xếp theo trình tự sử dụng thực tế.
            </p>

            <div style={tabListStyle} role="tablist" aria-label="Các phần hướng dẫn">
              {guideTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={getTabButtonStyle(activeTab === tab.id)}
                >
                  <span style={{ fontSize: 18 }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div style={tabContentStyle}>
              {activeTab === "start" && (
                <>
                  <GuideSection title="Đăng ký tài khoản">
                    <ol>
                      <li>Mở trang giới thiệu và chọn <b>Đăng ký</b>.</li>
                      <li>Nhập đúng MSSV, họ tên và lớp.</li>
                      <li>Tạo mật khẩu, sau đó nhập lại ở ô xác nhận.</li>
                      <li>Bấm nút đăng ký và chờ thông báo thành công.</li>
                    </ol>
                    <p>MSSV được dùng để đăng nhập. Hãy kiểm tra kỹ trước khi gửi vì thông tin này gắn với hồ sơ của bạn.</p>
                  </GuideSection>
                  <GuideSection title="Đăng nhập và trang chủ">
                    <ol>
                      <li>Nhập MSSV và mật khẩu đã đăng ký.</li>
                      <li>Bấm <b>Đăng nhập</b>.</li>
                      <li>Sau khi vào trang chủ, kiểm tra tên tài khoản và các tiêu chí đang có.</li>
                    </ol>
                    <p>Trang chủ là nơi xem nhanh tiến độ, hoạt động sắp tới, thông báo mới và lối tắt đến các chức năng chính.</p>
                  </GuideSection>
                  <GuideSection title="Điều hướng cơ bản">
                    <ul>
                      <li><b>Quản lí hồ sơ:</b> mở menu con để chọn 6 tiêu chí.</li>
                      <li><b>Xem Báo cáo:</b> xem và xuất báo cáo thành tích.</li>
                      <li><b>Mục tiêu học tập:</b> quản lý môn học và điểm.</li>
                      <li><b>Hoạt động sắp tới:</b> xem các hoạt động.</li>
                      <li><b>Thông báo:</b> xem lịch sử thông báo.</li>
                    </ul>
                  </GuideSection>
                </>
              )}

              {activeTab === "profile" && (
                <>
                  <GuideSection title="Chọn tiêu chí">
                    <ol>
                      <li>Rê chuột vào <b>Quản lí hồ sơ</b> trên Sidebar desktop.</li>
                      <li>Chọn một trong sáu mục: Đạo đức, Học tập, Thể lực, Tình nguyện, Hội nhập hoặc Thành tích khác.</li>
                      <li>Trên màn hình nhỏ, mở menu rồi chọn mục tương ứng.</li>
                    </ol>
                    <p>Mỗi tiêu chí có khu vực báo cáo riêng và chỉ hiển thị các minh chứng thuộc đúng tiêu chí đó.</p>
                  </GuideSection>
                  <GuideSection title="Tải minh chứng">
                    <ol>
                      <li>Vào đúng trang tiêu chí.</li>
                      <li>Kéo file vào vùng tải hoặc bấm để chọn file.</li>
                      <li>Chờ dòng trạng thái hoàn tất trước khi chuyển trang.</li>
                      <li>Kiểm tra file mới xuất hiện trong danh sách.</li>
                    </ol>
                    <p>Dung lượng tối đa là 25 MB. Định dạng hỗ trợ gồm PDF, JPG, PNG, WebP, TXT, Word, Excel và ZIP.</p>
                  </GuideSection>
                  <GuideSection title="Quản lý minh chứng">
                    <p><b>Xem:</b> mở cửa sổ xem trước.</p>
                    <p><b>Tải về:</b> tải file về máy từ cửa sổ xem trước.</p>
                    <p><b>Đổi tên:</b> nhập tên mới và giữ phần mở rộng nếu muốn giữ định dạng.</p>
                    <p><b>Xóa:</b> xác nhận lần nữa. File trên Drive và bản ghi liên quan sẽ được xóa.</p>
                    <p>Không nhấn nhiều lần khi đang xử lý để tránh tạo thao tác trùng.</p>
                  </GuideSection>
                </>
              )}

              {activeTab === "reports" && (
                <>
                  <GuideSection title="Viết báo cáo theo tiêu chí">
                    <ol>
                      <li>Mở một trang tiêu chí.</li>
                      <li>Nhập nội dung vào trình soạn thảo báo cáo.</li>
                      <li>Kiểm tra nội dung rồi bấm <b>Lưu</b>.</li>
                      <li>Quan sát thời gian cập nhật để biết dữ liệu đã được lưu.</li>
                    </ol>
                    <p>Nội dung báo cáo nên ngắn gọn, có số liệu hoặc minh chứng cụ thể và đúng với tiêu chí đang chọn.</p>
                  </GuideSection>
                  <GuideSection title="Mẫu báo cáo Đạo đức tốt">
                    <p>Trang Đạo đức tốt có nút <b>Tạo lại mẫu</b>. Nút này đưa nội dung về mẫu mặc định của hệ thống.</p>
                    <p>Chỉ dùng nút này khi muốn bắt đầu lại. Nội dung hiện tại có thể bị thay thế, vì vậy hãy lưu bản riêng nếu cần.</p>
                  </GuideSection>
                  <GuideSection title="Xem và xuất báo cáo PDF">
                    <ol>
                      <li>Mở <b>Xem Báo cáo</b> trên Sidebar.</li>
                      <li>Kiểm tra thông tin cá nhân và nội dung các tiêu chí.</li>
                      <li>Bấm nút xuất PDF.</li>
                      <li>Chờ file tải xong rồi mở từ thư mục tải xuống.</li>
                    </ol>
                  </GuideSection>
                </>
              )}

              {activeTab === "updates" && (
                <>
                  <GuideSection title="Bật thông báo trình duyệt">
                    <ol>
                      <li>Đăng nhập tài khoản.</li>
                      <li>Bấm nút thông báo ở Sidebar.</li>
                      <li>Chọn <b>Cho phép</b> khi trình duyệt hỏi quyền.</li>
                      <li>Kiểm tra trạng thái chuyển sang đang bật.</li>
                    </ol>
                    <p>Nếu đã chặn quyền, hãy mở cài đặt thông báo của trình duyệt và cho phép lại trang web.</p>
                  </GuideSection>
                  <GuideSection title="Xem thông báo">
                    <ol>
                      <li>Mở <b>Thông báo</b>.</li>
                      <li>Dùng ô tìm kiếm để lọc theo tiêu đề hoặc nội dung.</li>
                      <li>Dùng bộ lọc loại thông báo khi cần.</li>
                      <li>Bấm xem chi tiết nếu thông báo có liên kết.</li>
                    </ol>
                  </GuideSection>
                  <GuideSection title="Hoạt động và trao đổi">
                    <p>Trong <b>Hoạt động sắp tới</b>, bạn có thể theo dõi nội dung, thời gian và thông tin đăng ký.</p>
                    <p>Trong <b>Trao đổi</b>, gửi câu hỏi hoặc phản hồi cho quản trị viên. Khi có tin mới, kiểm tra cả khu vực thông báo.</p>
                  </GuideSection>
                </>
              )}

              {activeTab === "study" && (
                <>
                  <GuideSection title="Thêm môn học">
                    <ol>
                      <li>Mở <b>Mục tiêu học tập</b>.</li>
                      <li>Chọn học kỳ hiện tại.</li>
                      <li>Nhập tên môn, số tín chỉ và điểm.</li>
                      <li>Bấm lưu để thêm môn vào danh sách.</li>
                    </ol>
                    <p>Nhập đúng số tín chỉ vì hệ thống dùng số tín chỉ để tính điểm trung bình có trọng số.</p>
                  </GuideSection>
                  <GuideSection title="Theo dõi điểm">
                    <p>Hệ thống tổng hợp điểm theo các học kỳ và hiển thị GPA hệ 10, GPA hệ 4 cùng tổng tín chỉ.</p>
                    <p>Khi sửa hoặc xóa môn, hãy kiểm tra lại kết quả tổng hợp sau khi danh sách tải lại.</p>
                  </GuideSection>
                </>
              )}

              {activeTab === "account" && (
                <>
                  <GuideSection title="Đổi mật khẩu">
                    <ol>
                      <li>Mở <b>Đổi mật khẩu</b> từ Sidebar.</li>
                      <li>Nhập mật khẩu mới và nhập lại chính xác.</li>
                      <li>Bấm <b>Lưu mật khẩu mới</b>.</li>
                      <li>Đăng nhập lại nếu hệ thống yêu cầu.</li>
                    </ol>
                    <p>Nên dùng mật khẩu đủ dài, có chữ hoa, chữ thường và số. Không dùng mật khẩu dễ đoán hoặc chia sẻ cho người khác.</p>
                  </GuideSection>
                  <GuideSection title="Đăng xuất an toàn">
                    <p>Bấm <b>Đăng xuất</b> ở cuối Sidebar sau khi hoàn tất công việc, đặc biệt khi dùng máy tính công cộng.</p>
                    <p>Sau khi đăng xuất, bạn sẽ được đưa về trang giới thiệu và cần đăng nhập lại để xem hồ sơ.</p>
                  </GuideSection>
                  <GuideSection title="Xử lý sự cố">
                    <ul>
                      <li>Không đăng nhập được: kiểm tra MSSV, mật khẩu và kết nối mạng.</li>
                      <li>Không tải file được: kiểm tra file dưới 25 MB và đúng định dạng.</li>
                      <li>Upload lâu: không đóng trang, không bấm upload lần nữa; chờ hoặc thử file nhỏ.</li>
                      <li>Không thấy dữ liệu: tải lại trang và kiểm tra đúng tài khoản.</li>
                      <li>Không nhận thông báo: kiểm tra quyền thông báo của trình duyệt.</li>
                      <li>Vẫn lỗi: chụp màn hình thông báo lỗi và gửi cho quản trị viên.</li>
                    </ul>
                  </GuideSection>
                </>
              )}
            </div>

            {/* Nút đóng */}
            <button
              onClick={() => setOpen(false)}
              style={{
                marginTop: "24px",
                padding: "10px 24px",
                borderRadius: "10px",
                borderWidth: 0,
                borderStyle: "solid",
                borderColor: "transparent",
                background: "#2563eb",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function GuideSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={guideSectionStyle}>
      <h3 style={guideSectionTitleStyle}>{title}</h3>
      <div style={guideTextStyle}>{children}</div>
    </section>
  );
}

const introStyle: CSSProperties = {
  margin: "0 0 18px",
  fontSize: "14px",
  lineHeight: 1.6,
  color: "#475569",
};

const guideTabs = [
  { id: "start", label: "Bắt đầu", icon: "🚀" },
  { id: "profile", label: "Hồ sơ", icon: "🗂️" },
  { id: "reports", label: "Báo cáo", icon: "📝" },
  { id: "updates", label: "Thông báo", icon: "🔔" },
  { id: "study", label: "Học tập", icon: "📊" },
  { id: "account", label: "Tài khoản", icon: "🔐" },
];

const tabListStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  overflowX: "auto",
  paddingBottom: "8px",
  marginBottom: "14px",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "#e2e8f0",
};

function getTabButtonStyle(isActive: boolean): CSSProperties {
  return {
    flex: "0 0 auto",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "9px 12px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: isActive ? "#2563eb" : "#e2e8f0",
    borderRadius: "10px",
    background: isActive ? "#2563eb" : "#f8fafc",
    color: isActive ? "#fff" : "#475569",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

const tabContentStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "12px",
};

/* Kept as a shared style for guide content blocks. */
const guideGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "12px",
};

const guideSectionStyle: CSSProperties = {
  padding: "14px 16px",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "#e2e8f0",
  borderRadius: "12px",
  background: "#f8fafc",
};

const guideSectionTitleStyle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: "15px",
  lineHeight: 1.4,
  color: "#1e3a8a",
};

const guideTextStyle: CSSProperties = {
  fontSize: "13px",
  lineHeight: 1.55,
  color: "#475569",
};