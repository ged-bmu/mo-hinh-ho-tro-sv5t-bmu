import { FaFacebook } from "react-icons/fa";
import AppIcon from "./AppIcon";

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
    gap: "24px",
  }}
>
  {/* Thông tin chính */}
  <div style={{ flex: "1 1 320px", minWidth: 0 }}>
    <h3
      style={{
        color: "#0b1772",
        margin: "0 0 10px",
        lineHeight: 1.4,
      }}
    >
      HỆ THỐNG HỖ TRỢ SINH VIÊN 5 TỐT TRƯỜNG ĐẠI HỌC Y DƯỢC BUÔN MA THUỘT
    </h3>

    <div
      style={{
        lineHeight: 1.5,
        color: "#111827",
      }}
    >
      {/* Logo và tên Hội */}
      <div
        className="flex items-center gap-2"
        style={{
          margin: "0 0 10px",
          lineHeight: 1.4,
        }}
      >
        <img
          src="/logo-hsv.png"
          alt="Logo Hội Sinh viên"
          className="h-4.5 w-4.5 shrink-0 object-contain"
        />

        <p className="m-0 sm:whitespace-nowrap">
          Hội Sinh viên Việt Nam Trường Đại học Y Dược Buôn Ma Thuột
        </p>
      </div>

      {/* Địa chỉ */}
     {/* Địa chỉ */}
<p
  style={{
    margin: "6px 0",
    lineHeight: 1.5,
  }}
>
  <span
    style={{
      display: "flex",
      alignItems: "flex-start",
      minWidth: 0,
    }}
  >
    <AppIcon
      name="map-pin"
      size={16}
      style={{
        marginRight: 6,
        flexShrink: 0,
        marginTop: 3,
      }}
    />
    <span style={{ minWidth: 0 }}>
      298 Hà Huy Tập, phường Tân An, tỉnh Đắk Lắk
    </span>
  </span>
</p>

{/* Email */}
<p
  style={{
    margin: "6px 0",
    lineHeight: 1.5,
  }}
>
  <span
    style={{
      display: "flex",
      alignItems: "flex-start",
      minWidth: 0,
    }}
  >
    <AppIcon
      name="mail"
      size={16}
      style={{
        marginRight: 6,
        flexShrink: 0,
        marginTop: 3,
      }}
    />
    <span style={{ minWidth: 0 }}>
      hoisinhvien@bmu.edu.vn
    </span>
  </span>
</p>
    </div>
  </div>

  {/* Kết nối */}
  <div style={{ flex: "0 1 220px", minWidth: 220 }}>
    <h3
      style={{
        color: "#2563eb",
        margin: "0 0 12px",
        lineHeight: 1.4,
      }}
    >
      Kết nối với chúng tôi
    </h3>
    <a
      href="https://www.facebook.com/profile.php?id=100085955413497"
      target="_blank"
      rel="noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        textDecoration: "none",
        color: "#111827",
        marginBottom: "15px",
        lineHeight: 1.5,
      }}
    >
      <FaFacebook color="#1877F2" size={20} />
      Tuổi trẻ BMU <AppIcon name="external-link" size={16} style={{ marginLeft: 0, verticalAlign: "middle" }} />
    </a>

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
        lineHeight: 1.5,
      }}
    >
      <FaFacebook color="#1877F2" size={20} />
      CLB Sinh viên 5 tốt <AppIcon name="external-link" size={16} style={{ marginLeft: 0, verticalAlign: "middle" }} />
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
          © 2026 - Trần Hà Xuân Hiển • Phiên bản 1.4.0
        </span>

        <span>
          Câu lạc bộ Sinh viên 5 tốt Trường Đại học Y Dược Buôn Ma Thuột
        </span>
      </div>
    </div>
  );
}