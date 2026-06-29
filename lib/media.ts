// ============================================================
// 미디어(사진·동영상) 공통 유틸
//
// 백엔드는 이미지 외에 video/mp4(30MB 이하) 업로드를 지원하고,
// 응답에 mediaType(IMAGE/VIDEO)·durationSeconds를 내려준다.
// 길이 제한은 두지 않고(백엔드 스펙=용량 30MB 기준) 표시만 한다.
// ============================================================
import type { Photo } from "./types";

/** 백엔드 스펙: 동영상은 30MB 이하 MP4만 허용 */
export const MAX_VIDEO_BYTES = 30 * 1024 * 1024;

/** 동영상 파일인지 (MP4) — type이 비어 있을 수 있어 확장자도 확인 */
export function isVideoFile(f: File): boolean {
  return f.type === "video/mp4" || /\.mp4$/i.test(f.name);
}

/** 업로드 가능한 미디어(사진 또는 MP4)인지 */
export function isMediaFile(f: File): boolean {
  return (
    f.type.startsWith("image/") ||
    /\.(heic|heif)$/i.test(f.name) ||
    isVideoFile(f)
  );
}

/** 이 게시물이 동영상인지 */
export function isVideoPhoto(p: Photo): boolean {
  return p.mediaType === "VIDEO";
}

/** 초 → m:ss 표기 (없으면 null) */
export function formatDuration(sec?: number): string | null {
  if (sec == null || sec < 0) return null;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
