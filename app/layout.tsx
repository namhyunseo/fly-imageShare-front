import type { Metadata } from "next";
import { Nanum_Pen_Script, Gaegu } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";

const nanumPen = Nanum_Pen_Script({
  variable: "--font-nanum-pen",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const gaegu = Gaegu({
  variable: "--font-gaegu",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

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
    <html lang="ko" className={`${nanumPen.variable} ${gaegu.variable}`}>
      <body className="flex min-h-[100dvh] flex-col">
        <AuthProvider>
          <main className="flex-1">{children}</main>
          <AppNav />
        </AuthProvider>
      </body>
    </html>
  );
}
