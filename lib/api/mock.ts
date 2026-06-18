// ============================================================
// dev-only mock (NEXT_PUBLIC_API_BASE_URL 이 없을 때만 사용)
//
// 운영 경로(실서버)와 섞이지 않도록 mock 구현을 이 파일에 격리한다.
// 각 API 모듈은 USE_MOCK 일 때만 여기 함수를 호출한다.
// ============================================================
import type { Affiliation, Photo, Session } from "../types";
import type { Day } from "../event";

// unsplash 단체 사진(수련회 분위기). 다양한 비율로 빔 배치 확인용.
const GROUP_PHOTOS = [
  "1511632765486-a01980e01a18", "1529156069898-49953e39b3ac", "1517457373958-b7bdd4587205",
  "1523580494863-6f3031224c94", "1488521787991-ed7bbaae773c", "1496337589254-7e19d01cec44",
  "1522071820081-009f0129c71c", "1528605248644-14dd04022da1", "1543807535-eceef0bc6599",
  "1531206715517-5c0ba140b2b8", "1509099836639-18ba1795216d", "1506869640319-fe1a24fd76dc",
];
// 단체 사진은 가로가 많음 — 가로 위주로, 일부 정사각/세로 섞음
const SIZES: [number, number][] = [
  [600, 400], [560, 420], [600, 440], [500, 500], [640, 420], [560, 400],
  [600, 460], [520, 420], [640, 400], [480, 480], [600, 420], [560, 440],
];
const COMMENTS = [
  "우리 조 점심 최고였다 🍚", "다 같이 찬양하는데 은혜였어", "조별 게임 우리가 1등!",
  "노을 보면서 기도한 시간", "형들 덕분에 너무 웃겼다 😂", "말씀 나눔 깊었던 밤",
  "단체사진 인생샷 건짐", "새벽기도 끝나고 한 컷", "오이코스 첫 만남!",
  "간식 타임 행복 😋", "물놀이 시원했다", "마지막 밤 다 같이 🙌",
];
// 행사 진행일 — 필터 확인을 위해 골고루 분포(시드 데이터는 day를 명시 보유)
const DAY_CYCLE: Day[] = ["PRE", "DAY1", "DAY1", "DAY2", "DAY2", "DAY3"];

/** 소속 기준 데이터 (관리자 affiliation 조회 / 사용자 소속 후보) */
export const AFFILIATIONS: Affiliation[] = [
  { affiliationKey: "1-1", affiliationName: "1-1", type: "OIKOS" },
  { affiliationKey: "1-2", affiliationName: "1-2", type: "OIKOS" },
  { affiliationKey: "1-3", affiliationName: "1-3", type: "OIKOS" },
  { affiliationKey: "1-4", affiliationName: "1-4", type: "OIKOS" },
  { affiliationKey: "1-5", affiliationName: "1-5", type: "OIKOS" },
  { affiliationKey: "president-team", affiliationName: "회장단", type: "PRESIDENT" },
  { affiliationKey: "worship-team", affiliationName: "예배팀", type: "WORSHIP" },
];

const pUrl = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

// 고정 기준 시각 — SSR/CSR 일관성 위해 Date.now() 사용 안 함
const BASE = Date.parse("2026-06-09T17:00:00+09:00");

const photos: Photo[] = Array.from({ length: 20 }, (_, i) => {
  const [w, h] = SIZES[i % SIZES.length];
  const oikos = `1-${(i % 5) + 1}`;
  return {
    id: `seed-${i}`,
    comment: COMMENTS[i % COMMENTS.length],
    oikosName: oikos,
    affiliationName: oikos,
    day: DAY_CYCLE[i % DAY_CYCLE.length],
    imageUrl: pUrl(GROUP_PHOTOS[i % GROUP_PHOTOS.length], w, h),
    uploadedBy: oikos,
    createdAt: new Date(BASE + i * 7 * 60_000).toISOString(),
    width: w,
    height: h,
  };
});

// 확장형 소속(회장단·예배팀) 사진 — affiliation 필터 확인용
const EXTRA: Photo[] = [
  { name: "회장단", by: "president-1", day: "PRE" as Day, comment: "회장단 사전 준비 사진", photo: 2 },
  { name: "회장단", by: "president-1", day: "DAY1" as Day, comment: "개회 준비 회의 🙌", photo: 5 },
  { name: "예배팀", by: "worship-1", day: "PRE" as Day, comment: "무대 리허설 현장", photo: 7 },
  { name: "예배팀", by: "worship-1", day: "DAY2" as Day, comment: "찬양 연습 마치고 한 컷", photo: 9 },
].map((e, i) => {
  const [w, h] = SIZES[(i + 3) % SIZES.length];
  return {
    id: `extra-${i}`,
    comment: e.comment,
    oikosName: e.name,
    affiliationName: e.name,
    day: e.day,
    imageUrl: pUrl(GROUP_PHOTOS[e.photo], w, h),
    uploadedBy: e.by,
    createdAt: new Date(BASE + (20 + i) * 7 * 60_000).toISOString(),
    width: w,
    height: h,
  };
});

photos.push(...EXTRA);

/** mock 로그인: 아이디에 admin 포함이면 관리자, 그 외 리더 */
export function mockLogin(username: string): Session {
  const isAdmin = username.trim().toLowerCase().includes("admin");
  return {
    token: "mock-token",
    username,
    displayName: username,
    role: isAdmin ? "ADMIN" : "LEADER",
    oikosName: isAdmin ? null : /^\d+-\d+$/.test(username.trim()) ? username.trim() : "1-1",
  };
}

export async function mockGetImages(): Promise<Photo[]> {
  // 공개 갤러리: 숨김 게시물 제외, 최신순
  return photos
    .filter((p) => !p.hidden)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/** 업로드한 사진의 오이코스는 로그인 세션 값 — mock에선 인자로 받아 표시 */
export async function mockUpload(
  comment: string,
  oikosName: string,
  previewUrl: string,
  day: Day,
): Promise<Photo> {
  const now = Date.now();
  const photo: Photo = {
    id: `up-${now}`,
    comment,
    oikosName,
    affiliationName: oikosName,
    day,
    imageUrl: previewUrl,
    uploadedBy: oikosName,
    createdAt: new Date(now).toISOString(),
  };
  photos.unshift(photo);
  return photo;
}

export async function mockDelete(id: string): Promise<void> {
  const i = photos.findIndex((p) => p.id === id);
  if (i !== -1) photos.splice(i, 1);
}
