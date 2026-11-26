
"use client";

import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

type Section = {
  id: string;
  number: string;
  icon: string;
  title: string;
  subtitle: string;
  content: React.ReactNode;
};

const BLUE = "#2563EB";
const DARK = "#0F172A";
const GRAY = "#64748B";

const cardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E2E8F0",
  borderRadius: 16,
  overflow: "hidden",
  boxShadow: "0 3px 12px rgba(15,23,42,0.04)",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.8,
  color: "#475569",
  margin: "8px 0",
};

const headingStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
  color: DARK,
  margin: "20px 0 8px",
};

const stepStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 11,
  marginBottom: 12,
};

function Step({
  number,
  children,
}: {
  number: string;
  children: React.ReactNode;
}) {
  return (
    <div style={stepStyle}>
      <div
        style={{
          width: 27,
          height: 27,
          minWidth: 27,
          borderRadius: 9,
          background: "#EFF6FF",
          color: BLUE,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 800,
        }}
      >
        {number}
      </div>

      <div
        style={{
          flex: 1,
          fontSize: 14,
          lineHeight: 1.75,
          color: "#475569",
          paddingTop: 2,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Note({
  title = "Lưu ý",
  children,
  type = "blue",
}: {
  title?: string;
  children: React.ReactNode;
  type?: "blue" | "orange" | "green";
}) {
  const colors = {
    blue: {
      bg: "#EFF6FF",
      border: "#BFDBFE",
      title: "#1D4ED8",
      text: "#1E40AF",
      icon: "💡",
    },
    orange: {
      bg: "#FFF7ED",
      border: "#FED7AA",
      title: "#C2410C",
      text: "#9A3412",
      icon: "⚠️",
    },
    green: {
      bg: "#F0FDF4",
      border: "#BBF7D0",
      title: "#15803D",
      text: "#166534",
      icon: "✓",
    },
  };

  const c = colors[type];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 11,
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 12,
        padding: "13px 15px",
        margin: "14px 0",
      }}
    >
      <div style={{ fontSize: 19, flexShrink: 0 }}>
        {c.icon}
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: c.title,
            marginBottom: 4,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.75,
            color: c.text,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 style={headingStyle}>{children}</h3>;
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: "#EFF6FF",
        color: "#1D4ED8",
        borderRadius: 6,
        padding: "3px 8px",
        fontSize: 14,
        fontWeight: 700,
        margin: "2px 3px 2px 0",
      }}
    >
      {children}
    </span>
  );
}

