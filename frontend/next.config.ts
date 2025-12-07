import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "cdn.myanimelist.net" },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;