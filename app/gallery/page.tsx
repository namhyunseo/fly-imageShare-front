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
import { canPost, affiliationOf } from "@/lib/types";
import { isVideoPhoto, formatDuration } from "@/lib/media";
import type { Photo } from "@/lib/types";
import { DAYS, DAY_LABEL, type Day } from "@/lib/event";

export default function GalleryPage() {
  const { session, role } = useAuth();
  const allowed = role !== null && canPost(role);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [index, setIndex] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(0);
  const [loading, setLoading] = useState(true);

  // 두 축 필터: 소속(affiliation) × 행사일(day). 둘 다 미선택이면 전체 조회.
  const [affil, setAffil] = useState<string | null>(null);
  const [day, setDay] = useState<Day | null>(null);

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

  // 상단 affiliation 필터 후보 — 사진에 등장한 소속을 모아, 숫자 오이코스 먼저.
  // 각 소속의 최신 사진을 커버로 사용.
  const affiliations = useMemo(() => {
    const map = new Map<string, Photo>();
    for (const p of photos) {
      const name = affiliationOf(p);
      if (!map.has(name)) map.set(name, p); // photos는 최신순 → 첫 등장이 최신
    }
    const isOikos = (n: string) => /^\d+-\d+$/.test(n);
    return Array.from(map, ([name, cover]) => ({ name, cover })).sort((a, b) => {
      const ao = isOikos(a.name);
      const bo = isOikos(b.name);
      if (ao !== bo) return ao ? -1 : 1; // 오이코스 먼저
      return a.name.localeCompare(b.name, "ko");
    });
  }, [photos]);

  // 필터 적용 결과 (소속 AND 행사일)
  const filtered = useMemo(
    () =>
      photos.filter(
        (p) =>
          (affil === null || affiliationOf(p) === affil) &&
          (day === null || p.day === day),
      ),
    [photos, affil, day],
  );

  async function handleDelete(id: string) {
    await deleteImage(id, session?.token ?? null);
    setIndex(null);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="mx-auto max-w-[460px] px-[18px] pb-[calc(80px+env(safe-area-inset-bottom))] pt-[22px]">
      <div className="mb-4">
        <h1 className="text-[26px] font-bold tracking-tight">갤러리</h1>
        {!loading && photos.length > 0 && (
          <p className="mt-1 text-[13px] text-[var(--muted)]">
            {filtered.length}개의 순간 · 최신순
          </p>
        )}
      </div>

      {/* 소속 필터 — 가로 스크롤 원형 버튼. 선택을 다시 누르면 전체로. */}
      {!loading && affiliations.length > 0 && (
        <div className="-mx-[18px] mb-3 flex gap-3 overflow-x-auto px-[18px] pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {affiliations.map((a) => {
            const on = affil === a.name;
            return (
              <button
                key={a.name}
                onClick={() => setAffil(on ? null : a.name)}
                className="tappable flex shrink-0 flex-col items-center gap-1.5"
              >
                <span
                  className={`block rounded-full p-[2px] transition ${
                    on
                      ? "bg-gradient-to-tr from-[var(--accent)] to-[var(--accent2)]"
                      : "bg-[var(--line)]"
                  }`}
                >
                  <span className="block rounded-full bg-[var(--bg)] p-[2px]">
                    <SmartImg
                      src={imageSrc(a.cover.thumbnailUrl ?? a.cover.imageUrl)}
                      className={`block h-[52px] w-[52px] rounded-full object-cover transition ${
                        on ? "" : "opacity-85"
                      }`}
                    />
                  </span>
                </span>
                <span
                  className={`max-w-[60px] truncate text-[11px] font-semibold ${
                    on ? "text-[var(--accent)]" : "text-[var(--text)]"
                  }`}
                >
                  {a.name}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 행사일 탭 — 아무것도 선택 안 한 상태가 곧 전체 조회. */}
      {!loading && photos.length > 0 && (
        <div className="mb-5 grid grid-cols-4 gap-1.5">
          {DAYS.map((d) => {
            const on = day === d;
            return (
              <button
                key={d}
                onClick={() => setDay(on ? null : d)}
                className={`tappable rounded-lg border py-1.5 text-[12px] font-bold transition ${
                  on
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : "border-[var(--line)] bg-[var(--bg-soft)] text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                {DAY_LABEL[d]}
              </button>
            );
          })}
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

      {/* 빈 상태 — 사진이 아예 없을 때 */}
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

      {/* 필터 결과 없음 */}
      {!loading && photos.length > 0 && filtered.length === 0 && (
        <div className="animate-fade-up mt-16 flex flex-col items-center text-center">
          <p className="text-[14px] font-semibold text-[var(--text)]">
            이 조건의 사진이 없어요
          </p>
          <button
            onClick={() => {
              setAffil(null);
              setDay(null);
            }}
            className="tappable mt-3 rounded-full border border-[var(--line)] bg-[var(--bg-soft)] px-4 py-2 text-[12.5px] font-semibold text-[var(--text)] hover:bg-[var(--line)]"
          >
            필터 초기화
          </button>
        </div>
      )}

      {/* 둥근 카드 그리드 — 세로 직사각 3열, 호버 줌, 소속 칩 */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {filtered.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setIndex(i)}
              style={{ animationDelay: `${Math.min(i, 11) * 28}ms` }}
              className="tappable animate-fade-up group relative aspect-[4/5] overflow-hidden rounded-xl bg-[var(--bg-soft)]"
            >
              {/* 동영상은 첫 프레임을 <video>로 보여준다 (서버 썸네일이 placeholder일 수 있어 원본 사용). */}
              {isVideoPhoto(p) ? (
                <video
                  src={imageSrc(p.imageUrl) + "#t=0.1"}
                  preload="metadata"
                  muted
                  playsInline
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                />
              ) : (
                <SmartImg
                  src={imageSrc(p.thumbnailUrl ?? p.imageUrl)}
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                />
              )}
              {/* 동영상: 중앙 재생 아이콘 + 우상단 길이 배지 */}
              {isVideoPhoto(p) && (
                <>
                  <span className="pointer-events-none absolute inset-0 grid place-items-center">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-black/45 backdrop-blur-sm">
                      <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 fill-white" aria-hidden="true">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                  {formatDuration(p.durationSeconds) && (
                    <span className="pointer-events-none absolute right-1.5 top-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                      {formatDuration(p.durationSeconds)}
                    </span>
                  )}
                </>
              )}
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
              <span className="pointer-events-none absolute bottom-1.5 left-1.5 flex items-center gap-1">
                <span className="rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                  {affiliationOf(p)}
                </span>
                {p.day && (
                  <span className="rounded-full bg-[var(--accent)]/80 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                    {DAY_LABEL[p.day]}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      <PhotoModal
        photos={filtered}
        index={index}
        nowMs={nowMs}
        onClose={() => setIndex(null)}
        onIndexChange={setIndex}
        onDelete={handleDelete}
      />
    </div>
  );
}