export default function HuongDanPage() {
const [activeSection, setActiveSection] = useState("start");
const [showReminder, setShowReminder] = useState(false);

  const sections: Section[] = [
    // =====================================================
    // 01. TRUY CẬP HỆ THỐNG
    // =====================================================
    {
      id: "start",
      number: "01",
      icon: "🚀",
      title: "Truy cập và cài đặt hệ thống",
      subtitle: "Tìm kiếm, truy cập và cài đặt ứng dụng trên thiết bị",
      content: (
        <>
          <SubHeading>1. Truy cập hệ thống</SubHeading>

          <p style={paragraphStyle}>
            Sinh viên có thể sử dụng máy tính, máy tính bảng hoặc
            điện thoại thông minh để truy cập Hệ thống hỗ trợ
            Sinh viên 5 tốt Trường Đại học Y Dược Buôn Ma Thuột.
          </p>

          <Step number="1">
            Mở trình duyệt web trên thiết bị. Có thể sử dụng
            Google Chrome, Cốc Cốc, Safari hoặc các trình duyệt
            tương thích khác.
          </Step>

          <Step number="2">
            Tìm kiếm từ khóa{" "}
            <strong>"Hệ thống hỗ trợ SV5T BMU"</strong> hoặc{" "}
            <strong>"Mô hình hỗ trợ SV5T BMU"</strong>.
          </Step>

          <Step number="3">
            Chọn kết quả tương ứng để truy cập hệ thống.
            Sinh viên cũng có thể truy cập trực tiếp bằng đường
            dẫn chính thức bên dưới.
          </Step>

          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              padding: 15,
              margin: "12px 0",
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: GRAY,
                marginBottom: 7,
              }}
            >
              ĐƯỜNG DẪN TRUY CẬP CHÍNH THỨC
            </div>

            <a
              href="https://mo-hinh-ho-tro-sv5t-bmu.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: BLUE,
                fontSize: 14,
                fontWeight: 800,
                textDecoration: "none",
                overflowWrap: "anywhere",
              }}
            >
              https://mo-hinh-ho-tro-sv5t-bmu.vercel.app/
              ↗
            </a>
          </div>

          <SubHeading>2. Cài đặt trên điện thoại Android</SubHeading>

          <p style={paragraphStyle}>
            Sinh viên sử dụng nút tải ứng dụng trên giao diện
            giới thiệu của hệ thống để cài đặt ứng dụng trực tiếp
            vào màn hình chính điện thoại.
          </p>

          <Step number="1">
            Truy cập hệ thống bằng trình duyệt trên điện thoại.
          </Step>

          <Step number="2">
            Nhấn nút tải ứng dụng được hiển thị trên giao diện
            giới thiệu.
          </Step>

          <Step number="3">
            Thực hiện xác nhận cài đặt hoặc thêm ứng dụng vào
            màn hình chính theo thông báo của trình duyệt.
          </Step>

          <Step number="4">
            Sau khi hoàn tất, biểu tượng ứng dụng sẽ xuất hiện
            trên màn hình điện thoại. Sinh viên có thể mở hệ
            thống trực tiếp từ biểu tượng này.
          </Step>

          <SubHeading>3. Cài đặt trên điện thoại iPhone (iOS)</SubHeading>

          <p style={paragraphStyle}>
            Đối với iPhone, sinh viên thực hiện cài đặt thông qua
            trình duyệt Safari theo hướng dẫn hiển thị trên hệ
            thống.
          </p>

          <Step number="1">
            Mở đường dẫn hệ thống bằng trình duyệt Safari.
          </Step>

          <Step number="2">
            Nhấn nút <strong>Chia sẻ (Share)</strong> ở thanh
            công cụ phía dưới màn hình Safari.
          </Step>

          <Step number="3">
            Chọn chức năng{" "}
            <strong>Thêm vào Màn hình chính (Add to Home Screen)</strong>.
          </Step>

          <Step number="4">
            Nếu xuất hiện tùy chọn, chọn{" "}
            <strong>Mở dưới dạng ứng dụng web (Open as Web App)</strong>.
          </Step>

          <Step number="5">
            Nhấn <strong>Thêm (Add)</strong> để hoàn tất cài đặt.
          </Step>

          <Note>
            Việc cài đặt ứng dụng trên điện thoại chủ yếu giúp
            sinh viên thuận tiện nhận thông báo về tình trạng hồ
            sơ và các hoạt động sắp diễn ra. Không bắt buộc phải
            cài đặt ứng dụng để sử dụng hệ thống hoặc thực hiện
            quy trình nộp hồ sơ.
          </Note>
        </>
      ),
    },

    // =====================================================
    // 02. ĐĂNG KÝ TÀI KHOẢN
    // =====================================================
    {
      id: "account",
      number: "02",
      icon: "👤",
      title: "Đăng ký và đăng nhập tài khoản",
      subtitle: "Tạo tài khoản cá nhân để sử dụng các chức năng",
      content: (
        <>
          <SubHeading>1. Đăng ký tài khoản</SubHeading>

          <p style={paragraphStyle}>
            Để sử dụng các chức năng quản lý hồ sơ, sinh viên
            cần đăng ký tài khoản cá nhân trên hệ thống.
          </p>

          <Step number="1">
            Tại giao diện giới thiệu, nhấn nút{" "}
            <Tag>Đăng nhập</Tag>.
          </Step>

          <Step number="2">
            Tại giao diện đăng nhập, lựa chọn chức năng{" "}
            <Tag>ĐĂNG KÝ</Tag> để chuyển sang biểu mẫu tạo tài khoản.
          </Step>

          <Step number="3">
            Điền lần lượt các thông tin cá nhân theo yêu cầu
            của biểu mẫu đăng ký.
          </Step>

          <Step number="4">
            Kiểm tra lại thông tin đã nhập, sau đó thực hiện
            đăng ký tài khoản.
          </Step>

          <Step number="5">
            Khi đăng ký thành công, hệ thống sẽ hiển thị cửa
            sổ thông báo xác nhận.
          </Step>

          <SubHeading>2. Đăng nhập hệ thống</SubHeading>

          <Step number="1">
            Quay lại giao diện đăng nhập.
          </Step>

          <Step number="2">
            Nhập thông tin tài khoản và mật khẩu đã đăng ký.
          </Step>

          <Step number="3">
            Nhấn nút đăng nhập để truy cập vào hệ thống.
          </Step>

          <Step number="4">
            Sau khi đăng nhập thành công, sinh viên sẽ được
            chuyển đến giao diện làm việc của tài khoản cá nhân.
          </Step>

          <Note type="orange" title="Khuyến cáo bảo mật">
            Không nên sử dụng chung mật khẩu với các tài khoản
            mạng xã hội hoặc tài khoản cá nhân khác. Hãy sử dụng
            mật khẩu riêng cho hệ thống và không chia sẻ thông
            tin đăng nhập cho người khác.
          </Note>

          <SubHeading>3. Một số lưu ý khi sử dụng tài khoản</SubHeading>

          <ul
            style={{
              ...paragraphStyle,
              paddingLeft: 20,
              marginTop: 5,
            }}
          >
            <li>Đăng nhập bằng tài khoản cá nhân của mình.</li>
            <li>Kiểm tra tính chính xác của thông tin đăng ký.</li>
            <li>Không sử dụng tài khoản của sinh viên khác để kê khai hồ sơ.</li>
            <li>Chủ động bảo mật mật khẩu trong suốt quá trình sử dụng.</li>
          </ul>
        </>
      ),
    },

    // =====================================================
    // 03. TỔNG QUAN GIAO DIỆN
    // =====================================================
    {
      id: "overview",
      number: "03",
      icon: "🖥️",
      title: "Tổng quan giao diện và các chức năng",
      subtitle: "Làm quen với các khu vực làm việc của hệ thống",
      content: (
        <>
          <p style={paragraphStyle}>
            Sau khi đăng nhập thành công, sinh viên sẽ được
            chuyển đến giao diện chính. Đây là nơi tập trung
            các chức năng phục vụ việc theo dõi tiêu chuẩn,
            cập nhật hồ sơ và nắm bắt thông tin phong trào
            Sinh viên 5 tốt.
          </p>

          <SubHeading>Các chức năng chính</SubHeading>

          {[
            {
              icon: "📋",
              title: "Hồ sơ Sinh viên 5 tốt",
              desc: "Nơi sinh viên kê khai thành tích, viết báo cáo và tải lên minh chứng tương ứng với từng tiêu chí Sinh viên 5 tốt.",
            },
            {
              icon: "📊",
              title: "Xem báo cáo",
              desc: "Theo dõi thông tin báo cáo, tình trạng hồ sơ và các nội dung đã được cập nhật.",
            },
            {
              icon: "❓",
              title: "Xem tiêu chuẩn Sinh viên 5 tốt",
              desc: "Tra cứu các tiêu chuẩn thuộc danh hiệu Sinh viên 5 tốt để chủ động xác định nội dung cần phấn đấu.",
            },
            {
              icon: "📅",
              title: "Hoạt động sắp diễn ra",
              desc: "Theo dõi các chương trình, hoạt động được cập nhật trên hệ thống.",
            },
            {
              icon: "🔔",
              title: "Thông báo",
              desc: "Theo dõi các thông tin mới liên quan đến hồ sơ, thời hạn, kết quả và hoạt động.",
            },
          ].map((item, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                gap: 12,
                padding: "13px 0",
                borderBottom:
                  index !== 4 ? "1px solid #F1F5F9" : "none",
              }}
            >
              <div
                style={{
                  width: 39,
                  height: 39,
                  minWidth: 39,
                  borderRadius: 11,
                  background: "#EFF6FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 19,
                }}
              >
                {item.icon}
              </div>

              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: DARK,
                    marginBottom: 4,
                  }}
                >
                  {item.title}
                </div>

                <div
                  style={{
                    fontSize: 14,
                    color: GRAY,
                    lineHeight: 1.7,
                  }}
                >
                  {item.desc}
                </div>
              </div>
            </div>
          ))}

          <Note>
            Sinh viên nên làm quen với các chức năng ngay sau
            khi đăng nhập để thuận tiện trong việc theo dõi
            quá trình phấn đấu và cập nhật hồ sơ.
          </Note>
        </>
      ),
    },

    // =====================================================
    // 04. QUẢN LÝ HỒ SƠ
    // =====================================================
    {
      id: "profile",
      number: "04",
      icon: "📂",
      title: "Hồ sơ Sinh viên 5 tốt Sinh viên 5 tốt",
      subtitle: "Lựa chọn tiêu chí và kê khai thành tích",
      content: (
        <>
          <SubHeading>1. Truy cập chức năng Hồ sơ Sinh viên 5 tốt</SubHeading>

          <Step number="1">
            Đăng nhập vào tài khoản cá nhân.
          </Step>

          <Step number="2">
            Tại giao diện chính, tìm và chọn mục{" "}
            <Tag>Hồ sơ Sinh viên 5 tốt</Tag>.
          </Step>

          <Step number="3">
            Hệ thống sẽ chuyển đến giao diện quản lý hồ sơ
            Sinh viên 5 tốt.
          </Step>

          <SubHeading>2. Lựa chọn tiêu chí cần kê khai</SubHeading>

          <p style={paragraphStyle}>
            Hồ sơ được tổ chức theo 05 tiêu chí của danh hiệu
            Sinh viên 5 tốt. Sinh viên lựa chọn từng tiêu chí
            để kê khai các thành tích và tải lên minh chứng
            tương ứng.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 9,
              margin: "14px 0",
            }}
          >
            {[
              ["Đạo đức tốt"],
              ["Học tập tốt"],
              ["Thể lực tốt"],
              ["Tình nguyện tốt"],
              ["Hội nhập tốt"],
            ].map(([icon, title]) => (
              <div
                key={title}
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 11,
                  padding: "13px 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minWidth: 0,
                }}
              >
                <span style={{ fontSize: 19 }}>{icon}</span>

                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: DARK,
                  }}
                >
                  {title}
                </span>
              </div>
            ))}
          </div>

          <Step number="1">
            Chọn tiêu chí cần kê khai.
          </Step>

          <Step number="2">
            Đọc nội dung hướng dẫn và các yêu cầu hiển thị
            tại giao diện tiêu chí tương ứng.
          </Step>

          <Step number="3">
            Tiến hành kê khai lần lượt các thành tích vào
            phần Báo cáo.
          </Step>

          <Step number="4">
            Sau khi hoàn thành nội dung báo cáo, nhấn Lưu
            trước khi chuyển sang bước tải minh chứng.
          </Step>

          <SubHeading>3. Nguyên tắc kê khai hồ sơ</SubHeading>

          <ul
            style={{
              ...paragraphStyle,
              paddingLeft: 20,
            }}
          >
            <li>
              Kê khai thành tích đúng với tiêu chí tương ứng.
            </li>
            <li>
              Mỗi thành tích cần được đánh số thứ tự riêng:
              1, 2, 3, 4, ...
            </li>
            <li>
              Nội dung báo cáo phải phù hợp với thông tin
              thể hiện trên giấy chứng nhận, giấy khen hoặc
              minh chứng tương ứng.
            </li>
            <li>
              Không kê khai một minh chứng không có tệp
              hoặc tài liệu chứng minh tương ứng.
            </li>
            <li>
              Kiểm tra nội dung trước khi lưu để hạn chế
              sai sót.
            </li>
          </ul>

          <Note type="orange">
            Sinh viên cần thực hiện lần lượt đối với cả 05
            tiêu chí. Không nên chỉ hoàn thiện một tiêu chí
            rồi bỏ qua các tiêu chí còn lại.
          </Note>
        </>
      ),
    },

    // =====================================================
    // 05. VIẾT BÁO CÁO
    // =====================================================
    {
      id: "report",
      number: "05",
      icon: "✍️",
      title: "Hướng dẫn viết báo cáo thành tích",
      subtitle: "Cách trình bày nội dung thành tích theo quy định",
      content: (
        <>
          <p style={paragraphStyle}>
            Báo cáo là phần nội dung sinh viên kê khai các
            thành tích đã đạt được tương ứng với từng tiêu
            chí Sinh viên 5 tốt.
          </p>

          <SubHeading>1. Cấu trúc trình bày thành tích</SubHeading>

          <p style={paragraphStyle}>
            Theo hướng dẫn trong tài liệu sử dụng hệ thống,
            mỗi thành tích cần được trình bày theo cấu trúc:
          </p>

          <div
            style={{
              background: "#EFF6FF",
              border: "1px solid #BFDBFE",
              borderRadius: 12,
              padding: 15,
              margin: "12px 0",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "#1D4ED8",
                marginBottom: 8,
              }}
            >
              CẤU TRÚC VIẾT BÁO CÁO
            </div>

            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                lineHeight: 2,
                color: "#1E3A8A",
              }}
            >
              [Loại minh chứng] + [Nội dung ghi nhận/
              hoạt động/vai trò] + của [Đơn vị] +
              (Theo [Số quyết định] + [Thời gian diễn ra])
            </div>
          </div>

          <SubHeading>2. Giải thích các thành phần</SubHeading>

          {[
            {
              title: "Loại minh chứng",
              desc: "Bằng khen, Giấy khen, Giấy chứng nhận hoặc Danh sách.",
            },
            {
              title: "Nội dung ghi nhận / hoạt động / vai trò",
              desc: "Nội dung hoặc thành tích cụ thể được ghi rõ trên minh chứng. Nội dung cần chính xác, đầy đủ, viết in nghiêng.",
            },
            {
              title: "Đơn vị",
              desc: "Đơn vị khen thưởng, đơn vị tổ chức hoặc đơn vị cấp minh chứng.",
            },
            {
              title: "Số quyết định",
              desc: "Số quyết định được ghi trên minh chứng theo văn bản của đơn vị có thẩm quyền. Một số trường hợp có thể sử dụng số Kế hoạch (KH) hoặc Danh sách (DS).",
            },
            {
              title: "Thời gian diễn ra",
              desc: "Ngày, tháng, năm diễn ra chương trình hoặc hoạt động. Đối với minh chứng không thể hiện rõ ngày tháng, có thể sử dụng dấu gạch ngang để biểu thị.",
            },
          ].map((item, index) => (
            <div
              key={index}
              style={{
                padding: "11px 0",
                borderBottom: "1px solid #F1F5F9",
              }}
            >
              <div
                style={{
                  color: DARK,
                  fontSize: 14,
                  fontWeight: 800,
                  marginBottom: 5,
                }}
              >
                {index + 1}. {item.title}
              </div>

              <div
                style={{
                  color: GRAY,
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                {item.desc}
              </div>
            </div>
          ))}

          <SubHeading>3. Ví dụ trình bày thành tích</SubHeading>

          <p style={paragraphStyle}>
            Ví dụ về cách ghi một thành tích tham gia hoạt
            động tình nguyện:
          </p>

          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #CBD5E1",
              borderRadius: 12,
              padding: 15,
              margin: "10px 0",
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: GRAY,
                marginBottom: 8,
              }}
            >
              VÍ DỤ
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.85,
                color: DARK,
              }}
            >
              Giấy chứng nhận{" "}
              <strong>
                <i>
                  Đã tham gia Chương trình Tiếp sức Mùa Thi
                  đợt 2 Kỳ thi Tốt nghiệp THPT năm 2025
                </i>
              </strong>{" "}
              của BCH Đoàn Trường Đại học Y Dược Buôn Ma Thuột
              (Theo quyết định số: 12/QĐ-ĐTN ngày 06/7/2025).
            </div>
          </div>

          <SubHeading>4. Nguyên tắc đánh số thứ tự</SubHeading>

          <p style={paragraphStyle}>
            Mỗi thành tích trong báo cáo cần được đánh số
            thứ tự liên tục để thuận tiện đối chiếu với tệp
            minh chứng được tải lên hệ thống.
          </p>

          <div
            style={{
              background: "#F8FAFC",
              borderRadius: 12,
              padding: 14,
              border: "1px solid #E2E8F0",
              margin: "12px 0",
            }}
          >
            {[
              "1. Giấy chứng nhận tham gia chương trình A.",
              "2. Giấy chứng nhận tham gia hoạt động B.",
              "3. Giấy khen đạt thành tích C.",
              "4. Giấy chứng nhận tham gia chương trình D.",
            ].map((item) => (
              <div
                key={item}
                style={{
                  padding: "7px 0",
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "#475569",
                  borderBottom: "1px solid #E2E8F0",
                }}
              >
                {item}
              </div>
            ))}
          </div>

          <Note type="orange" title="Không được viết báo cáo quá sơ sài">
            Không chỉ ghi tên hoạt động như "Tham gia hiến
            máu" hoặc "Tham gia tình nguyện". Phải thể hiện rõ
            loại giấy tờ, nội dung ghi nhận, đơn vị cấp và
            thông tin quyết định hoặc thời gian tương ứng
            theo minh chứng.
          </Note>
        </>
      ),
    },

    // =====================================================
    // 06. TẢI MINH CHỨNG
    // =====================================================
    {
      id: "evidence",
      number: "06",
      icon: "📎",
      title: "Tải lên và đặt tên minh chứng",
      subtitle: "Đảm bảo báo cáo và tệp minh chứng tương ứng",
      content: (
        <>
          <SubHeading>1. Lưu báo cáo trước khi tải minh chứng</SubHeading>

          <Step number="1">
            Sau khi kê khai thành tích tại giao diện tiêu
            chí, kiểm tra lại toàn bộ nội dung.
          </Step>

          <Step number="2">
            Nhấn nút <Tag>Lưu</Tag> để lưu nội dung báo cáo
            trên hệ thống.
          </Step>

          <Step number="3">
            Sau khi lưu, tiến hành tải lên các tệp minh chứng
            tương ứng với những thành tích đã kê khai.
          </Step>

          <SubHeading>2. Nguyên tắc đặt tên minh chứng</SubHeading>

          <p style={paragraphStyle}>
            Tên tệp minh chứng cần ngắn gọn, dễ nhận diện và
            có số thứ tự tương ứng với thành tích đã ghi
            trong báo cáo.
          </p>

          <div
            style={{
              background: "#EFF6FF",
              border: "1px solid #BFDBFE",
              borderRadius: 12,
              padding: 15,
              margin: "12px 0",
            }}
          >
            <div
              style={{
                color: "#1D4ED8",
                fontSize: 14,
                fontWeight: 800,
                marginBottom: 8,
              }}
            >
              QUY TẮC ĐẶT TÊN
            </div>

            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: "#1E3A8A",
                textAlign: "center",
              }}
            >
              Số thứ tự + Tên minh chứng
            </div>

            <div
              style={{
                fontSize: 14,
                color: "#64748B",
                textAlign: "center",
                marginTop: 6,
              }}
            >
              Ví dụ: 01_Giay_chung_nhan_hien_mau.pdf
            </div>
          </div>

          <SubHeading>3. Ví dụ đối chiếu báo cáo và minh chứng</SubHeading>

          <p style={paragraphStyle}>
            Giả sử sinh viên đã kê khai 05 thành tích trong
            báo cáo. Các tệp minh chứng tương ứng có thể
            được đặt tên như sau:
          </p>

          {[
            {
              number: "01",
              report: 'GCN là TNV hoàn thành xuất sắc nhiệm vụ chương trình Trung Thu "Gói Trăng Trao Em" 2025.',
              file: "01_GCN_Goi_Trang_Trao_Em.pdf",
            },
            {
              number: "02",
              report: 'GCN "Hiến máu tình nguyện" ngày 05/02/2026.',
              file: "02_GCN_Hien_mau_05022026.pdf",
            },
            {
              number: "03",
              report: 'GCN "Hiến máu tình nguyện" ngày 11/05/2026.',
              file: "03_GCN_Hien_mau_11052026.pdf",
            },
            {
              number: "04",
              report: 'GCN là Tình nguyện viên chương trình "Tháng 3 biên giới".',
              file: "04_GCN_Thang_3_bien_gioi.pdf",
            },
            {
              number: "05",
              report: "GCN là Tình nguyện viên Giải cờ vua Chaturanga II năm 2026.",
              file: "05_GCN_Chaturanga_II_2026.pdf",
            },
          ].map((item) => (
            <div
              key={item.number}
              style={{
                border: "1px solid #E2E8F0",
                borderRadius: 11,
                padding: 12,
                marginBottom: 9,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 7,
                }}
              >
                <span
                  style={{
                    background: "#DBEAFE",
                    color: "#1D4ED8",
                    borderRadius: 7,
                    padding: "4px 8px",
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  {item.number}
                </span>

                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: DARK,
                  }}
                >
                  Thành tích trong báo cáo
                </span>
              </div>

              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "#475569",
                  marginBottom: 9,
                }}
              >
                {item.report}
              </div>

              <div
                style={{
                  background: "#F0FDF4",
                  borderRadius: 7,
                  padding: "8px 10px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 7,
                }}
              >
                <span>📄</span>

                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#166534",
                    overflowWrap: "anywhere",
                  }}
                >
                  {item.file}
                </span>
              </div>
            </div>
          ))}

          <SubHeading>4. Tải minh chứng lên hệ thống</SubHeading>

          <Step number="1">
            Tại giao diện của tiêu chí đang thực hiện, tìm
            khu vực tải lên minh chứng.
          </Step>

          <Step number="2">
            Chọn tệp minh chứng tương ứng với thành tích
            đã kê khai.
          </Step>

          <Step number="3">
            Kiểm tra lại tệp đã tải lên, bảo đảm đúng nội
            dung và đúng thành tích.
          </Step>

          <Step number="4">
            Đổi tên tệp theo số thứ tự tương ứng với báo cáo
            nếu cần thiết.
          </Step>

          <Step number="5">
            Tiếp tục thực hiện với những minh chứng còn lại
            và các tiêu chí khác.
          </Step>

          <SubHeading>5. Xem trước, chỉnh sửa báo cáo và gắn tiêu chí minh chứng</SubHeading>
          <p style={paragraphStyle}>Khi chọn tệp để tải lên hoặc mở một minh chứng đã tải, hệ thống hiển thị cửa sổ quản lý minh chứng để xem trước và cập nhật thông tin.</p>
          <Step number="1">Xem trước tệp ngay trong cửa sổ minh chứng. Hình ảnh và PDF có thể hiển thị trực tiếp; một số định dạng văn bản được hiển thị nội dung, các định dạng khác có thể tải xuống để xem.</Step>
          <Step number="2">Chỉnh sửa tên hiển thị của tệp nếu cần để dễ nhận biết và đối chiếu với báo cáo.</Step>
          <Step number="3">Nhập hoặc chỉnh sửa nội dung báo cáo thành tích trong phần báo cáo. Hệ thống hỗ trợ nội dung báo cáo được đánh số để đối chiếu.</Step>
          <Step number="4">Chọn các nội dung tiêu chí Sinh viên 5 tốt phù hợp với minh chứng bằng các ô lựa chọn. Cần chọn ít nhất một nội dung tiêu chí phù hợp trước khi lưu.</Step>
          <Step number="5">Kiểm tra tên tệp, nội dung báo cáo và tiêu chí đã chọn, sau đó nhấn <Tag>Lưu thay đổi</Tag> để lưu hoặc hoàn tất thao tác tải tệp mới.</Step>
          <Note type="orange">Với tệp đang chờ tải lên, thao tác lưu mới gửi tệp và thông tin đã khai báo theo quy trình của hệ thống. Với tệp đã tải lên, chỉnh sửa sẽ cập nhật thông tin tệp và các tiêu chí đã liên kết. Nút hủy trong cửa sổ tệp chờ dùng để đóng/bỏ thao tác tải đang thực hiện.</Note>

          <Note type="orange" title="Đặc biệt quan trọng">
            Số thứ tự trên báo cáo và số thứ tự trên tên
            tệp minh chứng phải tương ứng với nhau. Ví dụ:
            thành tích số 01 phải có minh chứng số 01;
            thành tích số 02 phải có minh chứng số 02.
            Việc thống nhất này giúp cán bộ thuận tiện
            trong quá trình kiểm tra hồ sơ.
          </Note>
        </>
      ),
    },

    // =====================================================
    // 07. KIỂM TRA BÁO CÁO
    // =====================================================
    {
      id: "check",
      number: "07",
      icon: "🔍",
      title: "Kiểm tra và hoàn thiện báo cáo",
      subtitle: "Rà soát toàn bộ hồ sơ trước khi gửi",
      content: (
        <>
          <p style={paragraphStyle}>
            Sau khi hoàn thiện nội dung báo cáo và tải lên
            minh chứng của tất cả các tiêu chí, sinh viên
            cần kiểm tra lại toàn bộ hồ sơ trước khi gửi.
          </p>

          <SubHeading>1. Truy cập mục kiểm tra báo cáo</SubHeading>

          <Step number="1">
            Quay lại giao diện quản lý hồ sơ.
          </Step>

          <Step number="2">
            Chọn chức năng <Tag>Kiểm tra báo cáo</Tag> hoặc
            khu vực xem báo cáo tương ứng trên giao diện.
          </Step>

          <Step number="3">
            Xem lại toàn bộ nội dung báo cáo đã kê khai
            theo từng tiêu chí.
          </Step>

          <SubHeading>2. Các nội dung cần kiểm tra</SubHeading>

          {[
            "Thông tin cá nhân đã được kê khai chính xác.",
            "Các thành tích được ghi đúng tiêu chí.",
            "Nội dung báo cáo đầy đủ, rõ ràng và có đánh số thứ tự.",
            "Các tệp minh chứng đã được tải lên tương ứng.",
            "Tên minh chứng thống nhất với số thứ tự trong báo cáo.",
            "Không bỏ sót thành tích hoặc minh chứng cần thiết.",
          ].map((item, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                gap: 9,
                alignItems: "flex-start",
                margin: "10px 0",
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  minWidth: 20,
                  borderRadius: 6,
                  background: "#DCFCE7",
                  color: "#15803D",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                ✓
              </span>

              <span
                style={{
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "#475569",
                }}
              >
                {item}
              </span>
            </div>
          ))}

          <SubHeading>3. Tải ảnh chân dung 3x4</SubHeading>

          <div
            style={{
              display: "flex",
              gap: 12,
              background: "#FFF7ED",
              border: "1px solid #FED7AA",
              borderRadius: 12,
              padding: 14,
              margin: "12px 0",
            }}
          >
            <div style={{ fontSize: 27 }}>🖼️</div>

            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#9A3412",
                  marginBottom: 5,
                }}
              >
                Yêu cầu bắt buộc
              </div>

              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "#9A3412",
                }}
              >
                Sinh viên phải tải ảnh chân dung 3x4 lên
                hệ thống tại mục kiểm tra báo cáo. Đây là
                nội dung bắt buộc trong quá trình hoàn thiện
                hồ sơ.
              </div>
            </div>
          </div>

          <Step number="1">
            Tại giao diện kiểm tra báo cáo, tìm khu vực
            tải ảnh chân dung.
          </Step>

          <Step number="2">
            Chọn ảnh chân dung 3x4 của bản thân.
          </Step>

          <Step number="3">
            Kiểm tra ảnh đã được tải lên và hiển thị đúng
            trên hệ thống.
          </Step>

          <Note type="orange">
            Không bỏ qua bước tải ảnh 3x4. Đây là nội dung bắt buộc trước khi
            hoàn tất việc gửi hồ sơ.
          </Note>
        </>
      ),
    },

    // =====================================================
    // 08. GỬI HỒ SƠ
    // =====================================================
    {
      id: "submit",
      number: "08",
      icon: "📤",
      title: "Gửi hồ sơ Sinh viên 5 tốt",
      subtitle: "Hoàn tất quy trình gửi báo cáo và minh chứng",
      content: (
        <>
          <SubHeading>1. Điều kiện trước khi gửi hồ sơ</SubHeading>

          <p style={paragraphStyle}>
            Sinh viên chỉ nên thực hiện gửi hồ sơ sau khi
            đã hoàn thiện báo cáo và minh chứng của các
            tiêu chí, đồng thời kiểm tra lại toàn bộ nội
            dung đã kê khai.
          </p>

          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              padding: 14,
              margin: "12px 0",
            }}
          >
            {[
              "Hoàn thành báo cáo các tiêu chí.",
              "Đã lưu nội dung báo cáo.",
              "Đã tải lên minh chứng tương ứng.",
              "Đã kiểm tra lại toàn bộ hồ sơ.",
              "Đã tải ảnh chân dung 3x4.",
            ].map((item, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  gap: 9,
                  alignItems: "center",
                  margin: "9px 0",
                }}
              >
                <span style={{ color: "#16A34A" }}>✓</span>

                <span
                  style={{
                    fontSize: 14,
                    color: "#475569",
                    lineHeight: 1.6,
                  }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>

          <SubHeading>2. Các bước gửi hồ sơ</SubHeading>

          <Step number="1">
            Truy cập lại giao diện <Tag>Hồ sơ Sinh viên 5 tốt</Tag>.
          </Step>

          <Step number="2">
            Kiểm tra lần cuối báo cáo và các tệp minh chứng
            đã được tải lên.
          </Step>

          <Step number="3">
            Tìm và nhấn nút <Tag>Gửi hồ sơ</Tag> để thực
            hiện gửi hồ sơ.
          </Step>

          <Step number="4">
            Thực hiện xác nhận theo yêu cầu hiển thị trên
            hệ thống nếu có.
          </Step>

          <Step number="5">
            Kiểm tra lại giao diện để xác nhận thao tác
            gửi hồ sơ đã được thực hiện.
          </Step>

          <SubHeading>3. Chỉnh sửa hồ sơ sau khi gửi</SubHeading>

          <p style={paragraphStyle}>
            Theo hướng dẫn sử dụng, sinh viên vẫn có thể
            chỉnh sửa hồ sơ bằng cách nhấn lại nút gửi hồ
            sơ thêm một lần nữa.
          </p>

          <div
            style={{
              background: "#EFF6FF",
              border: "1px solid #BFDBFE",
              borderRadius: 12,
              padding: 14,
              margin: "12px 0",
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "#1D4ED8",
                marginBottom: 6,
              }}
            >
              Cần chỉnh sửa hồ sơ?
            </div>

            <div
              style={{
                fontSize: 14,
                color: "#1E40AF",
                lineHeight: 1.75,
              }}
            >
              Sinh viên có thể nhấn lại nút Gửi hồ sơ
              một lần nữa để mở lại khả năng chỉnh sửa
              theo cơ chế của hệ thống, sau đó cập nhật
              nội dung cần thiết và thực hiện gửi lại.
            </div>
          </div>

          <Note type="orange" title="Lưu ý khi gửi hồ sơ">
            Trước khi gửi, hãy bảo đảm báo cáo và minh
            chứng đã được hoàn thiện. Không nên gửi hồ sơ
            khi còn thiếu thông tin hoặc chưa tải đầy đủ
            các minh chứng cần thiết. Sinh viên cần chú ý
            thời hạn tiếp nhận hồ sơ được thông báo trong
            từng đợt xét.
          </Note>
        </>
      ),
    },

    // =====================================================
    // 09. THÔNG BÁO
    // =====================================================
    {
      id: "notification",
      number: "09",
      icon: "🔔",
      title: "Cài đặt và nhận thông báo trên điện thoại",
      subtitle: "Theo dõi thông tin mới và hoạt động sắp diễn ra",
      content: (
        <>
          <p style={paragraphStyle}>
            Đối với sinh viên đã cài đặt hệ thống dưới dạng
            ứng dụng trên điện thoại, chức năng thông báo
            giúp cập nhật thông tin mới mà không cần thường
            xuyên mở trình duyệt để kiểm tra.
          </p>

          <SubHeading>1. Các loại thông báo</SubHeading>

          <div
            style={{
              display: "flex",
              gap: 11,
              padding: "12px 0",
              borderBottom: "1px solid #F1F5F9",
            }}
          >
            <span style={{ fontSize: 23 }}>📋</span>

            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: DARK,
                  marginBottom: 4,
                }}
              >
                Thông báo liên quan đến hồ sơ
              </div>

              <div
                style={{
                  fontSize: 14,
                  color: GRAY,
                  lineHeight: 1.7,
                }}
              >
                Thông tin chung về đánh giá hồ sơ, gia hạn
                hồ sơ, kết quả và thời hạn hoàn thành hồ sơ
                Sinh viên 5 tốt.
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 11,
              padding: "12px 0",
            }}
          >
            <span style={{ fontSize: 23 }}>📅</span>

            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: DARK,
                  marginBottom: 4,
                }}
              >
                Thông báo về hoạt động
              </div>

              <div
                style={{
                  fontSize: 14,
                  color: GRAY,
                  lineHeight: 1.7,
                }}
              >
                Thông tin về các hoạt động sắp diễn ra
                để sinh viên kịp thời nắm bắt và tham gia.
              </div>
            </div>
          </div>

          <SubHeading>2. Bật thông báo trong hệ thống</SubHeading>

          <Step number="1">
            Mở ứng dụng đã cài đặt trên điện thoại.
          </Step>

          <Step number="2">
            Mở <Tag>Menu</Tag> trên giao diện ứng dụng.
          </Step>

          <Step number="3">
            Tìm mục <Tag>Thông báo</Tag>.
          </Step>

          <Step number="4">
            Kiểm tra trạng thái thông báo hiện tại.
          </Step>

          <Step number="5">
            Nếu thông báo đang tắt, nhấn vào nút trạng thái
            để bật thông báo.
          </Step>

          <Step number="6">
            Khi thiết bị hiển thị yêu cầu cấp quyền, chọn
            cho phép ứng dụng gửi thông báo.
          </Step>

          <SubHeading>3. Trường hợp thông báo chưa hoạt động</SubHeading>

          <p style={paragraphStyle}>
            Trạng thái thông báo
            ban đầu có thể khác nhau giữa các lần cài đặt:
          </p>

          <div
            style={{
              border: "1px solid #E2E8F0",
              borderRadius: 11,
              padding: 13,
              margin: "10px 0",
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: DARK,
                marginBottom: 6,
              }}
            >
              Trường hợp 1: Thông báo mặc định đang tắt
            </div>

            <p style={{ ...paragraphStyle, margin: 0 }}>
              Nhấn vào trạng thái thông báo để bật, sau đó
              cho phép ứng dụng gửi thông báo trên thiết bị.
            </p>
          </div>

          <div
            style={{
              border: "1px solid #E2E8F0",
              borderRadius: 11,
              padding: 13,
              margin: "10px 0",
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: DARK,
                marginBottom: 6,
              }}
            >
              Trường hợp 2: Thông báo mặc định đang bật
            </div>

            <p style={{ ...paragraphStyle, margin: 0 }}>
              Nếu thông báo đã ở trạng thái bật nhưng
              chưa hoạt động như mong muốn, thực hiện
              tắt thông báo rồi bật lại theo hướng dẫn
              trong tài liệu.
            </p>
          </div>

          <Note type="orange">
            Ngoài trạng thái trong hệ thống, sinh viên
            cần kiểm tra quyền thông báo của ứng dụng
            trong phần cài đặt thiết bị. Nếu đã bật
            thông báo trong hệ thống nhưng điện thoại
            vẫn không hiển thị, hãy kiểm tra lại quyền
            thông báo trên thiết bị.
          </Note>

          <Note type="green" title="Hoàn tất">
            Khi chức năng thông báo được bật và thiết bị
            đã cấp quyền phù hợp, sinh viên có thể nhận
            thông báo trực tiếp trên điện thoại khi có
            thông tin mới từ hệ thống.
          </Note>
        </>
      ),
    },

    // =====================================================
    // 10. BẢNG ĐIỂM
    // =====================================================
    {
      id: "bangdiem",
      number: "10",
      icon: "📊",
      title: "Sử dụng chức năng Bảng điểm",
      subtitle: "Theo dõi điểm học tập và tính điểm các học phần",
      content: (
        <>
          <SubHeading>1. Truy cập và chọn năm học</SubHeading>
          <Step number="1">Tại giao diện hệ thống, mở chức năng <Tag>Bảng điểm</Tag>.</Step>
          <Step number="2">Chọn năm học muốn theo dõi tại khu vực lựa chọn năm học.</Step>
          <Step number="3">Theo dõi phần tổng quan để xem số tín chỉ và điểm trung bình GPA10, GPA4 được hệ thống tổng hợp.</Step>
          <SubHeading>2. Theo dõi từng học kỳ</SubHeading>
          <p style={paragraphStyle}>Bảng điểm được chia theo học kỳ 1, học kỳ 2 và học kỳ hè (nếu có). Chọn hoặc xem khu vực học kỳ tương ứng để theo dõi các học phần.</p>
          <SubHeading>3. Thêm học phần và nhập điểm</SubHeading>
          <Step number="1">Tại học kỳ cần cập nhật, chọn chức năng thêm môn học.</Step>
          <Step number="2">Nhập tên học phần, số tín chỉ và loại học phần theo lựa chọn hiển thị (LT, TH, LTTH hoặc LS nếu được hỗ trợ).</Step>
          <Step number="3">Nhập các thành phần điểm và tỷ trọng tương ứng theo đề cương môn học.</Step>
          <Step number="4">Kiểm tra dữ liệu đã nhập. Hệ thống sử dụng thông tin này để tính điểm học phần và điểm trung bình học kỳ.</Step>
          <SubHeading>4. Tính điểm mục tiêu</SubHeading>
          <p style={paragraphStyle}>Nếu muốn xác định điểm thi cần đạt để đạt mức điểm chữ mong muốn, sử dụng chức năng điểm mục tiêu trong phần học phần, chọn mức điểm chữ và xem kết quả tính toán.</p>
          <SubHeading>5. Cập nhật điểm thi và xem kết quả</SubHeading>
          <Step number="1">Nhập điểm thi thực tế khi đã có kết quả.</Step>
          <Step number="2">Xem điểm tổng kết và điểm chữ được tính theo các thành phần đã khai báo.</Step>
          <Step number="3">Theo dõi GPA học kỳ và tổng hợp năm học.</Step>
          <Note type="orange">Bảng điểm là công cụ hỗ trợ theo dõi và tính toán. Hãy kiểm tra lại số tín chỉ, tỷ trọng và điểm thành phần đã nhập để tránh sai lệch.</Note>
        </>
      ),
    },
    // =====================================================
    // 11. HOẠT ĐỘNG
    // =====================================================
    {
      id: "activities",
      number: "11",
      icon: "📅",
      title: "Theo dõi hoạt động",
      subtitle: "Tìm kiếm, lọc và xem thông tin các hoạt động",
      content: (
        <>
          <SubHeading>1. Mở chức năng Hoạt động</SubHeading>
          <Step number="1">Chọn mục <Tag>Hoạt động</Tag> trên hệ thống.</Step>
          <Step number="2">Theo dõi phần tổng quan số lượng hoạt động, hoạt động đang diễn ra, sắp diễn ra và đã kết thúc.</Step>
          <SubHeading>2. Lọc hoạt động</SubHeading>
          <p style={paragraphStyle}>Sử dụng bộ lọc tiêu chí hoặc trạng thái để tìm hoạt động phù hợp. Có thể thay đổi bộ lọc để xem danh sách theo nhu cầu.</p>
          <SubHeading>3. Xem danh sách và thông tin chi tiết</SubHeading>
          <Step number="1">Chọn hoạt động trong danh sách để mở phần chi tiết.</Step>
          <Step number="2">Theo dõi đơn vị tổ chức, thời gian, hạn đăng ký hoặc hạn liên quan, mô tả và thông tin bổ sung.</Step>
          <Step number="3">Mở đường dẫn được cung cấp nếu hoạt động có liên kết đăng ký hoặc thông tin bên ngoài.</Step>
          <SubHeading>4. Xem tài liệu đính kèm</SubHeading>
          <Step number="1">Trong phần chi tiết hoạt động, chọn tài liệu cần xem.</Step>
          <Step number="2">Sử dụng cửa sổ xem trước để đọc tài liệu; chuyển tài liệu nếu có nhiều tệp.</Step>
          <Step number="3">Tải tài liệu xuống thiết bị nếu cần lưu hoặc xem ngoại tuyến.</Step>
          <Note>Chú ý thời gian và hạn đăng ký được thông tin trong chi tiết hoạt động. Hệ thống hỗ trợ theo dõi thông tin; sinh viên cần thực hiện đăng ký theo hướng dẫn của từng chương trình.</Note>
        </>
      ),
    },
    // =====================================================
    // 12. CÀI ĐẶT
    // =====================================================
    {
      id: "settings",
      number: "12",
      icon: "⚙️",
      title: "Cài đặt tài khoản",
      subtitle: "Cập nhật thông tin, thông báo và mật khẩu",
      content: (
        <>
          <SubHeading>1. Truy cập Cài đặt</SubHeading>
          <Step number="1">Mở menu hệ thống và chọn <Tag>Cài đặt</Tag>.</Step>
          <Step number="2">Mở từng khu vực cài đặt để xem hoặc cập nhật nội dung.</Step>
          <SubHeading>2. Cập nhật thông tin cá nhân</SubHeading>
          <Step number="1">Mở phần thông tin cá nhân và chỉnh sửa các trường được phép thay đổi, như họ tên, lớp, giới tính, năm sinh, dân tộc hoặc chức vụ Đoàn - Hội.</Step>
          <Step number="2">MSSV và email được hiển thị để đối chiếu và không chỉnh sửa trực tiếp tại đây.</Step>
          <Step number="3">Kiểm tra thông tin rồi chọn lưu để cập nhật.</Step>
          <SubHeading>3. Bật hoặc tắt thông báo</SubHeading>
          <p style={paragraphStyle}>Tại phần cài đặt thông báo, sử dụng công tắc để bật hoặc tắt nhận thông báo. Nếu bật, hãy đảm bảo thiết bị cũng đã cấp quyền nhận thông báo.</p>
          <SubHeading>4. Đổi mật khẩu</SubHeading>
          <Step number="1">Mở phần đổi mật khẩu.</Step>
          <Step number="2">Nhập mật khẩu mới và nhập lại để xác nhận.</Step>
          <Step number="3">Mật khẩu mới cần đáp ứng yêu cầu tối thiểu hiển thị trên hệ thống (ít nhất 6 ký tự), sau đó thực hiện đổi mật khẩu.</Step>
          <SubHeading>5. Mở hướng dẫn sử dụng</SubHeading>
          <p style={paragraphStyle}>Tại Cài đặt, có thể truy cập liên kết Hướng dẫn để xem lại cách sử dụng các chức năng của hệ thống.</p>
          <Note type="orange">Không chia sẻ mật khẩu cho người khác. Sau khi cập nhật thông tin hoặc mật khẩu, hãy kiểm tra thông báo kết quả trên màn hình.</Note>
        </>
      ),
    },
  ];


  const activeIndex = sections.findIndex(
    (section) => section.id === activeSection
  );

  const currentSection = sections[activeIndex] || sections[0];

  const goToSection = (id: string) => {
    setActiveSection(id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const goPrevious = () => {
    if (activeIndex > 0) {
      goToSection(sections[activeIndex - 1].id);
    }
  };

  const goNext = () => {
    if (activeIndex < sections.length - 1) {
      goToSection(sections[activeIndex + 1].id);
    }
  };

  return (
    <div className="guide-page">
      <Header
        tab="guide"
        setTab={() => {}}
        openCriteria={() => {}}
        openProfile={() => {}}
      />

      <main className="guide-main">
        <div className="guide-container">

          {/* HEADER */}

          <div className="guide-heading">
            
            <h1>
              <span> HƯỚNG DẪN SỬ DỤNG HỆ THỐNG HỖ TRỢ SV5T BMU</span>
            </h1>

          </div>

          {/* LAYOUT CHÍNH */}

          <div className="guide-layout">

            {/* SIDEBAR DESKTOP */}

            <aside className="guide-sidebar">

              <a href="/" className="guide-home">
                <span className="guide-home-icon">⌂</span>
                <span>Về trang chủ</span>
                <span className="guide-home-arrow">→</span>
              </a>

              <div className="guide-sidebar-heading">
                <div>
                  <div className="guide-sidebar-title">
                    Nội dung hướng dẫn
                  </div>
                  <div className="guide-sidebar-subtitle">
                    Chọn một chuyên mục để xem
                  </div>
                </div>

                <span className="guide-count">
                  {sections.length}
                </span>
              </div>

              <nav className="guide-nav">
                {sections.map((section, index) => {
                  const isActive = activeSection === section.id;

                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => goToSection(section.id)}
                      className={`guide-nav-item ${
                        isActive ? "active" : ""
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span className="guide-nav-number">
                        {section.number}
                      </span>

                      <span className="guide-nav-icon">
                        {section.icon}
                      </span>

                      <span className="guide-nav-text">
                        <span className="guide-nav-name">
                          {section.title}
                        </span>

                        <span className="guide-nav-description">
                          {section.subtitle}
                        </span>
                      </span>

                      <span className="guide-nav-arrow">
                        {isActive ? "●" : "›"}
                      </span>
                    </button>
                  );
                })}
              </nav>

              <div className="guide-sidebar-help">
                <div className="guide-help-title">
                 💬 Cần hỗ trợ?
                </div>
                <p>
                  Liên hệ Câu lạc bộ Sinh viên 5 tốt BMU.
                </p>
                <a href="/trao-doi">
                  Nhắn tin hỗ trợ →
                </a>
              </div>
            </aside>

            {/* KHU VỰC NỘI DUNG */}

            <section className="guide-content-area">

              {/* MOBILE HOME */}

              <div className="guide-mobile-top">
                <a href="/" className="guide-mobile-home">
                  <span>←</span>
                  Trang chủ
                </a>

                <span className="guide-mobile-count">
                  {String(activeIndex + 1).padStart(2, "0")}
                  {" / "}
                  {String(sections.length).padStart(2, "0")}
                </span>
              </div>

              {/* MOBILE SECTION SELECTOR */}

              <div className="guide-mobile-selector">
                <div className="guide-mobile-selector-heading">
                  <span>CHỌN NỘI DUNG</span>
                  <span>
                    Vuốt ngang để xem thêm <span>→</span>
                  </span>
                </div>

                <div className="guide-mobile-nav">
                  {sections.map((section) => {
                    const isActive = activeSection === section.id;

                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => goToSection(section.id)}
                        className={`guide-mobile-nav-item ${
                          isActive ? "active" : ""
                        }`}
                      >
                        <span>{section.icon}</span>
                        <span>{section.number}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="guide-mobile-active-name">
                  <span>{currentSection.icon}</span>
                  <span>{currentSection.title}</span>
                </div>
              </div>

              {/* LƯU Ý QUAN TRỌNG */}

<div className="guide-reminder">
  <button
    type="button"
    className="guide-reminder-toggle"
    onClick={() => setShowReminder((prev) => !prev)}
  >
    <span>⚠️ Những điều cần lưu ý</span>
    <span className={`guide-reminder-arrow ${showReminder ? "open" : ""}`}>
      ▼
    </span>
  </button>

  <div
    className={`guide-reminder-content ${
      showReminder ? "show" : ""
    }`}
  >
    <div className="guide-reminder-grid">
      {[
        "Sử dụng tài khoản cá nhân để kê khai và quản lý hồ sơ.",
        "Ghi thành tích theo đúng tiêu chí và đánh số thứ tự rõ ràng.",
        "Tên minh chứng phải tương ứng với số thứ tự trong báo cáo.",
        "Bắt buộc tải ảnh chân dung 3x4 tại mục kiểm tra báo cáo.",
        "Kiểm tra kỹ toàn bộ hồ sơ trước khi thực hiện gửi.",
      ].map((item, index) => (
        <div key={index} className="guide-reminder-item">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <p>{item}</p>
        </div>
      ))}
    </div>
  </div>
</div>

              {/* THẺ NỘI DUNG */}

              <article className="guide-article" key={currentSection.id}>

                <div className="guide-article-header">
                  <div className="guide-article-label">
                    <span>PHẦN {currentSection.number}</span>
                    <span className="guide-article-label-dot">•</span>
                    <span>HƯỚNG DẪN SỬ DỤNG</span>
                  </div>

                  <div className="guide-article-title-row">
                    <div className="guide-article-icon">
                      {currentSection.icon}
                    </div>

                    <div className="guide-article-heading">
                      <h2>{currentSection.title}</h2>
                      <p>{currentSection.subtitle}</p>
                    </div>
                  </div>

                  <div className="guide-progress">
                    <div className="guide-progress-info">
                      <span>TIẾN TRÌNH HƯỚNG DẪN</span>
                      <strong>
                        {activeIndex + 1}/{sections.length}
                      </strong>
                    </div>

                    <div className="guide-progress-track">
                      <div
                        className="guide-progress-fill"
                        style={{
                          width: `${
                            ((activeIndex + 1) / sections.length) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="guide-article-body">
                  {currentSection.content}
                </div>

                {/* ĐIỀU HƯỚNG TRƯỚC / SAU */}

                <div className="guide-article-footer">

                  <button
                    type="button"
                    onClick={goPrevious}
                    disabled={activeIndex === 0}
                    className="guide-prev-button"
                  >
                    <span>←</span>
                    <span>
                      <small>QUAY LẠI</small>
                      <strong>
                        {activeIndex > 0
                          ? sections[activeIndex - 1].title
                          : "Bắt đầu"}
                      </strong>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={goNext}
                    disabled={activeIndex === sections.length - 1}
                    className="guide-next-button"
                  >
                    <span>
                      <small>
                        {activeIndex === sections.length - 1
                          ? "ĐÃ HOÀN TẤT"
                          : "TIẾP THEO"}
                      </small>
                      <strong>
                        {activeIndex < sections.length - 1
                          ? sections[activeIndex + 1].title
                          : "Hoàn tất"}
                      </strong>
                    </span>
                    <span>→</span>
                  </button>

                </div>
              </article>
            </section>
          </div>
        </div>
      </main>

      <Footer />

      {/* CSS RESPONSIVE */}

      <style jsx>{`
        .guide-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f5f7fb;
          color: #0f172a;
        }

        .guide-main {
          flex: 1;
          padding: 34px clamp(24px, 3vw, 56px) 65px;
          background-image:
            linear-gradient(
              rgba(245, 247, 251, 0.96),
              rgba(245, 247, 251, 0.98)
            ),
            url("/gioithieu.avif");
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
        }

        .guide-container {
          width: 100%;
          max-width: 1800px;
          margin: 0 auto;
        }

        .guide-heading {
          text-align: center;
          max-width: 850px;
          margin: 0 auto 30px;
        }

        .guide-eyebrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 7px 13px;
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          border-radius: 30px;
          color: #1d4ed8;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 1.1px;
          margin-bottom: 12px;
        }

        .guide-heading h1 {
          margin: 0;
          color: #1e3a8a;
          font-size: clamp(23px, 3vw, 31px);
          font-weight: 950;
          line-height: 1.4;
          letter-spacing: -0.5px;
        }

        .guide-heading h1 span {
          color: #2563eb;
        }

        .guide-heading p {
          max-width: 650px;
          margin: 10px auto 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.8;
        }

        .guide-layout {
          display: grid;
          grid-template-columns: minmax(270px, 22vw) minmax(0, 1fr);
          align-items: start;
          gap: clamp(22px, 2vw, 36px);
        }

        /* SIDEBAR */

        .guide-sidebar {
          position: sticky;
          top: 20px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 15px;
          box-shadow: 0 5px 22px rgba(15, 23, 42, 0.045);
        }

        .guide-home {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 44px;
          padding: 0 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 11px;
          color: #334155;
          text-decoration: none;
          font-size: 14px;
          font-weight: 800;
          transition: 0.2s ease;
        }

        .guide-home:hover {
          color: #1d4ed8;
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        .guide-home-icon {
          font-size: 19px;
          line-height: 1;
        }

        .guide-home-arrow {
          margin-left: auto;
          font-size: 16px;
        }

        .guide-sidebar-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 22px 3px 13px;
        }

        .guide-sidebar-title {
          color: #0f172a;
          font-size: 14px;
          font-weight: 900;
        }

        .guide-sidebar-subtitle {
          color: #94a3b8;
          font-size: 14px;
          margin-top: 4px;
        }

        .guide-count {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 9px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 14px;
          font-weight: 900;
        }

        .guide-nav {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .guide-nav-item {
          width: 100%;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px 8px;
          border: 1px solid transparent;
          border-radius: 11px;
          background: transparent;
          text-align: left;
          cursor: pointer;
          transition:
            background 0.18s ease,
            border-color 0.18s ease,
            transform 0.18s ease;
        }

        .guide-nav-item:hover {
          background: #f8fafc;
          border-color: #e2e8f0;
        }

        .guide-nav-item.active {
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        .guide-nav-number {
          width: 23px;
          min-width: 23px;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 900;
          text-align: center;
        }

        .guide-nav-item.active .guide-nav-number {
          color: #2563eb;
        }

        .guide-nav-icon {
          width: 31px;
          min-width: 31px;
          height: 31px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f9;
          border-radius: 9px;
          font-size: 16px;
        }

        .guide-nav-item.active .guide-nav-icon {
          background: #dbeafe;
        }

        .guide-nav-text {
          min-width: 0;
          flex: 1;
        }

        .guide-nav-name {
          display: block;
          color: #334155;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.45;
        }

        .guide-nav-item.active .guide-nav-name {
          color: #1d4ed8;
        }

        .guide-nav-description {
          display: block;
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.45;
          margin-top: 3px;
        }

        .guide-nav-arrow {
          color: #2563eb;
          font-size: 14px;
          flex-shrink: 0;
        }

        .guide-sidebar-help {
          margin-top: 18px;
          padding: 14px;
          border-radius: 12px;
          background: linear-gradient(135deg, #fff7ed, #ffedd5);
          border: 1px solid #fed7aa;
        }

        .guide-help-icon {
          font-size: 21px;
          margin-bottom: 5px;
        }

        .guide-help-title {
          color: #9a3412;
          font-size: 14px;
          font-weight: 900;
        }

        .guide-sidebar-help p {
          margin: 5px 0 9px;
          color: #c2410c;
          font-size: 14px;
          line-height: 1.65;
        }

        .guide-sidebar-help a {
          display: inline-flex;
          color: #c2410c;
          font-size: 14px;
          font-weight: 900;
          text-decoration: none;
        }

        /* CONTENT */

        .guide-content-area {
          min-width: 0;
        }

        .guide-mobile-top,
        .guide-mobile-selector {
          display: none;
        }

        .guide-reminder {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          padding: 17px;
          margin-bottom: 16px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 15px;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.025);
        }

        .guide-reminder-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 35px;
          min-width: 35px;
          height: 35px;
          border-radius: 10px;
          background: #fff7ed;
          font-size: 18px;
        }

        .guide-reminder-content {
          flex: 1;
          min-width: 0;
        }

        .guide-reminder-title {
          margin-bottom: 10px;
          color: #0f172a;
          font-size: 14px;
          font-weight: 900;
        }

        .guide-reminder-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 9px 15px;
        }

        .guide-reminder-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .guide-reminder-item > span {
          color: #2563eb;
          font-size: 14px;
          font-weight: 900;
          padding-top: 2px;
        }

        .guide-reminder-item p {
          margin: 0;
          color: #475569;
          font-size: 14px;
          line-height: 1.65;
        }

        /* ARTICLE */

        .guide-article {
          overflow: hidden;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 17px;
          box-shadow: 0 5px 22px rgba(15, 23, 42, 0.04);
          animation: guideFade 0.25s ease;
        }

        @keyframes guideFade {
          from {
            opacity: 0;
            transform: translateY(7px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .guide-article-header {
          padding: 22px 25px 17px;
          background: linear-gradient(135deg, #fff, #f8fbff);
          border-bottom: 1px solid #e2e8f0;
        }

        .guide-article-label {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #2563eb;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 0.8px;
        }

        .guide-article-label-dot {
          color: #94a3b8;
        }

        .guide-article-title-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 14px;
        }

        .guide-article-icon {
          width: 52px;
          min-width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          background: #eff6ff;
          font-size: 25px;
        }

        .guide-article-heading {
          min-width: 0;
        }

        .guide-article-heading h2 {
          margin: 0;
          color: #0f172a;
          font-size: clamp(17px, 2vw, 21px);
          font-weight: 900;
          line-height: 1.45;
        }

        .guide-article-heading p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .guide-progress {
          margin-top: 19px;
        }

        .guide-progress-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 7px;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.4px;
        }

        .guide-progress-info strong {
          color: #2563eb;
          font-size: 14px;
        }

        .guide-progress-track {
          height: 5px;
          overflow: hidden;
          background: #e2e8f0;
          border-radius: 10px;
        }

        .guide-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #2563eb);
          border-radius: 10px;
          transition: width 0.25s ease;
        }

        .guide-article-body {
          padding: 20px 25px 25px;
          min-width: 0;
        }

        .guide-article-footer {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 15px 20px;
          border-top: 1px solid #e2e8f0;
          background: #fbfdff;
        }

        .guide-prev-button,
        .guide-next-button {
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: 48%;
          min-width: 0;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #fff;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .guide-prev-button:hover:not(:disabled),
        .guide-next-button:hover:not(:disabled) {
          border-color: #93c5fd;
          background: #eff6ff;
        }

        .guide-prev-button:disabled,
        .guide-next-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .guide-prev-button > span:first-child,
        .guide-next-button > span:last-child {
          color: #2563eb;
          font-size: 18px;
          flex-shrink: 0;
        }

        .guide-prev-button > span:last-child,
        .guide-next-button > span:first-child {
          display: flex;
          flex-direction: column;
          min-width: 0;
          text-align: left;
        }

        .guide-next-button > span:first-child {
          text-align: right;
        }

        .guide-prev-button small,
        .guide-next-button small {
          color: #94a3b8;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 0.5px;
        }

        .guide-prev-button strong,
        .guide-next-button strong {
          overflow: hidden;
          max-width: 190px;
          margin-top: 3px;
          color: #334155;
          font-size: 14px;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* BOTTOM HELP */

        .guide-bottom-help {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 16px;
          padding: 17px;
          background: linear-gradient(135deg, #fff7ed, #ffedd5);
          border: 1px solid #fed7aa;
          border-radius: 15px;
        }

        .guide-bottom-help-icon {
          font-size: 25px;
          flex-shrink: 0;
        }

        .guide-bottom-help-content {
          flex: 1;
          min-width: 0;
        }

        .guide-bottom-help-content strong {
          color: #9a3412;
          font-size: 14px;
          font-weight: 900;
        }

        .guide-bottom-help-content p {
          margin: 5px 0 0;
          color: #c2410c;
          font-size: 14px;
          line-height: 1.65;
        }

        .guide-bottom-help > a {
          flex-shrink: 0;
          padding: 10px 13px;
          border-radius: 9px;
          background: #f97316;
          color: #fff;
          text-decoration: none;
          font-size: 14px;
          font-weight: 900;
          transition: 0.2s ease;
        }

        .guide-bottom-help > a:hover {
          background: #ea580c;
          transform: translateY(-1px);
        }

        .guide-document-footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          padding: 22px 10px 5px;
          text-align: center;
        }

        .guide-document-footer strong {
          color: #64748b;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 0.4px;
        }

        .guide-document-footer span {
          color: #94a3b8;
          font-size: 14px;
        }

        /* TABLET */

        @media (max-width: 950px) {
          .guide-layout {
            grid-template-columns: 245px minmax(0, 1fr);
            gap: 15px;
          }

          .guide-sidebar {
            padding: 12px;
          }

          .guide-nav-description {
            display: none;
          }

          .guide-reminder-grid {
            grid-template-columns: 1fr;
          }
        }

        /* MOBILE */

        @media (max-width: 700px) {
          .guide-main {
            padding: 20px 12px 40px;
            background-attachment: scroll;
          }

          .guide-container {
            max-width: 100%;
          }

          .guide-heading {
            margin-bottom: 18px;
            padding: 0 4px;
          }

          .guide-eyebrow {
            margin-bottom: 9px;
            padding: 6px 10px;
            font-size: 14px;
          }

          .guide-heading h1 {
            font-size: 21px;
            line-height: 1.45;
          }

          .guide-heading p {
            margin-top: 7px;
            font-size: 14px;
          }

          .guide-layout {
            display: flex;
            flex-direction: column;
            gap: 0;
          }

          .guide-sidebar {
            display: none;
          }

          .guide-content-area {
            width: 100%;
          }

          .guide-mobile-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 11px;
          }

          .guide-mobile-home {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            color: #475569;
            text-decoration: none;
            font-size: 14px;
            font-weight: 800;
          }

          .guide-mobile-home span {
            color: #2563eb;
            font-size: 17px;
          }

          .guide-mobile-count {
            padding: 6px 10px;
            border-radius: 8px;
            background: #eff6ff;
            color: #1d4ed8;
            font-size: 14px;
            font-weight: 900;
          }

          .guide-mobile-selector {
            display: block;
            overflow: hidden;
            margin-bottom: 12px;
            padding: 12px;
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 13px;
            box-shadow: 0 2px 9px rgba(15, 23, 42, 0.025);
          }

          .guide-mobile-selector-heading {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 10px;
            color: #64748b;
            font-size: 14px;
            font-weight: 900;
            letter-spacing: 0.4px;
          }

          .guide-mobile-selector-heading > span:last-child {
            color: #94a3b8;
            font-weight: 600;
            letter-spacing: 0;
          }

          .guide-mobile-selector-heading > span:last-child span {
            color: #2563eb;
          }

          .guide-mobile-nav {
            display: flex;
            gap: 7px;
            overflow-x: auto;
            padding: 1px 1px 7px;
            scrollbar-width: thin;
            scrollbar-color: #bfdbfe transparent;
            -webkit-overflow-scrolling: touch;
          }

          .guide-mobile-nav::-webkit-scrollbar {
            height: 3px;
          }

          .guide-mobile-nav::-webkit-scrollbar-thumb {
            background: #bfdbfe;
            border-radius: 10px;
          }

          .guide-mobile-nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            flex: 0 0 48px;
            height: 49px;
            padding: 4px;
            border: 1px solid #e2e8f0;
            border-radius: 9px;
            background: #f8fafc;
            color: #64748b;
            cursor: pointer;
            transition: 0.18s ease;
          }

          .guide-mobile-nav-item > span:first-child {
            font-size: 16px;
            line-height: 1;
          }

          .guide-mobile-nav-item > span:last-child {
            font-size: 14px;
            font-weight: 900;
          }

          .guide-mobile-nav-item.active {
            border-color: #93c5fd;
            background: #eff6ff;
            color: #1d4ed8;
            box-shadow: 0 2px 7px rgba(37, 99, 235, 0.08);
          }

          .guide-mobile-active-name {
            display: flex;
            align-items: center;
            gap: 7px;
            margin-top: 8px;
            padding-top: 9px;
            border-top: 1px solid #f1f5f9;
            color: #1e3a8a;
            font-size: 14px;
            font-weight: 900;
            line-height: 1.5;
          }

          .guide-mobile-active-name span:first-child {
            font-size: 15px;
          }

          .guide-reminder {
            gap: 9px;
            padding: 12px;
            margin-bottom: 12px;
            border-radius: 12px;
          }

          .guide-reminder-icon {
            width: 29px;
            min-width: 29px;
            height: 29px;
            border-radius: 8px;
            font-size: 15px;
          }

          .guide-reminder-title {
            margin-bottom: 8px;
            font-size: 14px;
          }

          .guide-reminder-grid {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .guide-reminder-item {
            gap: 7px;
          }

          .guide-reminder-item > span {
            font-size: 14px;
          }

          .guide-reminder-item p {
            font-size: 14px;
            line-height: 1.55;
          }

          .guide-article {
            border-radius: 13px;
          }

          .guide-article-header {
            padding: 15px 14px 13px;
          }

          .guide-article-label {
            font-size: 14px;
            gap: 5px;
          }

          .guide-article-title-row {
            gap: 10px;
            margin-top: 11px;
          }

          .guide-article-icon {
            width: 41px;
            min-width: 41px;
            height: 41px;
            border-radius: 11px;
            font-size: 20px;
          }

          .guide-article-heading h2 {
            font-size: 15px;
            line-height: 1.4;
          }

          .guide-article-heading p {
            margin-top: 3px;
            font-size: 14px;
          }

          .guide-progress {
            margin-top: 13px;
          }

          .guide-progress-info {
            font-size: 14px;
          }

          .guide-article-body {
            padding: 13px 13px 17px;
            overflow-wrap: anywhere;
          }

          .guide-article-body :global(p) {
            font-size: 12px !important;
            line-height: 1.75 !important;
          }

          .guide-article-body :global(h3) {
            font-size: 13px !important;
            margin-top: 17px !important;
          }

          .guide-article-body :global(ul) {
            padding-left: 18px !important;
          }

          .guide-article-body :global(li) {
            font-size: 14px;
            line-height: 1.7;
          }

          .guide-article-body :global(strong) {
            overflow-wrap: anywhere;
          }

          .guide-article-footer {
            gap: 7px;
            padding: 10px;
          }

          .guide-prev-button,
          .guide-next-button {
            gap: 6px;
            max-width: 49%;
            padding: 9px 8px;
            border-radius: 9px;
          }

          .guide-prev-button > span:first-child,
          .guide-next-button > span:last-child {
            font-size: 15px;
          }

          .guide-prev-button small,
          .guide-next-button small {
            font-size: 14px;
          }

          .guide-prev-button strong,
          .guide-next-button strong {
            max-width: 115px;
            font-size: 14px;
          }

          .guide-bottom-help {
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 9px;
            padding: 13px;
            margin-top: 12px;
            border-radius: 12px;
          }

          .guide-bottom-help-icon {
            font-size: 21px;
          }

          .guide-bottom-help-content {
            flex: 1;
            min-width: calc(100% - 40px);
          }

          .guide-bottom-help-content strong {
            font-size: 14px;
          }

          .guide-bottom-help-content p {
            font-size: 14px;
          }

          .guide-bottom-help > a {
            margin-left: 30px;
            padding: 9px 11px;
            font-size: 14px;
          }

          .guide-document-footer {
            padding-top: 18px;
          }

          .guide-document-footer strong {
            font-size: 14px;
          }

          .guide-document-footer span {
            font-size: 14px;
          }
        }

        @media (max-width: 380px) {
          .guide-main {
            padding-left: 9px;
            padding-right: 9px;
          }

          .guide-heading h1 {
            font-size: 19px;
          }

          .guide-mobile-selector {
            padding: 10px;
          }

          .guide-mobile-nav {
            gap: 5px;
          }

          .guide-mobile-nav-item {
            flex-basis: 44px;
            height: 46px;
          }

          .guide-article-body {
            padding-left: 11px;
            padding-right: 11px;
          }
        }
          .guide-reminder-toggle {
  display: none;
}

.guide-reminder-arrow {
  transition: transform 0.25s ease;
}

.guide-reminder-arrow.open {
  transform: rotate(180deg);
}

@media (max-width: 768px) {
  .guide-reminder {
    display: block;
  }

  .guide-reminder-toggle {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border: none;
    background: transparent;
    padding: 12px 0;
    font-size: 15px;
    font-weight: 700;
    color: inherit;
    cursor: pointer;
    text-align: left;
  }

  .guide-reminder-icon {
    display: none;
  }

  .guide-reminder-title {
    display: none;
  }

  .guide-reminder-content {
    display: none;
  }

  .guide-reminder-content.show {
    display: block;
  }

  .guide-reminder-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 8px;
  }
}
      `}</style>
    </div>
  );
}

