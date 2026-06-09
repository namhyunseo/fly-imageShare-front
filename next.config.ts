import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // mock 단계: 외부 샘플 이미지. Supabase 연동 시 스토리지 도메인으로 교체.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
