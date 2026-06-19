// ============================================================
// dev-only mock (NEXT_PUBLIC_API_BASE_URL 이 없을 때만 사용)
//
// 운영 경로(실서버)와 섞이지 않도록 mock 구현을 이 파일에 격리한다.
// 각 API 모듈은 USE_MOCK 일 때만 여기 함수를 호출한다.
// 소속은 백엔드와 동일하게 affiliation 모델(key/name/type)로 다룬다.
// ============================================================
import type { Affiliation, AdminUser, AffiliationType, Photo, Session, Tag } from "../types";
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
  { affiliationKey: "1-1", affiliationName: "1-1", affiliationType: "OIKOS" },
  { affiliationKey: "1-2", affiliationName: "1-2", affiliationType: "OIKOS" },
  { affiliationKey: "1-3", affiliationName: "1-3", affiliationType: "OIKOS" },
  { affiliationKey: "1-4", affiliationName: "1-4", affiliationType: "OIKOS" },
  { affiliationKey: "1-5", affiliationName: "1-5", affiliationType: "OIKOS" },
  { affiliationKey: "president-team", affiliationName: "회장단", affiliationType: "PRESIDENT" },
  { affiliationKey: "worship-team", affiliationName: "예배팀", affiliationType: "WORSHIP" },
];

/** 소속명 → affiliation 기준 데이터 (mock 보조) */
function affiliationByName(name: string): Affiliation {
  return (
    AFFILIATIONS.find((a) => a.affiliationName === name) ?? {
      affiliationKey: name,
      affiliationName: name,
      affiliationType: "OIKOS",
    }
  );
}

function affiliationByKey(key: string): Affiliation | null {
  return AFFILIATIONS.find((a) => a.affiliationKey === key) ?? null;
}

/** 프로그램 태그 마스터 (TagResponse 정합) */
const tags: Tag[] = [
  { id: "t-1", tagKey: "meal", tagName: "식사", active: true, createdAt: "2026-06-09T00:00:00Z", imageCount: 0 },
  { id: "t-2", tagKey: "worship", tagName: "찬양", active: true, createdAt: "2026-06-09T00:00:00Z", imageCount: 0 },
  { id: "t-3", tagKey: "game", tagName: "게임", active: true, createdAt: "2026-06-09T00:00:00Z", imageCount: 0 },
  { id: "t-4", tagKey: "group", tagName: "조모임", active: true, createdAt: "2026-06-09T00:00:00Z", imageCount: 0 },
  { id: "t-5", tagKey: "rehearsal", tagName: "리허설(미사용)", active: false, createdAt: "2026-06-09T00:00:00Z", imageCount: 0 },
];

function tagByKey(key: string | null): Tag | null {
  return key ? tags.find((t) => t.tagKey === key) ?? null : null;
}

const pUrl = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

// 고정 기준 시각 — SSR/CSR 일관성 위해 Date.now() 사용 안 함
const BASE = Date.parse("2026-06-09T17:00:00+09:00");

// 일부 사진에 프로그램 태그 부여(없는 것도 섞음 — null 케이스 확인)
const TAG_CYCLE: (string | null)[] = ["meal", "worship", null, "game", "group", null];

