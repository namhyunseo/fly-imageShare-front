"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SmartImg } from "@/components/SmartImg";
import { getImage, updateImage } from "@/lib/api/images";
import { getTags } from "@/lib/api/tags";
import { imageSrc, ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { canManagePhoto, affiliationOf } from "@/lib/types";
import type { Photo, Tag } from "@/lib/types";
import { DAYS, DAY_LABEL, currentDay, type Day } from "@/lib/event";
import { hasProfanity } from "@/lib/moderation";
import { isMediaFile, isVideoFile, isVideoPhoto, MAX_VIDEO_BYTES } from "@/lib/media";
import { IconCamera, IconWarning } from "@/components/icons";

const MAX = 50;
const EMOJIS = ["🙏", "🔥", "😂", "❤️", "🙌", "✨", "🍚", "📸", "☀️", "🎉"];

// 수정 화면 — 업로드 화면과 같은 문법(사진 교체 · 코멘트 · day).
// 진입 권한은 업로더 본인·관리자만. 갤러리 상세 모달의 "수정하기"로 들어온다.
export default function EditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { role, session } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [day, setDay] = useState<Day | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagKey, setTagKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 사진 로드 + 권한 확인. 권한이 없으면 갤러리로 돌려보낸다.
  useEffect(() => {
    let alive = true;
    getImage(id)
      .then((p) => {
        if (!alive) return;
        if (!p) return;
        if (!canManagePhoto(p, session, role)) {
          setDenied(true);
          return;
        }
        setPhoto(p);
        setComment(p.comment);
        setDay(p.day ?? currentDay());
        setTagKey(p.tagKey ?? null);
        setPreview(imageSrc(p.imageUrl));
      })
      .finally(() => alive && setLoading(false));
    getTags()
      .then((ts) => alive && setTags(ts))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id, session, role]);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!isMediaFile(f)) {
      setError("사진 또는 MP4 동영상만 올릴 수 있어요.");
      return;
    }
    if (isVideoFile(f) && f.size > MAX_VIDEO_BYTES) {
      setError("동영상 용량이 너무 커요. 30MB 이하만 올릴 수 있어요.");
      return;
    }
    if (file && preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  }

  function addEmoji(em: string) {
    setComment((c) => (c.length + em.length <= MAX ? c + em : c));
  }

  async function save() {
    if (!photo || !day || busy) return;
    setError(null);
    if (hasProfanity(comment)) {
      setError("코멘트에 사용할 수 없는 표현이 있어요. 다시 확인해주세요.");
      return;
    }
    setBusy(true);
    try {
      await updateImage(photo.id, comment.trim(), day, session?.token ?? null, {
        file: file ?? undefined,
        tagKey,
        previewUrl: file ? (preview ?? undefined) : undefined,
      });
      router.push("/gallery");
    } catch (e) {
      setError(
        e instanceof ApiError && e.isAuth
          ? "로그인이 만료됐거나 권한이 없어요. 다시 로그인해주세요."
          : e instanceof Error
            ? e.message
            : "수정하지 못했어요. 잠시 후 다시 시도해주세요.",
      );
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[460px] px-[18px] pt-[22px]">
        <div className="h-[340px] animate-pulse rounded-[var(--radius)] bg-[var(--bg-soft)]" />
      </div>
    );
  }

  if (denied || !photo) {
    return (
      <div className="mx-auto mt-24 max-w-[460px] px-[18px] text-center">
        <p className="text-[15px] font-semibold text-[var(--text)]">
          {denied ? "이 사진을 수정할 권한이 없어요." : "사진을 찾을 수 없어요."}
        </p>
        <button
          onClick={() => router.push("/gallery")}
          className="tappable mt-4 rounded-xl border border-[var(--line)] bg-[var(--bg-soft)] px-5 py-2.5 text-[14px] font-semibold text-[var(--text)] hover:bg-[var(--line)]"
        >
          갤러리로
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-up mx-auto max-w-[460px] px-[18px] pb-[calc(80px+env(safe-area-inset-bottom))] pt-[22px]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">사진 수정</h1>
          <p className="mt-1 break-keep text-[13px] text-[var(--muted)]">
            사진 · 코멘트 · day를 다시 조정해요
          </p>
        </div>
        <span className="mt-1 shrink-0 rounded-full bg-[rgba(47,111,237,0.1)] px-3 py-1 text-[12.5px] font-bold text-[var(--accent)]">
          {affiliationOf(photo)}
        </span>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/heic,image/heif,.heic,.heif,video/mp4,.mp4"
        className="hidden"
        onChange={pick}
      />

      <div className="mb-4">
        <div className="relative overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-soft)]">
          {preview &&
            ((file ? isVideoFile(file) : isVideoPhoto(photo)) ? (
              <video
                src={preview}
                controls
                playsInline
                className="mx-auto block max-h-[340px] w-full object-contain"
              />
            ) : (
              <SmartImg
                src={preview}
                alt="미리보기"
                className="mx-auto block max-h-[340px] w-full object-contain"
              />
            ))}
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="tappable mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg-soft)] py-2.5 text-[13px] font-semibold text-[var(--text)] hover:bg-[var(--line)]"
        >
          <IconCamera className="h-[18px] w-[18px]" />
          파일 교체
        </button>
      </div>

      {/* 행사 day */}
      <div className="mb-1.5">
        <label className="text-[12.5px] font-semibold text-[var(--muted)]">
          행사 day <span className="font-normal text-[var(--accent)]">(필수)</span>
        </label>
      </div>
      <div className="mb-4 grid grid-cols-4 gap-1.5">
        {DAYS.map((d) => {
          const on = day === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDay(d)}
              className={`tappable rounded-xl border py-2.5 text-[13px] font-bold transition ${
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

      {/* 프로그램 태그 */}
      {tags.length > 0 && (
        <>
          <div className="mb-1.5">
            <label className="text-[12.5px] font-semibold text-[var(--muted)]">
              프로그램 태그 <span className="font-normal opacity-70">(선택)</span>
            </label>
          </div>
          <div className="mb-4 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setTagKey(null)}
              className={`tappable rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition ${
                tagKey === null
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--line)] bg-[var(--bg-soft)] text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              없음
            </button>
            {tags.map((t) => {
              const on = tagKey === t.tagKey;
              return (
                <button
                  key={t.tagKey}
                  type="button"
                  onClick={() => setTagKey(t.tagKey)}
                  className={`tappable rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition ${
                    on
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : "border-[var(--line)] bg-[var(--bg-soft)] text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {t.tagName}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* 코멘트 */}
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor="comment" className="text-[12.5px] font-semibold text-[var(--muted)]">
          한 줄 코멘트 <span className="font-normal opacity-70">(선택)</span>
        </label>
        <span
          className={`text-[11.5px] ${
            comment.length >= MAX
              ? "font-semibold text-[#c0392b]"
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
        className="field min-h-16 w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--bg-soft)] px-3.5 py-3 text-[14px] text-[var(--text)] outline-none"
      />
      <div className="mb-4 mt-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {EMOJIS.map((em) => (
          <button
            key={em}
            type="button"
            onClick={() => addEmoji(em)}
            className="tappable grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-[var(--bg-soft)] text-[17px] hover:bg-[var(--line)]"
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

      <div className="flex gap-2">
        <button
          onClick={() => router.push("/gallery")}
          className="tappable flex-1 rounded-xl border border-[var(--line)] bg-[var(--bg-soft)] py-3 text-[15px] font-bold text-[var(--text)] hover:bg-[var(--line)]"
        >
          취소
        </button>
        <button
          onClick={save}
          disabled={!day || busy}
          className="tappable flex flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[#5b9dff] py-3 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(47,111,237,0.25)] disabled:opacity-40 disabled:shadow-none"
        >
          {busy && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {busy ? "저장 중…" : "저장"}
        </button>
      </div>
    </div>
  );
}
