// ============================================================
// 데이터 접근 레이어 (mock/real 토글)
//
// USE_MOCK이면 메모리 mock, 아니면 백엔드 API를 호출한다.
// 화면은 이 모듈의 async 함수만 호출하므로, 백엔드가 떠 있으면
// NEXT_PUBLIC_API_BASE_URL만 채워도 실연동으로 전환된다.
// 백엔드 계약: GET /images, POST /images(multipart), DELETE /images/{id},
//             SSE GET /display/feed (event: image-created)
// ============================================================
import { USE_MOCK, apiBase, apiFetch } from "./api";
import type { NewPhoto, Photo } from "./types";

/** 백엔드 ImageResponse (계약) */
interface ImageResponse {
  id: number;
  comment: string;
  groupName: string;
  imageUrl: string;
  contentType?: string;
  uploadedBy?: string;
  createdAt: string;
}

/** 백엔드 응답 → 프론트 Photo */
function mapImage(r: ImageResponse): Photo {
  return {
    id: String(r.id),
    comment: r.comment,
    groupName: r.groupName,
    imageUrl: r.imageUrl,
    uploadedBy: r.uploadedBy,
    createdAt: r.createdAt,
  };
}

/**
 * 오이코스(그룹) 식별자 목록. 백엔드에 그룹 목록 조회 API가 없어
 * 시딩값(1-1~1-5)을 하드코딩한다. 백엔드 시딩이 바뀌면 수동 동기화 필요(#5).
 */
export const GROUPS = ["1-1", "1-2", "1-3", "1-4", "1-5"];

// ------------------------------------------------------------
// mock 저장소
// ------------------------------------------------------------
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
const pUrl = (i: number, w: number, h: number) => `https://picsum.photos/seed/oikos${i}/${w}/${h}`;

// 고정 기준 시각(2026 수련회) — SSR/CSR 일관성 위해 Date.now() 사용 안 함
const BASE = Date.parse("2026-06-09T17:00:00+09:00");

const mockPhotos: Photo[] = Array.from({ length: 12 }, (_, i) => ({
  id: `seed-${i}`,
  imageUrl: uUrl(UNSPLASH[i % UNSPLASH.length], 600, 450),
  fallbackUrl: pUrl(i, 600, 450),
  groupName: `1-${(i % 5) + 1}`,
  comment: COMMENTS[i % COMMENTS.length],
  createdAt: new Date(BASE + i * 7 * 60_000).toISOString(),
}));

// ------------------------------------------------------------
// 공개 API
// ------------------------------------------------------------

/** 최신순 사진 목록 (GET /images, 토큰 불필요 — 공개) */
export async function getPhotos(): Promise<Photo[]> {
  if (USE_MOCK) {
    return [...mockPhotos].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }
  const list = await apiFetch<ImageResponse[]>("/images");
  return list.map(mapImage);
}

/** 사진 게시 (POST /images multipart, 리더·관리자) */
export async function addPhoto(
  input: NewPhoto,
  file: File | null,
  token: string | null,
  mockPreviewUrl?: string,
): Promise<Photo> {
  if (USE_MOCK) {
    const now = Date.now();
    const photo: Photo = {
      id: `up-${now}`,
      comment: input.comment,
      groupName: input.groupName,
      imageUrl: mockPreviewUrl ?? "",
      createdAt: new Date(now).toISOString(),
    };
    mockPhotos.unshift(photo);
    return photo;
  }
  if (!file) throw new Error("업로드할 파일이 없습니다.");
  const form = new FormData();
  form.append("file", file);
  form.append("groupName", input.groupName);
  form.append("comment", input.comment);
  const created = await apiFetch<ImageResponse>("/images", {
    method: "POST",
    formData: form,
    token,
  });
  return mapImage(created);
}

/** 사진 삭제 (DELETE /images/{id}, 관리자 전용) */
export async function deletePhoto(id: string, token: string | null): Promise<void> {
  if (USE_MOCK) {
    const i = mockPhotos.findIndex((p) => p.id === id);
    if (i !== -1) mockPhotos.splice(i, 1);
    return;
  }
  await apiFetch<void>(`/images/${id}`, { method: "DELETE", token, noContent: true });
}

/**
 * 실시간 피드 구독 (SSE GET /display/feed, event: image-created).
 * 새 사진이 올라오면 onPhoto 콜백. 반환값은 구독 해제 함수.
 * mock 모드에서는 no-op (해제 함수만 반환).
 */
export function subscribeFeed(onPhoto: (photo: Photo) => void): () => void {
  if (USE_MOCK || typeof window === "undefined") return () => {};
  const es = new EventSource(apiBase() + "/display/feed");
  const handler = (e: MessageEvent) => {
    try {
      onPhoto(mapImage(JSON.parse(e.data) as ImageResponse));
    } catch {
      /* 파싱 실패 무시 */
    }
  };
  es.addEventListener("image-created", handler as EventListener);
  return () => es.close();
}