const photos: Photo[] = Array.from({ length: 20 }, (_, i) => {
  const [w, h] = SIZES[i % SIZES.length];
  const name = `1-${(i % 5) + 1}`;
  const tag = tagByKey(TAG_CYCLE[i % TAG_CYCLE.length]);
  const createdAt = new Date(BASE + i * 7 * 60_000).toISOString();
  return {
    id: `seed-${i}`,
    comment: COMMENTS[i % COMMENTS.length],
    affiliationKey: name,
    affiliationName: name,
    affiliationType: "OIKOS" as AffiliationType,
    tagKey: tag?.tagKey,
    tagName: tag?.tagName,
    day: DAY_CYCLE[i % DAY_CYCLE.length],
    imageUrl: pUrl(GROUP_PHOTOS[i % GROUP_PHOTOS.length], w, h),
    uploadedBy: name,
    createdAt,
    updatedAt: createdAt,
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
  const aff = affiliationByName(e.name);
  return {
    id: `extra-${i}`,
    comment: e.comment,
    affiliationKey: aff.affiliationKey,
    affiliationName: aff.affiliationName,
    affiliationType: aff.affiliationType,
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
  if (isAdmin) {
    return {
      token: "mock-token",
      username,
      displayName: username,
      role: "ADMIN",
      affiliationKey: null,
      affiliationName: null,
      affiliationType: null,
    };
  }
  const name = /^\d+-\d+$/.test(username.trim()) ? username.trim() : "1-1";
  const aff = affiliationByName(name);
  return {
    token: "mock-token",
    username,
    displayName: username,
    role: "LEADER",
    affiliationKey: aff.affiliationKey,
    affiliationName: aff.affiliationName,
    affiliationType: aff.affiliationType,
  };
}

export async function mockGetImages(): Promise<Photo[]> {
  // 공개 갤러리: 숨김 게시물 제외, 최신순
  return photos
    .filter((p) => !p.hidden)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/** 업로드한 사진의 소속은 로그인 세션 값 — mock에선 인자(affiliationName)로 받아 표시 */
export async function mockUpload(
  comment: string,
  affiliationName: string,
  previewUrl: string,
  day: Day,
  tagKey: string | null,
): Promise<Photo> {
  const now = Date.now();
  const aff = affiliationByName(affiliationName);
  const tag = tagByKey(tagKey);
  const photo: Photo = {
    id: `up-${now}`,
    comment,
    affiliationKey: aff.affiliationKey,
    affiliationName: aff.affiliationName,
    affiliationType: aff.affiliationType,
    tagKey: tag?.tagKey,
    tagName: tag?.tagName,
    day,
    imageUrl: previewUrl,
    uploadedBy: affiliationName,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
  };
  photos.unshift(photo);
  return photo;
}

export async function mockGetImage(id: string): Promise<Photo | null> {
  return photos.find((p) => p.id === id) ?? null;
}

/** 사진 수정(코멘트·day·태그·교체 이미지). 업로더 본인 또는 관리자. */
export async function mockUpdate(
  id: string,
  patch: { comment: string; day: Day; tagKey?: string | null; previewUrl?: string },
): Promise<Photo> {
  const p = photos.find((x) => x.id === id);
  if (!p) throw new Error("사진을 찾을 수 없어요.");
  p.comment = patch.comment;
  p.day = patch.day;
  if (patch.tagKey !== undefined) {
    const tag = tagByKey(patch.tagKey);
    p.tagKey = tag?.tagKey;
    p.tagName = tag?.tagName;
  }
  if (patch.previewUrl) p.imageUrl = patch.previewUrl;
  p.updatedAt = new Date(Date.now()).toISOString();
  return p;
}

export async function mockDelete(id: string): Promise<void> {
  const i = photos.findIndex((p) => p.id === id);
  if (i !== -1) photos.splice(i, 1);
}

// ── 관리자(admin) mock ──────────────────────────────────────

function mkUser(
  id: string,
  username: string,
  displayName: string,
  role: AdminUser["role"],
  affName: string | null,
): AdminUser {
  const aff = affName ? affiliationByName(affName) : null;
  return {
    id,
    username,
    displayName,
    role,
    affiliationKey: aff?.affiliationKey ?? null,
    affiliationName: aff?.affiliationName ?? null,
    affiliationType: aff?.affiliationType ?? null,
    active: true,
  };
}

const users: AdminUser[] = [
  mkUser("u-1", "1-1", "1-1", "LEADER", "1-1"),
  mkUser("u-2", "1-2", "1-2", "LEADER", "1-2"),
  mkUser("u-3", "1-3", "1-3", "LEADER", "1-3"),
  mkUser("u-4", "1-4", "1-4", "LEADER", "1-4"),
  mkUser("u-5", "1-5", "1-5", "LEADER", "1-5"),
  mkUser("u-p", "president-1", "회장단 1", "LEADER", "회장단"),
  mkUser("u-w", "worship-1", "예배팀 1", "LEADER", "예배팀"),
  mkUser("u-admin", "admin", "Administrator", "ADMIN", null),
];

/** 관리자 게시물 목록 — 숨김 포함, 최신순 */
export async function mockAdminImages(): Promise<Photo[]> {
  return [...photos].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/** 노출/숨김 토글 (삭제 아님 — 복구 가능) */
export async function mockSetHidden(id: string, hidden: boolean): Promise<Photo> {
  const p = photos.find((x) => x.id === id);
  if (!p) throw new Error("사진을 찾을 수 없어요.");
  p.hidden = hidden;
  return p;
}

export async function mockAdminUsers(): Promise<AdminUser[]> {
  return [...users];
}

/** affiliationKey로 사용자 소속 필드 동기화 */
function applyAffiliation(u: AdminUser, key: string | null) {
  const aff = key ? affiliationByKey(key) : null;
  u.affiliationKey = aff?.affiliationKey ?? null;
  u.affiliationName = aff?.affiliationName ?? null;
  u.affiliationType = aff?.affiliationType ?? null;
}

export async function mockUpdateUser(
  id: string,
  patch: { role?: AdminUser["role"]; affiliationKey?: string | null; displayName?: string },
): Promise<AdminUser> {
  const u = users.find((x) => x.id === id);
  if (!u) throw new Error("사용자를 찾을 수 없어요.");
  if (patch.role !== undefined) u.role = patch.role;
  if (patch.displayName !== undefined) u.displayName = patch.displayName;
  if (patch.affiliationKey !== undefined) applyAffiliation(u, patch.affiliationKey);
  return u;
}

export async function mockCreateUser(input: {
  username: string;
  password: string;
  displayName: string;
  role: AdminUser["role"];
  affiliationKey?: string | null;
  active?: boolean;
}): Promise<AdminUser> {
  if (users.some((u) => u.username === input.username)) {
    throw new Error("이미 존재하는 아이디예요.");
  }
  const u: AdminUser = {
    id: `u-${Date.now()}`,
    username: input.username,
    displayName: input.displayName,
    role: input.role,
    affiliationKey: null,
    affiliationName: null,
    affiliationType: null,
    active: input.active ?? true,
  };
  applyAffiliation(u, input.affiliationKey ?? null);
  users.push(u);
  return u;
}

export async function mockResetPassword(id: string): Promise<void> {
  if (!users.some((u) => u.id === id)) throw new Error("사용자를 찾을 수 없어요.");
  // mock: 비밀번호는 보관하지 않으므로 no-op
}

export async function mockSetUserActive(id: string, active: boolean): Promise<AdminUser> {
  const u = users.find((x) => x.id === id);
  if (!u) throw new Error("사용자를 찾을 수 없어요.");
  u.active = active;
  return u;
}

export async function mockDeleteUser(id: string): Promise<void> {
  const u = users.find((x) => x.id === id);
  if (!u) throw new Error("사용자를 찾을 수 없어요.");
  // 게시물이 있는 계정은 삭제 불가 (백엔드 정책 정합)
  if (photos.some((p) => p.uploadedBy === u.username)) {
    throw new Error("게시물이 있는 계정은 삭제할 수 없어요.");
  }
  const i = users.findIndex((x) => x.id === id);
  if (i !== -1) users.splice(i, 1);
}

export async function mockAffiliations(): Promise<Affiliation[]> {
  return [...AFFILIATIONS];
}

// ── 태그(tag) mock ──────────────────────────────────────────

function tagImageCount(tagKey: string): number {
  return photos.filter((p) => p.tagKey === tagKey).length;
}
function withCount(t: Tag): Tag {
  return { ...t, imageCount: tagImageCount(t.tagKey) };
}

/** 공개 태그 목록 (활성만) */
export async function mockTags(): Promise<Tag[]> {
  return tags.filter((t) => t.active).map(withCount);
}

/** 관리자 태그 목록 (전체) */
export async function mockAdminTags(): Promise<Tag[]> {
  return tags.map(withCount);
}

export async function mockCreateTag(input: {
  tagKey: string;
  tagName: string;
  active?: boolean;
}): Promise<Tag> {
  if (tags.some((t) => t.tagKey === input.tagKey)) {
    throw new Error("이미 존재하는 태그 키예요.");
  }
  const t: Tag = {
    id: `t-${Date.now()}`,
    tagKey: input.tagKey,
    tagName: input.tagName,
    active: input.active ?? true,
    createdAt: new Date(Date.now()).toISOString(),
    imageCount: 0,
  };
  tags.push(t);
  return withCount(t);
}

export async function mockUpdateTag(id: string, tagName: string): Promise<Tag> {
  const t = tags.find((x) => x.id === id);
  if (!t) throw new Error("태그를 찾을 수 없어요.");
  t.tagName = tagName;
  return withCount(t);
}

export async function mockSetTagStatus(id: string, active: boolean): Promise<Tag> {
  const t = tags.find((x) => x.id === id);
  if (!t) throw new Error("태그를 찾을 수 없어요.");
  t.active = active;
  return withCount(t);
}

export async function mockDeleteTag(id: string): Promise<void> {
  const t = tags.find((x) => x.id === id);
  if (!t) throw new Error("태그를 찾을 수 없어요.");
  if (tagImageCount(t.tagKey) > 0) {
    throw new Error("사용 중인 태그는 삭제할 수 없어요.");
  }
  const i = tags.findIndex((x) => x.id === id);
  if (i !== -1) tags.splice(i, 1);
}
