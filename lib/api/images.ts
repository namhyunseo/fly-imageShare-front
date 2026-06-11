// ============================================================
// 이미지 API — 목록(GET /images) / 업로드(POST /images) / 삭제(DELETE)
//
// 업로드는 comment + file 만 보낸다. 오이코스는 서버가 로그인
// 사용자 세션으로 결정한다(클라가 보내지 않음).
// ============================================================
import type { Photo } from "../types";
import { USE_MOCK, apiFetch } from "./client";
import { mockDelete, mockGetImages, mockUpload } from "./mock";

/** 백엔드 ImageResponse (계약) */
interface ImageResponse {
  id: number;
  comment: string;
  oikosName: string;
  imageUrl: string;
  contentType?: string;
  uploadedBy?: string;
  createdAt: string;
  width?: number;
  height?: number;
}

/** 백엔드 응답 → 프론트 Photo */
export function mapImage(r: ImageResponse): Photo {
  return {
    id: String(r.id),
    comment: r.comment,
    oikosName: r.oikosName,
    imageUrl: r.imageUrl,
    uploadedBy: r.uploadedBy,
    createdAt: r.createdAt,
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
 * 사진 게시 (리더·관리자). 오이코스는 서버가 세션으로 결정.
 * devOikosName/previewUrl 은 mock 모드 표시 전용(실서버 호출엔 미사용).
 */
export async function uploadImage(
  comment: string,
  file: File,
  token: string | null,
  dev?: { oikosName: string; previewUrl: string },
): Promise<Photo> {
  if (USE_MOCK) return mockUpload(comment, dev?.oikosName ?? "1-1", dev?.previewUrl ?? "");
  const form = new FormData();
  form.append("file", file);
  form.append("comment", comment);
  const created = await apiFetch<ImageResponse>("/images", {
    method: "POST",
    formData: form,
    token,
  });
  return mapImage(created);
}

/** 사진 삭제 (관리자 전용) */
export async function deleteImage(id: string, token: string | null): Promise<void> {
  if (USE_MOCK) return mockDelete(id);
  await apiFetch<void>(`/images/${id}`, { method: "DELETE", token, noContent: true });
}
