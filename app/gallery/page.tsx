"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PhotoModal } from "@/components/PhotoModal";
import { SmartImg } from "@/components/SmartImg";
import { deleteImage, getImages } from "@/lib/api/images";
import { subscribeFeed } from "@/lib/api/display";
import { imageSrc } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { IconGallery, IconUpload } from "@/components/icons";
import { canPost } from "@/lib/types";
import type { Photo } from "@/lib/types";

/** 스토리 뷰어 대상 — 보여줄 사진 목록과 현재 위치.
 *  story=true면 진행 바를 오이코스 단위로 표시(meta 사용). */
type Viewer = { list: Photo[]; index: number; story: boolean };

export default function GalleryPage() {
  const { session, role } = useAuth();
  const allowed = role !== null && canPost(role);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [nowMs, setNowMs] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getImages()
      .then((ps) => {
        setPhotos(ps);
        setNowMs(Date.now());
      })
      .finally(() => setLoading(false));

    // 실시간: 새 사진이 올라오면 맨 앞에 추가 (중복 제거)
    return subscribeFeed((photo) => {
      setPhotos((prev) =>
        prev.some((p) => p.id === photo.id) ? prev : [photo, ...prev],
      );
    });
  }, []);

  // 오이코스별 그룹 (최근 활동 순). 스토리는 오래된→최신으로 재생.
  const groups = useMemo(() => {
    const map = new Map<string, Photo[]>();
    for (const p of photos) {
      const arr = map.get(p.oikosName);
      if (arr) arr.push(p);
      else map.set(p.oikosName, [p]);
    }
    return Array.from(map, ([oikos, ps]) => ({
      oikos,
      cover: ps[0], // 최신 사진을 커버로
      story: [...ps].reverse(), // 오래된→최신
      latest: Date.parse(ps[0].createdAt),
    })).sort((a, b) => b.latest - a.latest);
  }, [photos]);

  // 모든 오이코스 스토리를 하나의 연속 트랙으로 이어붙임.
  // → 오이코스 경계도 "바로 옆 페이지"라 한 장 슬라이드로 부드럽게 전환.
  const flat = useMemo(() => {
    const list: Photo[] = [];
    const meta: { count: number; active: number }[] = []; // 현재 오이코스 진행 바용
    const groupStart: number[] = []; // 각 오이코스 첫 사진의 전역 인덱스
    for (const g of groups) {
      groupStart.push(list.length);
      g.story.forEach((p, j) => {
        list.push(p);
        meta.push({ count: g.story.length, active: j });
      });
    }
    return { list, meta, groupStart };
  }, [groups]);

  async function handleDelete(id: string) {
    await deleteImage(id, session?.token ?? null);
    setViewer(null);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="mx-auto max-w-[460px] px-[18px] pb-[calc(80px+env(safe-area-inset-bottom))] pt-[22px]">
      <div className="mb-4">
        <h1 className="text-[26px] font-bold tracking-tight">갤러리</h1>
        {!loading && photos.length > 0 && (
          <p className="mt-1 text-[13px] text-[var(--muted)]">
            {photos.length}개의 순간 · 최신순
          </p>
        )}
      </div>

      {/* 오이코스별 스토리 링 — 가로 스크롤, 누르면 그 오이코스 스토리 재생 */}
      {!loading && groups.length > 0 && (
        <div className="-mx-[18px] mb-5 flex gap-3 overflow-x-auto px-[18px] pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {groups.map((g, gi) => (
            <button
              key={g.oikos}
              onClick={() =>
                setViewer({
                  list: flat.list,
                  index: flat.groupStart[gi],
                  story: true,
                })
              }
              className="tappable flex shrink-0 flex-col items-center gap-1.5"
            >
              <span className="block rounded-full bg-gradient-to-tr from-[var(--accent)] to-[var(--accent2)] p-[2px]">
                <span className="block rounded-full bg-[var(--bg)] p-[2px]">
                  <SmartImg
                    src={imageSrc(g.cover.imageUrl)}
                    className="block h-[52px] w-[52px] rounded-full object-cover"
                  />
                </span>
              </span>
              <span className="max-w-[60px] truncate text-[11px] font-semibold text-[var(--text)]">
                {g.oikos}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 로딩 — 스켈레톤 그리드 */}
      {loading && (
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] animate-pulse rounded-xl bg-[var(--bg-soft)]"
            />
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && photos.length === 0 && (
        <div className="animate-fade-up mt-20 flex flex-col items-center text-center">
          <div className="mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-[var(--bg-soft)] text-[var(--muted)]">
            <IconGallery className="h-9 w-9" />
          </div>
          <p className="text-[15px] font-semibold text-[var(--text)]">
            아직 올라온 사진이 없어요
          </p>
          <p className="mt-1 text-[13px] text-[var(--muted)]">
            첫 순간을 올려 갤러리를 채워보세요.
          </p>
          {allowed && (
            <Link
              href="/upload"
              className="tappable mt-5 flex items-center gap-2 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[#5b9dff] px-5 py-2.5 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(47,111,237,0.25)]"
            >
              <IconUpload className="h-[18px] w-[18px]" />
              사진 올리기
            </Link>
          )}
        </div>
      )}

      {/* 둥근 카드 그리드 — 세로 직사각 3열, 호버 줌, 오이코스 칩 */}
      {!loading && photos.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setViewer({ list: photos, index: i, story: false })}
              style={{ animationDelay: `${Math.min(i, 11) * 28}ms` }}
              className="tappable animate-fade-up group relative aspect-[4/5] overflow-hidden rounded-xl bg-[var(--bg-soft)]"
            >
              <SmartImg
                src={imageSrc(p.imageUrl)}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
              <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                {p.oikosName}
              </span>
            </button>
          ))}
        </div>
      )}

      <PhotoModal
        photos={viewer?.list ?? []}
        index={viewer?.index ?? null}
        progress={
          viewer?.story ? flat.meta[viewer.index] : undefined
        }
        nowMs={nowMs}
        onClose={() => setViewer(null)}
        onIndexChange={(i) =>
          setViewer((v) => (v ? { ...v, index: i } : v))
        }
        onEnd={viewer?.story ? () => setViewer(null) : undefined}
        onDelete={handleDelete}
      />
    </div>
  );
}
