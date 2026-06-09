"use client";

import { useEffect, useState } from "react";
import { PhotoModal } from "@/components/PhotoModal";
import { SmartImg } from "@/components/SmartImg";
import { getPhotos, oikosName } from "@/lib/data";
import type { Photo } from "@/lib/types";

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selected, setSelected] = useState<Photo | null>(null);
  const [nowMs, setNowMs] = useState(0);

  useEffect(() => {
    getPhotos().then(setPhotos);
    setNowMs(Date.now());
  }, []);

  return (
    <div className="mx-auto max-w-[460px] px-[18px] pb-[60px] pt-[22px]">
      <div className="mb-3.5 flex items-baseline justify-between">
        <h1 className="text-[22px] font-semibold tracking-tight">갤러리</h1>
        <span className="text-[13px] text-[var(--muted)]">
          사진 {photos.length}
        </span>
      </div>
      <p className="mb-3.5 text-[13.5px] text-[var(--muted)]">
        최신순 · 탭하면 코멘트와 오이코스를 볼 수 있어요.
      </p>

      {/* 인스타 릴스 피드 스타일 — 세로 직사각 3열, 촘촘, 하단 텍스트 오버레이 */}
      <div className="-mx-[18px] grid grid-cols-3 gap-0.5">
        {photos.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            className="relative aspect-[4/5] overflow-hidden bg-[var(--bg-soft)]"
          >
            <SmartImg
              src={p.url}
              fallback={p.fallbackUrl}
              className="h-full w-full object-cover"
            />
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2 text-left">
              <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                {p.comment}
              </p>
              <span className="mt-1 inline-block text-[10px] font-bold text-[var(--accent)] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                {oikosName(p.oikosId)}
              </span>
            </div>
          </button>
        ))}
      </div>

      <PhotoModal
        photo={selected}
        nowMs={nowMs}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
