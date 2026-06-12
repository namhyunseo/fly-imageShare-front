"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FloatingStage } from "@/components/FloatingStage";
import { DisplayControls } from "@/components/DisplayControls";
import { getImages } from "@/lib/api/images";
import { subscribeFeed } from "@/lib/api/display";
import type { Photo } from "@/lib/types";

const CTRL_KEY = "oikos-display-ctrl";

export default function DisplayPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [sizeScale, setSizeScale] = useState(1);
  const [count, setCount] = useState(12);
  const [shuffleMs, setShuffleMs] = useState(6000);

  useEffect(() => {
    getImages().then(setPhotos);

    // 실시간: 새 사진이 올라오면 무대에 합류
    return subscribeFeed((photo) => {
      setPhotos((prev) =>
        prev.some((p) => p.id === photo.id) ? prev : [photo, ...prev],
      );
    });
  }, []);

  // 현장 조절값 복원
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CTRL_KEY);
      if (!saved) return;
      const c = JSON.parse(saved) as {
        sizeScale?: number;
        count?: number;
        shuffleMs?: number;
      };
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (typeof c.sizeScale === "number") setSizeScale(c.sizeScale);
      if (typeof c.count === "number") setCount(c.count);
      if (typeof c.shuffleMs === "number") setShuffleMs(c.shuffleMs);
    } catch {
      /* 무시 */
    }
  }, []);

  function persist(s: number, c: number, sm: number) {
    try {
      localStorage.setItem(
        CTRL_KEY,
        JSON.stringify({ sizeScale: s, count: c, shuffleMs: sm }),
      );
    } catch {
      /* 무시 */
    }
  }
  function updateSize(v: number) {
    setSizeScale(v);
    persist(v, count, shuffleMs);
  }
  function updateCount(v: number) {
    setCount(v);
    persist(sizeScale, v, shuffleMs);
  }
  function updateShuffleMs(v: number) {
    setShuffleMs(v);
    persist(sizeScale, count, v);
  }

  return (
    <section className="relative bg-black">
      {photos.length > 0 && (
        <FloatingStage
          photos={photos}
          sizeScale={sizeScale}
          count={count}
          shuffleMs={shuffleMs}
        />
      )}

      <DisplayControls
        sizeScale={sizeScale}
        count={count}
        maxCount={Math.max(4, photos.length)}
        shuffleMs={shuffleMs}
        onSizeScale={updateSize}
        onCount={updateCount}
        onShuffleMs={updateShuffleMs}
      />

      <Link
        href="/gallery"
        aria-label="나가기"
        className="absolute right-5 top-5 z-[200] flex h-9 w-9 items-center justify-center rounded-full text-[15px] text-white/30 transition hover:bg-white/10 hover:text-white/70"
      >
        ✕
      </Link>
    </section>
  );
}
