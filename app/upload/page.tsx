"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SmartImg } from "@/components/SmartImg";
import { uploadImage } from "@/lib/api/images";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { canPost } from "@/lib/types";
import { currentDay, DAYS, DAY_LABEL, type Day } from "@/lib/event";
import { hasProfanity } from "@/lib/moderation";
import { IconCamera, IconLock, IconWarning, IconClose } from "@/components/icons";

const MAX = 50;
const EMOJIS = ["🙏", "🔥", "😂", "❤️", "🙌", "✨", "🍚", "📸", "☀️", "🎉"];

/** 이미지 파일 여부 (HEIC는 type이 비어 있을 수 있어 확장자도 확인) */
function isImage(f: File): boolean {
  return f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name);
}

export default function UploadPage() {
  const { role, session } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  // 행사 day는 필수 선택. 진입 시 현재 day를 기본값으로 미리 선택해 둔다.
  // (Date.now() 의존 → SSR/CSR 불일치 방지 위해 effect에서 설정)
  const [day, setDay] = useState<Day | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    setDay(currentDay());
  }, []);

  const allowed = role !== null && canPost(role);
  // 오이코스는 서버가 로그인 세션으로 결정. 화면엔 읽기 전용으로만 표시.
  const oikosName = session?.oikosName ?? null;

  function select(f: File) {
    if (!isImage(f)) {
      setError("이미지 파일만 올릴 수 있어요. (JPG · PNG · HEIC)");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  }

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) select(f);
  }

  function clearFile() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (!allowed) return;
    const f = e.dataTransfer.files?.[0];
    if (f) select(f);
  }

  function addEmoji(em: string) {
    setComment((c) => (c.length + em.length <= MAX ? c + em : c));
  }

  async function publish() {
    if (!file || !day || busy) return;
    setError(null);

    if (hasProfanity(comment)) {
      setError("코멘트에 사용할 수 없는 표현이 있어요. 다시 확인해주세요.");
      return;
    }

    setBusy(true);
    try {
      // 오이코스는 보내지 않음 — 서버가 세션으로 결정. dev 인자는 mock 표시 전용.
      // day는 사용자가 고른 값을 전달하고, 검증·저장은 백엔드가 맡는다.
      await uploadImage(comment.trim(), file, day, session?.token ?? null, {
        oikosName: oikosName ?? "",
        previewUrl: preview ?? "",
      });
      router.push("/gallery");
    } catch (e) {
      setError(
        e instanceof ApiError && e.isAuth
          ? "로그인이 만료됐거나 권한이 없어요. 다시 로그인해주세요."
          : e instanceof Error
            ? e.message
            : "사진을 올리지 못했어요. 잠시 후 다시 시도해주세요.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-up mx-auto max-w-[460px] px-[18px] pb-[calc(80px+env(safe-area-inset-bottom))] pt-[22px]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">사진 올리기</h1>
          <p className="mt-1 break-keep text-[13px] text-[var(--muted)]">
            한 장의 순간을 남겨요
          </p>
        </div>
        {allowed && oikosName && (
          <span className="mt-1 shrink-0 rounded-full bg-[rgba(47,111,237,0.1)] px-3 py-1 text-[12.5px] font-bold text-[var(--accent)]">
            오이코스 {oikosName}
          </span>
        )}
      </div>

      {!allowed && (
        <div className="mb-[18px] flex items-start gap-2.5 rounded-xl border border-[rgba(232,144,42,0.4)] bg-[rgba(232,144,42,0.1)] px-3.5 py-3 text-[12.5px] text-[#a8631a]">
          <IconLock className="mt-px h-4 w-4 shrink-0" />
          <div className="break-keep">
            <b>뷰어</b>는 열람만 가능해요. 게시는 리더 이상만 할 수 있어요.{" "}
            <button
              onClick={() => router.push("/login")}
              className="font-semibold underline"
            >
              로그인
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/heic,image/heif,.heic,.heif"
        className="hidden"
        onChange={pick}
      />

      {preview ? (
        <div className="mb-4">
          <div className="relative overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-soft)]">
            <SmartImg
              src={preview}
              alt="미리보기"
              className="mx-auto block max-h-[340px] w-full object-contain"
            />
            <button
              type="button"
              onClick={clearFile}
              aria-label="사진 제거"
              className="tappable absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/70"
            >
              <IconClose className="h-[18px] w-[18px]" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="tappable mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg-soft)] py-2.5 text-[13px] font-semibold text-[var(--text)] hover:bg-[var(--line)]"
          >
            <IconCamera className="h-[18px] w-[18px]" />
            다른 사진 선택
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (allowed) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          disabled={!allowed}
          className={`tappable mb-4 w-full rounded-[var(--radius)] border-2 border-dashed px-[18px] py-10 text-center disabled:opacity-50 ${
            dragOver
              ? "border-[var(--accent)] bg-[rgba(47,111,237,0.06)] text-[var(--accent)]"
              : "border-[var(--line)] bg-[var(--bg-soft)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"
          }`}
        >
          <span className="block">
            <IconCamera className="mx-auto mb-2 h-10 w-10" />
            <span className="font-semibold text-[var(--text)]">
              탭해서 사진 선택
            </span>
            <br />
            <span className="break-keep text-[11.5px] text-[var(--muted)]">
              끌어다 놓아도 돼요 · JPG · PNG · HEIC
            </span>
          </span>
        </button>
      )}

      {/* 행사 day — 필수. 진입 시 현재 day가 기본 선택돼 있고, 사용자는 확인만 하면 됨. */}
      <div className="mb-1.5 flex items-baseline justify-between">
        <label className="text-[12.5px] font-semibold text-[var(--muted)]">
          행사 day{" "}
          <span className="font-normal text-[var(--accent)]">(필수)</span>
        </label>
      </div>
      <div className="mb-1.5 grid grid-cols-4 gap-1.5">
        {DAYS.map((d) => {
          const on = day === d;
          return (
            <button
              key={d}
              type="button"
              disabled={!allowed}
              onClick={() => setDay(d)}
              className={`tappable rounded-xl border py-2.5 text-[13px] font-bold transition disabled:opacity-50 ${
                on
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white shadow-[0_6px_16px_rgba(47,111,237,0.22)]"
                  : "border-[var(--line)] bg-[var(--bg-soft)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"
              }`}
            >
              {DAY_LABEL[d]}
            </button>
          );
        })}
      </div>
      <p className="mb-4 break-keep text-[11.5px] text-[var(--muted)]">
        현재 일정 기준 day가 미리 선택돼 있어요. 다른 날 사진이면 직접 바꿔주세요.
      </p>

      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor="comment" className="text-[12.5px] font-semibold text-[var(--muted)]">
          한 줄 코멘트{" "}
          <span className="font-normal opacity-70">(선택)</span>
        </label>
        <span
          className={`text-[11.5px] ${
            comment.length >= MAX
              ? "font-semibold text-[#c0392b]"
              : comment.length >= MAX - 10
                ? "text-[#a8631a]"
                : "text-[var(--muted)]"
          }`}
        >
          {comment.length}/{MAX}
        </span>
      </div>
      <textarea
        id="comment"
        value={comment}
        maxLength={MAX}
        onChange={(e) => setComment(e.target.value)}
        placeholder="예) 우리 조 점심 최고였다 🍚"
        disabled={!allowed}
        className="field min-h-16 w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--bg-soft)] px-3.5 py-3 text-[14px] text-[var(--text)] outline-none disabled:opacity-50"
      />

      {/* 빠른 이모지 — 탭 한 번으로 코멘트에 추가 */}
      <div className="mb-4 mt-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {EMOJIS.map((em) => (
          <button
            key={em}
            type="button"
            disabled={!allowed}
            onClick={() => addEmoji(em)}
            className="tappable grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-[var(--bg-soft)] text-[17px] hover:bg-[var(--line)] disabled:opacity-50"
          >
            {em}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-[rgba(200,50,40,0.3)] bg-[rgba(200,50,40,0.07)] px-3.5 py-3 text-[12.5px] text-[#c0392b]">
          <IconWarning className="mt-px h-4 w-4 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      <button
        onClick={publish}
        disabled={!allowed || !preview || !day || busy}
        className="tappable flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[#5b9dff] py-3 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(47,111,237,0.25)] disabled:opacity-40 disabled:shadow-none"
      >
        {busy && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        )}
        {busy ? "올리는 중…" : "올리기"}
      </button>
    </div>
  );
}
