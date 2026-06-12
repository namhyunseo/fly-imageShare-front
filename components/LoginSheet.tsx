"use client";

// 로그인 바텀시트 — 하단 네비의 계정 탭에서 올라온다.
// /login 페이지 대신 화면 전환 없이 시트로 로그인/둘러보기.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { IconClose } from "@/components/icons";

export function LoginSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);

  // open → 마운트 후 시작 위치(translate-y-full)가 한 프레임 페인트된 뒤 슬라이드 업.
  // 단일 rAF는 초기 transform이 커밋되기 전에 상태가 바뀌어 끊겨 보이므로 이중 rAF로 커밋을 보장한다.
  // close → 슬라이드 다운 후 onTransitionEnd에서 언마운트.
  useEffect(() => {
    if (open) {
      setMounted(true);
      let r2 = 0;
      const r1 = requestAnimationFrame(() => {
        r2 = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(r1);
        cancelAnimationFrame(r2);
      };
    }
    setShown(false);
  }, [open]);

  // 시트 떠 있는 동안 배경 스크롤 잠금
  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  // ESC로 닫기
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, onClose]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-[420ms] ease-out ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        onTransitionEnd={(e) => {
          // 시트 자신의 transform 트랜지션만 처리 (자식 트랜지션 버블링 무시)
          if (e.target === e.currentTarget && !shown) setMounted(false);
        }}
        style={{
          willChange: "transform",
          transitionTimingFunction: shown
            ? "cubic-bezier(0.16, 1, 0.3, 1)" // 올라올 때: 살짝 감속하며 안착
            : "cubic-bezier(0.4, 0, 1, 1)", // 내려갈 때: 가속하며 사라짐
        }}
        className={`absolute inset-x-0 bottom-0 mx-auto max-h-[92dvh] w-full max-w-[460px] overflow-y-auto rounded-t-[26px] border-t border-[var(--line)] bg-[var(--card)] px-6 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-3 shadow-[0_-20px_60px_rgba(30,50,90,0.18)] transition-transform duration-[420ms] ${
          shown ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* 그랩 핸들 */}
        <div className="mx-auto mb-4 h-1.5 w-11 rounded-full bg-[var(--line)]" />
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="tappable absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
        >
          <IconClose className="h-5 w-5" />
        </button>

        <LoginForm
          onLoggedIn={() => {
            onClose();
            router.push("/upload");
          }}
          onBrowse={onClose}
        />
      </div>
    </div>
  );
}
