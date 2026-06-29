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
  title: "Hệ thống hỗ trợ Sinh viên 5 Tốt BMU",
  description:
    "Website hỗ trợ sinh viên của Câu lạc bộ Sinh viên 5 Tốt Trường Đại học Y Dược Buôn Ma Thuột đăng ký, quản lý và theo dõi quá trình phấn đấu đạt danh hiệu Sinh viên 5 Tốt các cấp.",

  applicationName: "Hệ thống hỗ trợ Sinh viên 5 Tốt BMU",

  verification: {
    google: "THB1FKLIDQzUeTh3dgTRWz7t-ySjHjpDiuclP6zV83g"
  },
   openGraph: {
    title: "Hệ thống hỗ trợ Sinh viên 5 Tốt BMU",
    description:
      "Website hỗ trợ sinh viên của Câu lạc bộ Sinh viên 5 Tốt Trường Đại học Y Dược Buôn Ma Thuột.",
    siteName: "Hệ thống hỗ trợ Sinh viên 5 Tốt BMU",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Hệ thống hỗ trợ Sinh viên 5 Tốt BMU",
    description:
      "Website hỗ trợ sinh viên của Câu lạc bộ Sinh viên 5 Tốt Trường Đại học Y Dược Buôn Ma Thuột.",
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
