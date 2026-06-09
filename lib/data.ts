// ============================================================
// 데이터 접근 레이어 (mock)
//
// 화면은 이 모듈의 async 함수만 호출한다. 추후 Supabase 연동 시
// 함수 본문만 쿼리로 교체하면 화면 코드는 그대로 동작한다.
// (예: getPhotos → supabase.from("photos").select())
// ============================================================
import type { NewPhoto, Oikos, Photo } from "./types";

export const OIKOS: Oikos[] = [
  { id: "1", name: "1조 소망" },
  { id: "2", name: "2조 사랑" },
  { id: "3", name: "3조 기쁨" },
  { id: "4", name: "4조 평강" },
  { id: "5", name: "5조 은혜" },
];

export function oikosName(id: string): string {
  return OIKOS.find((o) => o.id === id)?.name ?? "오이코스";
}

// --- 샘플 이미지 (Unsplash 직링크, 깨지면 picsum 대체) ---
const UNSPLASH = [
  "1506744038136-46273834b3fb", "1501785888041-af3ef285b470", "1470770841072-f978cf4d019e",
  "1441974231531-c6227db76b6e", "1469474968028-56623f02e42e", "1454496522488-7a8e488e8606",
  "1504280390367-361c6d9f38f4", "1517524008697-84bbe3c3fd98", "1488646953014-85cb44e25828",
  "1476611317561-60117649dd94", "1473773508845-188df298d2d1", "1519681393784-d120267933ba",
];
const COMMENTS = [
  "우리 조 점심 최고였다 🍚", "다 같이 찬양하는데 은혜였어", "조별 게임 우리가 1등!",
  "노을 보면서 기도한 시간", "형들 덕분에 너무 웃겼다 😂", "말씀 나눔 깊었던 밤",
  "단체사진 인생샷 건짐", "새벽기도 끝나고 한 컷", "오이코스 첫 만남!",
  "간식 타임 행복 😋", "물놀이 시원했다", "마지막 밤 다 같이 🙌",
];

const uUrl = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
const pUrl = (i: number, w: number, h: number) =>
  `https://picsum.photos/seed/oikos${i}/${w}/${h}`;

// 고정 기준 시각(2026 수련회) — SSR/CSR 일관성 위해 Date.now() 사용 안 함
const BASE = Date.parse("2026-06-09T17:00:00+09:00");

// 모듈 스코프 in-memory 저장소 (mock). 업로드가 여기에 쌓인다.
const photos: Photo[] = Array.from({ length: 12 }, (_, i) => ({
  id: `seed-${i}`,
  url: uUrl(UNSPLASH[i % UNSPLASH.length], 600, 450),
  fallbackUrl: pUrl(i, 600, 450),
  oikosId: OIKOS[i % OIKOS.length].id,
  comment: COMMENTS[i % COMMENTS.length],
  createdAt: new Date(BASE + i * 7 * 60_000).toISOString(),
}));

/** 최신순 사진 목록 */
export async function getPhotos(): Promise<Photo[]> {
  return [...photos].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

/** 사진 게시 (mock: 메모리에 추가) */
export async function addPhoto(input: NewPhoto, createdAtMs: number): Promise<Photo> {
  const photo: Photo = {
    id: `up-${createdAtMs}`,
    ...input,
    createdAt: new Date(createdAtMs).toISOString(),
  };
  photos.unshift(photo);
  return photo;
}
