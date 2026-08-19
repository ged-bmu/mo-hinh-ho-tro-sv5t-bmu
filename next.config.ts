import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "26mb",
  },

  serverExternalPackages: [
    "@sparticuz/chromium",
    "puppeteer-core",
  ],

  outputFileTracingIncludes: {
    "/api/export-pdf/**": [
      "./node_modules/@sparticuz/chromium/bin/**/*",
    ],
  },
};

export default nextConfig;