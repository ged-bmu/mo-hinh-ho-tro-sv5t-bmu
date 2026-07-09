import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./mobile.css";
import RegisterSW from "./components/RegisterSW";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mo-hinh-ho-tro-sv5t-bmu.vercel.app"),
  title: "Hệ thống hỗ trợ Sinh viên 5 Tốt BMU",
  description:
    "Website hỗ trợ sinh viên của Câu lạc bộ Sinh viên 5 Tốt Trường Đại học Y Dược Buôn Ma Thuột đăng ký, quản lý và theo dõi quá trình phấn đấu đạt danh hiệu Sinh viên 5 Tốt các cấp.",

  applicationName:
  "CLB Sinh viên 5 tốt Trường Đại học Y Dược Buôn Ma Thuột",

  verification: {
    google: "THB1FKLIDQzUeTh3dgTRWz7t-ySjHjpDiuclP6zV83g"
  },
   openGraph: {
    title: "Hệ thống hỗ trợ Sinh viên 5 Tốt BMU",
    description:
      "Website hỗ trợ sinh viên của Câu lạc bộ Sinh viên 5 Tốt Trường Đại học Y Dược Buôn Ma Thuột.",
    siteName:
  "CLB Sinh viên 5 tốt Trường Đại học Y Dược Buôn Ma Thuột",
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
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        
        <RegisterSW />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name:
                "CLB Sinh viên 5 tốt Trường Đại học Y Dược Buôn Ma Thuột",
              alternateName:
                "Hệ thống hỗ trợ Sinh viên 5 Tốt BMU",
              url: "https://mo-hinh-ho-tro-sv5t-bmu.vercel.app",
            }),
          }}
        />

        {children}

      </body>
    </html>
  );
}
