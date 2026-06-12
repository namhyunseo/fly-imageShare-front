"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";
import { IconTent, IconEye, IconEyeOff } from "@/components/icons";

export default function LoginPage() {
  const { login, enterViewer } = useAuth();
  const router = useRouter();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (busy || !id.trim()) return;
    setError(null);
    setBusy(true);
    try {
      await login(id.trim(), pw);
      router.push("/upload");
    } catch (e) {
      // 401/403 = 아이디·비밀번호 오류, 그 외는 서버 메시지
      setError(
        e instanceof ApiError && e.isAuth
          ? "아이디 또는 비밀번호가 올바르지 않아요."
          : e instanceof Error
            ? e.message
            : "로그인에 실패했어요. 잠시 후 다시 시도해주세요.",
      );
      setBusy(false);
    }
  }

  function browse() {
    enterViewer();
    router.push("/gallery");
  }

  return (
    <section
      className="flex min-h-[100dvh] flex-col justify-center px-5 py-6"
      style={{ background: "var(--grad-night)" }}
    >
      <div className="animate-fade-up mx-auto w-full max-w-[380px] rounded-[24px] border border-[var(--line)] bg-[var(--card)] p-7 shadow-[0_24px_70px_rgba(30,50,90,0.12)]">
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-[18px] bg-gradient-to-br from-[var(--accent)] to-[#5b9dff] text-white shadow-[0_8px_24px_rgba(47,111,237,0.3)]">
          <IconTent className="h-7 w-7" />
        </div>
        <h1 className="text-[22px] font-bold tracking-tight">2026 여름 수련회</h1>
        <p className="mb-6 mt-1 break-keep text-[13.5px] text-[var(--muted)]">
          오이코스의 순간을 함께 나눠요.
        </p>

        <div className="mb-3">
          <label
            htmlFor="login-id"
            className="mb-1.5 block text-[12.5px] font-semibold text-[var(--muted)]"
          >
            아이디
          </label>
          <input
            id="login-id"
            value={id}
            onChange={(e) => setId(e.target.value)}
            autoComplete="username"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="발급받은 리더 / 관리자 계정"
            className="field w-full rounded-xl border border-[var(--line)] bg-[var(--bg-soft)] px-3.5 py-3 text-[15px] text-[var(--text)] outline-none"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="login-pw"
            className="mb-1.5 block text-[12.5px] font-semibold text-[var(--muted)]"
          >
            비밀번호
          </label>
          <div className="relative">
            <input
              id="login-pw"
              type={showPw ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              autoComplete="current-password"
              placeholder="••••••••"
              className="field w-full rounded-xl border border-[var(--line)] bg-[var(--bg-soft)] py-3 pl-3.5 pr-11 text-[15px] text-[var(--text)] outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 표시"}
              className="tappable absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
            >
              {showPw ? (
                <IconEyeOff className="h-[18px] w-[18px]" />
              ) : (
                <IconEye className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="animate-fade-up mb-3 rounded-xl border border-[rgba(200,50,40,0.3)] bg-[rgba(200,50,40,0.07)] px-3.5 py-2.5 text-[12.5px] text-[#c0392b]">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={busy || !id.trim()}
          className="tappable w-full rounded-xl bg-gradient-to-br from-[var(--accent)] to-[#5b9dff] py-3 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(47,111,237,0.25)] disabled:opacity-40 disabled:shadow-none"
        >
          {busy ? "로그인 중…" : "리더 / 관리자로 로그인"}
        </button>

        <div className="my-4 flex items-center gap-2.5 text-[12px] text-[var(--muted)] before:h-px before:flex-1 before:bg-[var(--line)] after:h-px after:flex-1 after:bg-[var(--line)]">
          또는
        </div>

        <button
          onClick={browse}
          className="tappable flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-transparent py-3 text-[15px] font-bold text-[var(--text)] hover:bg-[var(--bg-soft)]"
        >
          <IconEye className="h-[18px] w-[18px] text-[var(--muted)]" />
          그냥 둘러보기 (뷰어)
        </button>

        <p className="mt-5 break-keep text-center text-[11.5px] leading-relaxed text-[var(--muted)]">
          <b className="text-[var(--accent2)]">리더·관리자</b>는 발급된 계정으로
          로그인 → 게시 가능
          <br />
          <b>뷰어</b>는 로그인 없이 갤러리·디스플레이 열람만
        </p>
      </div>
    </section>
  );
}
