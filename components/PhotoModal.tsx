"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SmartImg } from "./SmartImg";
import { imageSrc } from "@/lib/api/client";
import { relTime } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { IconClose, IconTrash, IconEdit } from "./icons";
import { affiliationOf, canManagePhoto } from "@/lib/types";
import { isVideoPhoto } from "@/lib/media";
import { DAY_LABEL } from "@/lib/event";
import type { Photo } from "@/lib/types";

// 인스타 스토리식 뷰어 — 풀스크린, 가로 스와이프/탭으로 이전·다음.
export function PhotoModal({
  photos,
  index,
  nowMs,
  progress,
  onClose,
  onIndexChange,
  onEnd,
  onStart,
  onDelete,
}: {
  photos: Photo[];
  /** 현재 보고 있는 사진의 인덱스. null이면 닫힘 */
  index: number | null;
  /** 진행 바 표시 기준(스토리 모드). 없으면 전체 목록 기준 */
  progress?: { count: number; active: number };
  nowMs: number;
  onClose: () => void;
  /** 이전/다음 사진으로 이동 */
  onIndexChange: (i: number) => void;
  /** 마지막 사진에서 더 넘기면 (스토리 끝 → 닫기 등) */
  onEnd?: () => void;
  /** 첫 사진에서 뒤로 넘기면 */
  onStart?: () => void;
  /** 삭제 실행. 업로더 본인·관리자에게만 노출. */
  onDelete?: (id: string) => void;
}) {
  const { role, session } = useAuth();
  const router = useRouter();
  const drag = useRef<{ startX: number; dx: number; moved: boolean } | null>(
    null,
  );
  const wheelLock = useRef(false);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  // Esc 닫기 / ← → 이전·다음 (끝에선 onEnd/onStart로 오이코스 전환)
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") {
        if (index > 0) onIndexChange(index - 1);
        else onStart?.();
      } else if (e.key === "ArrowRight") {
        if (index < photos.length - 1) onIndexChange(index + 1);
        else onEnd?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, photos.length, onClose, onIndexChange, onEnd, onStart]);

  if (index === null || !photos[index]) return null;

  const cur = index; // 가드 이후 non-null 고정
  const photo = photos[cur];
  const hasPrev = cur > 0;
  const hasNext = cur < photos.length - 1;
  // 사진이 없어도 이전/다음 오이코스로 갈 수 있으면 진행 가능
  const canPrev = hasPrev || !!onStart;
  const canNext = hasNext || !!onEnd;
  const TH = 55; // 스냅 임계값(px)
  // 진행 바: 스토리 모드면 현재 오이코스 기준, 아니면 전체 목록 기준
  const segCount = progress?.count ?? photos.length;
  const segActive = progress?.active ?? cur;

  // 다음으로(다음 사진 또는 다음 오이코스)
  function goNext() {
    if (hasNext) onIndexChange(cur + 1);
    else onEnd?.();
  }
  // 이전으로(이전 사진 또는 이전 오이코스)
  function goPrev() {
    if (hasPrev) onIndexChange(cur - 1);
    else onStart?.();
  }

  function onTouchStart(e: React.TouchEvent) {
    drag.current = { startX: e.touches[0].clientX, dx: 0, moved: false };
    setDragging(true);
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!drag.current) return;
    let dx = e.touches[0].clientX - drag.current.startX;
    if (Math.abs(dx) > 8) drag.current.moved = true;
    // 더 갈 곳이 없을 때만 고무줄처럼 저항
    if ((!canPrev && dx > 0) || (!canNext && dx < 0)) dx *= 0.3;
    drag.current.dx = dx;
    setOffset(dx);
  }
  function onTouchEnd() {
    if (!drag.current) return;
    const dx = drag.current.dx;
    drag.current = null;
    setDragging(false);
    setOffset(0);
    if (dx <= -TH) goNext();
    else if (dx >= TH) goPrev();
  }

  // 탭 영역(좌/우) — 드래그였으면 무시
  function tap(dir: -1 | 1) {
    if (drag.current?.moved) return;
    if (dir === 1) goNext();
    else goPrev();
  }

  function onWheel(e: React.WheelEvent) {
    if (wheelLock.current) return;
    const d = e.deltaX || e.deltaY;
    if (d > 20 && canNext) {
      wheelLock.current = true;
      goNext();
      setTimeout(() => (wheelLock.current = false), 380);
    } else if (d < -20 && canPrev) {
      wheelLock.current = true;
      goPrev();
      setTimeout(() => (wheelLock.current = false), 380);
    }
  }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onWheel={onWheel}
      className="animate-fade-up fixed inset-0 z-[200] select-none overflow-hidden bg-black"
      style={{ touchAction: "none" }}
    >
      {/* 가로 트랙 — 모든 사진이 하나로 이어져 있어 오이코스 경계도 한 장 슬라이드 */}
      <div
        className="flex h-full"
        style={{
          transform: `translateX(calc(${-cur * 100}% + ${offset}px))`,
          transition: dragging
            ? "none"
            : "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
          willChange: "transform",
        }}
      >
        {photos.map((p, i) => (
          <div
            key={p.id}
            className="relative flex h-full w-full shrink-0 items-center justify-center overflow-hidden"
          >
            {/* 앰비언트 배경 — 동영상은 정지 썸네일을 블러로 (영상은 img로 못 띄움) */}
            <SmartImg
              src={imageSrc(
                isVideoPhoto(p) ? (p.thumbnailUrl ?? p.imageUrl) : p.imageUrl,
              )}
              className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-2xl"
            />
            <span className="pointer-events-none absolute inset-0 bg-black/35" />
            {isVideoPhoto(p) ? (
              i === cur ? (
                // 현재 슬라이드 동영상만 재생. 자동재생 정책상 muted 시작 + controls로 소리.
                <video
                  src={imageSrc(p.imageUrl)}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  className="relative z-10 max-h-full max-w-full object-contain"
                />
              ) : (
                <SmartImg
                  src={imageSrc(p.thumbnailUrl ?? p.imageUrl)}
                  className="relative max-h-full max-w-full object-contain"
                />
              )
            ) : (
              <SmartImg
                src={imageSrc(p.imageUrl)}
                className="relative max-h-full max-w-full object-contain"
              />
            )}
          </div>
        ))}
      </div>

      {/* 탭 영역: 왼쪽=이전, 오른쪽=다음 (상단 바·하단 정보 영역은 제외) */}
      <button
        aria-label="이전 사진"
        onClick={() => tap(-1)}
        className="absolute bottom-32 left-0 top-16 z-10 w-1/3"
      />
      <button
        aria-label="다음 사진"
        onClick={() => tap(1)}
        className="absolute bottom-32 right-0 top-16 z-10 w-2/3"
      />

      {/* 상단: 진행 바(풀폭) + 닫기(아래 줄, 우측) */}
      <div className="absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/45 via-black/15 to-transparent px-3.5 pb-10 pt-[calc(env(safe-area-inset-top)+11px)]">
        {segCount <= 30 ? (
          <div className="flex gap-1">
            {Array.from({ length: segCount }).map((_, i) => (
              <span
                key={i}
                className={`h-[2.5px] flex-1 rounded-full shadow-[0_0_3px_rgba(0,0,0,0.35)] transition-colors ${
                  i <= segActive ? "bg-white" : "bg-white/35"
                }`}
              />
            ))}
          </div>
        ) : (
          <div className="text-right text-[12px] font-semibold text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
            {segActive + 1} / {segCount}
          </div>
        )}
        <div className="mt-3 flex justify-end">
          <button
            onClick={onClose}
            aria-label="닫기"
            className="tappable -mr-1 grid h-8 w-8 place-items-center rounded-full text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] hover:bg-white/15"
          >
            <IconClose className="h-[20px] w-[20px]" />
          </button>
        </div>
      </div>

      {/* 하단: 오이코스 · 코멘트 · 시간 (현재 사진) */}
      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+18px)] pt-12">
        <span className="mb-2 inline-flex items-center gap-1.5">
          <span className="rounded-full bg-[var(--accent)] px-2.5 py-[3px] text-[11.5px] font-bold text-white">
            {affiliationOf(photo)}
          </span>
          {photo.day && (
            <span className="rounded-full bg-white/20 px-2.5 py-[3px] text-[11.5px] font-bold text-white backdrop-blur-sm">
              {DAY_LABEL[photo.day]}
            </span>
          )}
        </span>
        <p className="break-keep text-[16px] font-medium leading-relaxed text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]">
          {photo.comment}
        </p>
        <p className="mt-1 text-[12px] text-white/70">
          {relTime(photo.createdAt, nowMs)}
        </p>

        {/* 관리 액션 — 업로더 본인·관리자에게만 노출 */}
        {canManagePhoto(photo, session, role) && (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                router.push(`/edit/${photo.id}`);
              }}
              className="tappable flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-[12.5px] font-bold text-white backdrop-blur-sm hover:bg-white/20"
            >
              <IconEdit className="h-[16px] w-[16px]" />
              수정하기
            </button>
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm("이 사진을 삭제할까요? 되돌릴 수 없어요.")) {
                    onDelete(photo.id);
                  }
                }}
                className="tappable flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-[12.5px] font-bold text-white backdrop-blur-sm hover:bg-white/20"
              >
                <IconTrash className="h-[16px] w-[16px]" />
                삭제하기
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
