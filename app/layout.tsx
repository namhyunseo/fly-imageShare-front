import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";

export const metadata: Metadata = {
  title: "오이코스 셰어 — 우리들의 순간",
  description: "수련회 사진을 모으고 · 빔으로 띄우고 · 남깁니다",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        {/* Pretendard (dynamic-subset: 한글 글리프를 필요한 만큼만 로드) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"
        />
      </head>
      <body className="flex min-h-[100dvh] flex-col">
        <AuthProvider>
          <main className="flex-1">{children}</main>
          <AppNav />
        </AuthProvider>
      </body>
    </html>
  );
}
