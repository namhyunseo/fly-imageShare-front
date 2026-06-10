"use client";

// 실제 앱 네비게이션 — 하단 탭바.
// 시안의 demo-nav(화면전환 데모)를 실제 라우트 기반 탭으로 대체.
// 빔 디스플레이·로그인은 풀스크린이라 탭바를 숨긴다.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ROLE_LABEL, canPost } from "@/lib/types";

const TABS = [
  { href: "/gallery", label: "갤러리", icon: "🖼️" },
  { href: "/upload", label: "올리기", icon: "📤" },
  { href: "/display", label: "빔", icon: "📽️" },
] as const;

const HIDDEN_ON = ["/display", "/login", "/"];

export function AppNav() {
  const pathname = usePathname();
  const { role } = useAuth();

  if (HIDDEN_ON.includes(pathname)) return null;

  return (
    <nav className="sticky bottom-0 z-50 border-t border-[var(--line)] bg-[rgba(15,16,32,0.9)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[460px] items-stretch">
        {TABS.map((t) => {
          const active = pathname.startsWith(t.href);
          const locked = t.href === "/upload" && role !== null && !canPost(role);
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
              <span className="text-[20px] leading-none">
                {locked ? "🔒" : t.icon}
              </span>
              {t.label}
            </Link>
          );
        })}
        <div className="flex items-center px-3">
          <Link
            href="/login"
            className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[11px] text-[var(--muted)]"
          >
            {role ? (
              <>
                {role === "VIEWER" ? "👤 " : "✍️ "}
                <b className="text-[var(--accent)]">{ROLE_LABEL[role]}</b>
              </>
            ) : (
              "로그인"
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
