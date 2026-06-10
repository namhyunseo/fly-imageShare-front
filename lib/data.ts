// ============================================================
// 데이터 접근 레이어 (백엔드 실연동)
//
// 화면은 이 모듈의 함수만 호출한다. 백엔드 계약:
//   GET /images, POST /images(multipart), DELETE /images/{id},
//   SSE GET /display/feed (event: image-created)
// ============================================================
import { apiBase, apiFetch } from "./api";
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
  width?: number;
  height?: number;
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
    width: r.width,
    height: r.height,
  };
}

/**
 * 오이코스(그룹) 식별자 목록. 백엔드에 그룹 목록 조회 API가 없어
 * 시딩값(1-1~1-5)을 하드코딩한다. 백엔드 시딩이 바뀌면 수동 동기화 필요(#5).
 */
export const GROUPS = ["1-1", "1-2", "1-3", "1-4", "1-5"];

/** 최신순 사진 목록 (GET /images, 토큰 불필요 — 공개) */
export async function getPhotos(): Promise<Photo[]> {
  const list = await apiFetch<ImageResponse[]>("/images");
  return list.map(mapImage);
}

/** 사진 게시 (POST /images multipart, 리더·관리자) */
export async function addPhoto(
  input: NewPhoto,
  file: File,
  token: string | null,
): Promise<Photo> {
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
  await apiFetch<void>(`/images/${id}`, { method: "DELETE", token, noContent: true });
}

/**
 * 실시간 피드 구독 (SSE GET /display/feed, event: image-created).
 * 새 사진이 올라오면 onPhoto 콜백. 반환값은 구독 해제 함수.
 */
export function subscribeFeed(onPhoto: (photo: Photo) => void): () => void {
  if (typeof window === "undefined") return () => {};
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
