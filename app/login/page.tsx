"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");

  function enter(role: Role) {
    login(role);
    router.push(role === "viewer" ? "/gallery" : "/upload");
  }

  // mock: 아이디에 'admin' 포함이면 관리자, 그 외 입력 시 리더로 발급
  function handleLeaderLogin() {
    const role: Role = id.trim().toLowerCase().includes("admin")
      ? "admin"
      : "leader";
    enter(role);
  }

  return (
    <section
      className="flex min-h-[100dvh] flex-col justify-center px-5 py-6"
      style={{ background: "var(--grad-night)" }}
    >
      <div className="mx-auto w-full max-w-[380px] rounded-[22px] border border-[var(--line)] bg-[rgba(35,37,68,0.6)] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-[18px] bg-gradient-to-br from-[var(--accent)] to-[#ff7e5f] text-[28px] shadow-[0_8px_24px_rgba(255,126,95,0.35)]">
          ⛺
        </div>
        <h1 className="text-[22px] font-semibold tracking-tight">
          2026 여름 수련회
        </h1>
        <p className="mb-5 mt-1 text-[13.5px] text-[var(--muted)]">
          오이코스의 순간을 함께 나눠요.
        </p>

        <div className="mb-3">
          <label className="mb-1.5 block text-[12.5px] font-semibold text-[var(--muted)]">
            아이디
          </label>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="리더 / 관리자 계정"
            className="w-full rounded-xl border border-[var(--line)] bg-[#16182e] px-3.5 py-3 text-[15px] text-[var(--text)] outline-none focus:border-[var(--accent2)]"
          />
        </div>
        <div className="mb-3">
          <label className="mb-1.5 block text-[12.5px] font-semibold text-[var(--muted)]">
            비밀번호
          </label>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-[var(--line)] bg-[#16182e] px-3.5 py-3 text-[15px] text-[var(--text)] outline-none focus:border-[var(--accent2)]"
          />
        </div>

        <button
          onClick={handleLeaderLogin}
          className="w-full rounded-xl bg-gradient-to-br from-[var(--accent)] to-[#ff9d54] py-3 text-[15px] font-bold text-[#1a1530]"
        >
          리더로 로그인
        </button>

        <div className="my-4 flex items-center gap-2.5 text-[12px] text-[var(--muted)] before:h-px before:flex-1 before:bg-[var(--line)] after:h-px after:flex-1 after:bg-[var(--line)]">
          또는
        </div>

        <button
          onClick={() => enter("viewer")}
          className="block w-full rounded-xl border border-[var(--line)] bg-transparent py-3 text-[15px] font-bold text-[var(--muted)]"
        >
          👀 그냥 둘러보기 (뷰어)
        </button>

        <p className="mt-4 text-center text-[11.5px] leading-relaxed text-[var(--muted)]">
          <b className="text-[var(--accent2)]">리더·관리자</b>는 발급된 계정으로
          로그인 → 게시 가능
          <br />
          <b>뷰어</b>는 로그인 없이 갤러리·디스플레이 열람만
        </p>
      </div>
    </section>
  );
}
