import { FaFacebook } from "react-icons/fa";
export default function Footer() {
  return (
    <div
      style={{
        marginTop: "50px",
        borderTop: "1px solid #d1d5db",
        padding: "35px 60px",
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3
            style={{
              color: "#0b1772",
              marginBottom: "15px",
            }}
          >
            MÔ HÌNH HỖ TRỢ SINH VIÊN PHẤN ĐẤU ĐẠT DANH HIỆU SINH VIÊN 5 TỐT CÁC CẤP
          </h3>

          <p style={{ color: "#6b7280" }}>
            Hệ thống theo dõi, quản lý và đánh giá hồ sơ 
            Sinh viên 5 tốt Trường Đại học Y Dược Buôn Ma Thuột
          </p>

          <div style={{ marginTop: "20px" }}>
            <p>
              🏛 Câu lạc bộ Sinh viên 5 tốt Trường Đại học Y Dược Buôn Ma Thuột
            </p>
            <p>
              📍 298 Hà Huy Tập, Phường Tân An, Tỉnh Đắk Lắk
            </p>
            <p>
              ✉ hoisinhvien@bmu.edu.vn
            </p>
          </div>
        </div>

        <div>
          <h3
            style={{
              color: "#2563eb",
              marginBottom: "20px",
            }}
          >
            Kết nối với chúng tôi
          </h3>

          <div
            style={{
              display: "flex",
              gap: "15px",
            }}
          >
            <a
              href="https://www.facebook.com/profile.php?id=100093817715642"
              target="_blank"
            >
              <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "8px",
  }}
>
  <FaFacebook
    color="#1877F2"
    size={20}
  />
  Facebook
</div>
</a>
          </div>
        </div>
      </div>

      <hr
        style={{
          margin: "25px 0",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          color: "#6b7280",
          flexWrap: "wrap",
        }}
      >
        <span>
          © 2026 Hệ thống được phát triển bởi Sinh viên Trần Hà Xuân Hiển
        </span>
    
        <span>
          Lớp 22DA1, Trường Đại học Y Dược Buôn Ma Thuột
        </span>
      </div>
    </div>
  );
}