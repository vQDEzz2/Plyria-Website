import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Images are small files in public/, served as they are. Cloudflare Workers would otherwise need
  // its paid Images binding to resize them.
  images: { unoptimized: true },
};

export default nextConfig;
