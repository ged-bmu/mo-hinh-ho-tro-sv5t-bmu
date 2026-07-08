import { FaFacebook } from "react-icons/fa";

export default function Footer() {
  return (
    <div
      style={{
        marginTop: "20px",
        borderTop: "1px solid #d1d5db",
        padding: "30px 60px",
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "40px",
        }}
      >
        <div style={{ flex: 1 }}>
          <h3
            style={{
              color: "#0b1772",
              margin: "0 0 12px",
              lineHeight: 1.3,
            }}
          >
            MÔ HÌNH HỖ TRỢ SINH VIÊN PHẤN ĐẤU ĐẠT DANH HIỆU SINH VIÊN 5 TỐT CÁC CẤP
          </h3>

          <p
            style={{
              color: "#6b7280",
              margin: "0 0 16px",
              lineHeight: 1.45,
            }}
          >
            Hệ thống theo dõi hồ sơ Sinh viên 5 tốt thuộc Câu lạc bộ Sinh viên 5
            tốt Trường Đại học Y Dược Buôn Ma Thuột.
          </p>

          <div
            style={{
              lineHeight: 1.45,
              color: "#111827",
            }}
          >
            <p style={{ margin: "4px 0" }}>
              🏛 Câu lạc bộ Sinh viên 5 tốt Trường Đại học Y Dược Buôn Ma Thuột
            </p>

            <p style={{ margin: "4px 0" }}>
              📍 298 Hà Huy Tập, Phường Tân An, Tỉnh Đắk Lắk
            </p>

            <p style={{ margin: "4px 0" }}>
              ✉ hoisinhvien@bmu.edu.vn
            </p>
          </div>
        </div>

        <div style={{ minWidth: 220 }}>
          <h3
            style={{
              color: "#2563eb",
              margin: "0 0 16px",
            }}
          >
            Kết nối với chúng tôi
          </h3>

          <a
            href="https://www.facebook.com/profile.php?id=100093817715642"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
              color: "#111827",
            }}
          >
            <FaFacebook color="#1877F2" size={20} />
            Facebook
          </a>
        </div>
      </div>

      <hr
        style={{
          margin: "22px 0",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          color: "#6b7280",
          fontSize: "15px",
        }}
      >
        <span>
          © 2026 Hệ thống được phát triển bởi Trần Hà Xuân Hiển • Phiên bản 1.0.1
        </span>

        <span>
          Sinh viên lớp 22DA1, Trường Đại học Y Dược Buôn Ma Thuột
        </span>
      </div>
    </div>
  );
}