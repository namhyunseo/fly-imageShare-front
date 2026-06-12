"use client";

// 실제 앱 네비게이션 — 하단 탭바.
// 시안의 demo-nav(화면전환 데모)를 실제 라우트 기반 탭으로 대체.
// 빔 디스플레이·로그인은 풀스크린이라 탭바를 숨긴다.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { ROLE_LABEL, canPost } from "@/lib/types";
import { IconGallery, IconUpload, IconBeam, IconUser } from "@/components/icons";

// 빔(/display)은 현장 프로젝터 송출용 — 관리자에게만 탭 노출.
// 올리기는 게시 권한(리더·관리자)에게만 노출. 뷰어·미입장은 숨김.
// (URL 직접 접근은 막지 않음. 데이터가 공개라 보안 이슈 없음.)
const TABS = [
  { href: "/gallery", label: "갤러리", Icon: IconGallery },
  { href: "/upload", label: "올리기", Icon: IconUpload, postOnly: true },
  { href: "/display", label: "빔", Icon: IconBeam, adminOnly: true },
] as const;

const HIDDEN_ON = ["/display", "/login", "/"];

export function AppNav() {
  const pathname = usePathname();
  const { role } = useAuth();
  // 스크롤 다운 → 숨김, 스크롤 업 → 표시 (맨 위에선 항상 표시)
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      if (y < 12) setHidden(false);
      else if (y > last + 6) setHidden(true);
      else if (y < last - 6) setHidden(false);
      last = y;
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (HIDDEN_ON.includes(pathname)) return null;

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-50 bg-[#ffffff] pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ease-out before:pointer-events-none before:absolute before:inset-x-0 before:-top-9 before:h-9 before:bg-gradient-to-t before:from-[#ffffff] before:to-transparent before:content-[''] ${
        hidden ? "translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto flex max-w-[460px] items-stretch">
        {TABS.filter((t) => {
          if ("adminOnly" in t && t.adminOnly) return role === "ADMIN";
          // 올리기: 게시 권한(리더·관리자)에게만. 뷰어·미입장은 숨김.
          if ("postOnly" in t && t.postOnly) return role !== null && canPost(role);
          return true;
        }).map((t) => {
          const active = pathname.startsWith(t.href);
          const Icon = t.Icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${
                active
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              <Icon className="h-[22px] w-[22px]" />
              {t.label}
            </Link>
          );
        })}
        {/* 계정 — 로그인 상태(역할) 또는 로그인 유도. 다른 탭과 동일한 탭 형태로 정렬. */}
        <Link
          href="/login"
          className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${
            pathname.startsWith("/login")
              ? "text-[var(--accent)]"
              : "text-[var(--muted)] hover:text-[var(--text)]"
          }`}
        >
          <IconUser className="h-[22px] w-[22px]" />
          {role ? ROLE_LABEL[role] : "로그인"}
        </Link>
      </div>
    </nav>
  );
}
