import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remotion renderer and bundler are Node.js-only packages that use native
  // binaries. Marking them as external prevents Next.js from trying to bundle
  // them through webpack, which would fail because of the native compositor.
  serverExternalPackages: [
    "@remotion/renderer",
    "@remotion/bundler",
    "remotion",
  ],

  // Increase the body size limit for image uploads (50 MB)
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
