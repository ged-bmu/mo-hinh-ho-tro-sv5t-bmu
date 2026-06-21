"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Sidebar() {
const pathname = usePathname();

const menus = [
{
name: "Trang chủ",
icon: "🏠",
href: "/",
},
{
name: "Báo cáo thành tích",
icon: "📑",
href: "/bao-cao",
},

{
name: "Đạo đức tốt",
icon: "❤️",
href: "/dao-duc",
},
{
name: "Học tập tốt",
icon: "📚",
href: "/hoc-tap",
},
{
name: "Thể lực tốt",
icon: "💪",
href: "/the-luc",
},
{
name: "Tình nguyện tốt",
icon: "🤝",
href: "/tinh-nguyen",
},
{
name: "Hội nhập tốt",
icon: "🌏",
href: "/hoi-nhap",
},
{
name: "Tiêu chuẩn ưu tiên",
icon: "⭐",
href: "/uu-tien",
},
{
name: "Đổi mật khẩu",
icon: "🔐",
href: "/doi-mat-khau",
},
];

async function handleLogout() {
await supabase.auth.signOut();
window.location.href = "/login";
}

return (
<aside
style={{
width: "280px",
minHeight: "100vh",
background: "white",
borderRight: "1px solid #e5e7eb",
padding: "20px",
display: "flex",
flexDirection: "column",
}}
>
<div
style={{
marginBottom: "20px",
paddingBottom: "15px",
borderBottom: "1px solid #e5e7eb",
}}
>
<Image
src="/logo-header.png"
alt="Logo"
width={220}
height={80}
style={{
width: "100%",
height: "auto",
}}
/> </div>

  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    }}
  >
    {menus.map((item) => {
      const active = pathname === item.href;

      return (
        <Link
          key={item.href}
          href={item.href}
          style={{
            padding: "12px 14px",
            borderRadius: "12px",
            textDecoration: "none",
            fontSize: "17px",

            background: active
              ? "#2563eb"
              : "transparent",

            color: active
              ? "white"
              : "#111827",

            fontWeight: active
              ? "600"
              : "400",

            transition: "0.2s",
          }}
        >
          {item.icon} {item.name}
        </Link>
      );
    })}
  </div>

  <div style={{ flex: 1 }} />

  <button
    onClick={handleLogout}
    style={{
      border: "none",
      background: "#ef4444",
      color: "white",
      padding: "14px",
      borderRadius: "12px",
      cursor: "pointer",
      fontSize: "17px",
      fontWeight: "600",
    }}
  >
    🚪 Đăng xuất
  </button>
</aside>

);
}
