// ============================================================
// 이미지 API — 목록(GET /images) / 업로드(POST /images) / 삭제(DELETE)
//
// 업로드는 comment + file 만 보낸다. 오이코스는 서버가 로그인
// 사용자 세션으로 결정한다(클라가 보내지 않음).
// ============================================================
import type { AffiliationType, Photo } from "../types";
import type { Day } from "../event";
import { USE_MOCK, apiFetch } from "./client";
import { mockDelete, mockGetImage, mockGetImages, mockUpdate, mockUpload } from "./mock";

/** 백엔드 ImageResponse (계약) — affiliation 모델 기준 */
export interface ImageResponse {
  id: number;
  comment: string;
  day?: string;
  tagKey?: string;
  tagName?: string;
  affiliationKey?: string;
  affiliationName?: string;
  affiliationType?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  contentType?: string;
  uploadedBy?: string;
  hidden?: boolean;
  createdAt: string;
  updatedAt?: string;
  width?: number;
  height?: number;
}

/** 백엔드 응답 → 프론트 Photo */
export function mapImage(r: ImageResponse): Photo {
  return {
    id: String(r.id),
    comment: r.comment,
    affiliationKey: r.affiliationKey,
    affiliationName: r.affiliationName ?? "",
    affiliationType: r.affiliationType as AffiliationType | undefined,
    tagKey: r.tagKey,
    tagName: r.tagName,
    day: r.day as Day | undefined,
    imageUrl: r.imageUrl,
    thumbnailUrl: r.thumbnailUrl,
    uploadedBy: r.uploadedBy,
    hidden: r.hidden,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    width: r.width,
    height: r.height,
  };
}

/** 최신순 사진 목록 (공개 — 토큰 불필요) */
export async function getImages(): Promise<Photo[]> {
  if (USE_MOCK) return mockGetImages();
  const list = await apiFetch<ImageResponse[]>("/images");
  return list.map(mapImage);
}

/**
 * 사진 게시 (리더·관리자). 소속은 서버가 세션으로 결정.
 * day는 사용자가 선택해 전달하고, 검증·저장은 백엔드가 맡는다.
 * dev.affiliationName/previewUrl 은 mock 모드 표시 전용(실서버 호출엔 미사용).
 */
export async function uploadImage(
  comment: string,
  file: File,
  day: Day,
  token: string | null,
  opts?: { tagKey?: string | null; dev?: { affiliationName: string; previewUrl: string } },
): Promise<Photo> {
  if (USE_MOCK)
    return mockUpload(
      comment,
      opts?.dev?.affiliationName ?? "1-1",
      opts?.dev?.previewUrl ?? "",
      day,
      opts?.tagKey ?? null,
    );
  const form = new FormData();
  form.append("file", file);
  form.append("comment", comment);
  form.append("day", day);
  if (opts?.tagKey) form.append("tagKey", opts.tagKey);
  const created = await apiFetch<ImageResponse>("/images", {
    method: "POST",
    formData: form,
    token,
  });
  return mapImage(created);
}

/** 단일 사진 조회 (편집 화면 진입 시). 없으면 null. */
export async function getImage(id: string): Promise<Photo | null> {
  if (USE_MOCK) return mockGetImage(id);
  try {
    return mapImage(await apiFetch<ImageResponse>(`/images/${id}`));
  } catch {
    return null;
  }
}

/**
 * 사진 수정. 코멘트·day·태그, 그리고 선택적으로 이미지 교체.
 * 관리자 콘솔에서의 수정은 admin 경로(PATCH /admin/images/{id})를 쓴다.
 * previewUrl 은 mock 표시 전용.
 */
export async function updateImage(
  id: string,
  comment: string,
  day: Day,
  token: string | null,
  opts?: { file?: File; tagKey?: string | null; previewUrl?: string; admin?: boolean },
): Promise<Photo> {
  if (USE_MOCK)
    return mockUpdate(id, {
      comment,
      day,
      tagKey: opts?.tagKey ?? null,
      previewUrl: opts?.previewUrl,
    });
  const form = new FormData();
  form.append("comment", comment);
  form.append("day", day);
  if (opts?.tagKey) form.append("tagKey", opts.tagKey);
  if (opts?.file) form.append("file", opts.file);
  const path = opts?.admin ? `/admin/images/${id}` : `/images/${id}`;
  const updated = await apiFetch<ImageResponse>(path, {
    method: "PATCH",
    formData: form,
    token,
  });
  return mapImage(updated);
}

/** 사진 삭제 (업로더 본인·관리자) */
export async function deleteImage(id: string, token: string | null): Promise<void> {
  if (USE_MOCK) return mockDelete(id);
  await apiFetch<void>(`/images/${id}`, { method: "DELETE", token, noContent: true });
}
