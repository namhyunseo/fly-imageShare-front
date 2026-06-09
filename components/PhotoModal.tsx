"use client";

import { useEffect } from "react";
import { SmartImg } from "./SmartImg";
import { oikosName } from "@/lib/data";
import { relTime } from "@/lib/format";
import type { Photo } from "@/lib/types";

export function PhotoModal({
  photo,
  nowMs,
  onClose,
}: {
  photo: Photo | null;
  nowMs: number;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!photo) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photo, onClose]);

  if (!photo) return null;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[200] grid place-items-center bg-[rgba(5,5,12,0.82)] p-5 backdrop-blur-sm"
    >
      <button
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-4 top-4 z-[210] h-[38px] w-[38px] rounded-full border border-[var(--line)] bg-[rgba(20,20,40,0.8)] text-[18px] text-white"
      >
        ✕
      </button>
      <div className="w-full max-w-[380px] overflow-hidden rounded-[18px] border border-[var(--line)] bg-[var(--card)] shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
        <SmartImg
          src={photo.url}
          fallback={photo.fallbackUrl}
          className="block h-[300px] w-full object-cover"
        />
        <div className="px-[18px] pb-5 pt-4">
          <span className="mb-2.5 inline-block rounded-full bg-[var(--accent)] px-2.5 py-[3px] text-[11.5px] font-bold text-[#1a1530]">
            {oikosName(photo.oikosId)}
          </span>
          <p className="mb-1.5 text-[15px] leading-relaxed">{photo.comment}</p>
          <p className="text-[12px] text-[var(--muted)]">
            {relTime(photo.createdAt, nowMs)}
          </p>
        </div>
      </div>
    </div>
  );
}
