import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mô hình hỗ trợ sinh viên phấn đấu đạt danh hiêu Sinh viên 5 tốt các cấp",
  description:   "Website hỗ trợ sinh viên của Câu lạc bộ Sinh viên 5 tốt Trường Đại học Y Dược Buôn Ma Thuột đăng ký, quản lý và theo dõi quá trình phấn đấu đạt danh hiệu Sinh viên 5 Tốt các cấp.",
  verification: {
    google: "THB1FKLIDQzUeTh3dgTRWz7t-ySjHjpDiuclP6zV83g"
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
