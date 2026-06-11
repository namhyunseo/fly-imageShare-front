"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { SmartImg } from "@/components/SmartImg";
import { uploadImage } from "@/lib/api/images";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { canPost } from "@/lib/types";
import { hasProfanity } from "@/lib/moderation";

const MAX = 50;

export default function UploadPage() {
  const { role, session } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowed = role !== null && canPost(role);
  // 오이코스는 서버가 로그인 세션으로 결정. 화면엔 읽기 전용으로만 표시.
  const oikosName = session?.oikosName ?? null;

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  }

  async function publish() {
    if (!file || busy) return;
    setError(null);

    if (hasProfanity(comment)) {
      setError("코멘트에 사용할 수 없는 표현이 있어요. 다시 확인해주세요.");
      return;
    }

    setBusy(true);
    try {
      // 오이코스는 보내지 않음 — 서버가 세션으로 결정. dev 인자는 mock 표시 전용.
      await uploadImage(comment.trim(), file, session?.token ?? null, {
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
    <div className="mx-auto max-w-[460px] px-[18px] pb-[60px] pt-[22px]">
      <h1 className="mb-0.5 text-[22px] font-semibold tracking-tight">
        사진 올리기
      </h1>
      <p className="mb-5 text-[13.5px] leading-relaxed text-[var(--muted)]">
        우리 오이코스의 한 순간을 올려요. 한 번에 사진 1장 + 코멘트 1개.
      </p>

      {allowed ? (
        <div className="mb-[18px] flex items-start gap-2.5 rounded-xl border border-[rgba(124,108,255,0.4)] bg-[rgba(124,108,255,0.12)] px-3.5 py-3 text-[12.5px] text-[#cfc8ff]">
          ✍️
          <div>
            <b>게시 권한</b>이 있어요. 올린 사진은 갤러리와 빔 화면에 바로
            나타나요.
            {oikosName && (
              <>
                {" "}내 오이코스는{" "}
                <b className="text-[var(--accent2)]">{oikosName}</b> 예요.
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-[18px] flex items-start gap-2.5 rounded-xl border border-[rgba(255,180,84,0.4)] bg-[rgba(255,180,84,0.1)] px-3.5 py-3 text-[12.5px] text-[#ffe0b0]">
          🔒
          <div>
            <b>뷰어</b>는 열람만 가능해요. 게시는 오이코스 리더 이상만 할 수
            있어요.{" "}
            <button onClick={() => router.push("/login")} className="underline">
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
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={!allowed}
        className="mb-3.5 w-full rounded-[var(--radius)] border-2 border-dashed border-[var(--line)] bg-[#16182e] text-center text-[var(--muted)] disabled:opacity-50"
        style={{ padding: preview ? 8 : "34px 18px" }}
      >
        {preview ? (
          <SmartImg
            src={preview}
            alt="preview"
            className="block h-[200px] w-full rounded-xl object-cover"
          />
        ) : (
          <span className="block">
            <span className="mb-2 block text-[38px]">📷</span>
            탭해서 사진 선택
            <br />
            <span className="text-[11.5px]">JPG·PNG·HEIC · 큰 사진은 자동 압축</span>
          </span>
        )}
      </button>

      <label className="block text-[12.5px] font-semibold text-[var(--muted)]">
        한 줄 코멘트
      </label>
      <textarea
        value={comment}
        maxLength={MAX}
        onChange={(e) => setComment(e.target.value)}
        placeholder="예) 우리 조 점심 최고였다 🍚"
        disabled={!allowed}
        className="min-h-16 w-full resize-none rounded-xl border border-[var(--line)] bg-[#16182e] px-3.5 py-3 text-[14px] text-[var(--text)] outline-none disabled:opacity-50"
      />
      <div className="mb-4 mt-1 text-right text-[11.5px] text-[var(--muted)]">
        {comment.length}/{MAX}
      </div>

      {error && (
        <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-[rgba(255,107,107,0.45)] bg-[rgba(255,107,107,0.1)] px-3.5 py-3 text-[12.5px] text-[#ff9f9f]">
          ⚠️
          <div>{error}</div>
        </div>
      )}

      <button
        onClick={publish}
        disabled={!allowed || !preview || busy}
        className="w-full rounded-xl bg-gradient-to-br from-[var(--accent)] to-[#ff9d54] py-3 text-[15px] font-bold text-[#1a1530] disabled:opacity-40"
      >
        {busy ? "올리는 중…" : "올리기"}
      </button>

      <div className="mt-6 border-t border-[var(--line)] pt-4 text-[11.5px] leading-relaxed text-[var(--muted)]">
        권한 3단계 · <b>관리자</b>: 전체 관리/모더레이션 · <b>리더</b>: 게시 ·{" "}
        <b>뷰어</b>: 열람. 오이코스는 로그인 계정 기준으로 자동 지정돼요.
        비속어·부적절 단어는 자동 필터링됩니다.
      </div>
    </div>
  );
}
