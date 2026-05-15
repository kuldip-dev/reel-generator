import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remotion renderer uses native compositor binaries — keep them out of the
  // webpack/turbopack server bundle and include them via file tracing instead.
  serverExternalPackages: [
    "@remotion/renderer",
    "remotion",
    "@remotion/compositor-linux-x64-gnu",
  ],

  outputFileTracingIncludes: {
    "/api/generate-video": [
      "./.remotion/bundle/**/*",
      "./node_modules/@remotion/renderer/**/*",
      "./node_modules/@remotion/compositor-linux-x64-gnu/**/*",
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
