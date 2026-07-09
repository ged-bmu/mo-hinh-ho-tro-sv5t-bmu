import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Hệ thống hỗ trợ Sinh viên 5 Tốt BMU",
    short_name: "SV5T BMU",
    description:
      "Website hỗ trợ sinh viên của Câu lạc bộ Sinh viên 5 Tốt Trường Đại học Y Dược Buôn Ma Thuột.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    lang: "vi",

    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}