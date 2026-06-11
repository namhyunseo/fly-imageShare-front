"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FloatingStage } from "@/components/FloatingStage";
import { getPhotos, subscribeFeed } from "@/lib/data";
import type { Photo } from "@/lib/types";

export default function DisplayPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    getPhotos().then(setPhotos);

    // 실시간: 새 사진이 올라오면 무대에 합류
    return subscribeFeed((photo) => {
      setPhotos((prev) =>
        prev.some((p) => p.id === photo.id) ? prev : [photo, ...prev],
      );
    });
  }, []);

  return (
    <section className="relative bg-black">
      {photos.length > 0 && <FloatingStage photos={photos} />}

      <Link
        href="/gallery"
        aria-label="나가기"
        className="absolute right-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full text-[15px] text-white/30 transition hover:bg-white/10 hover:text-white/70"
      >
        ✕
      </Link>
    </section>
  );
}
