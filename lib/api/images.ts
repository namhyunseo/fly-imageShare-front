// ============================================================
// 이미지 API — 목록(GET /images) / 업로드(POST /images) / 삭제(DELETE)
//
// 업로드는 comment + file 만 보낸다. 오이코스는 서버가 로그인
// 사용자 세션으로 결정한다(클라가 보내지 않음).
// ============================================================
import type { Photo } from "../types";
import type { Day } from "../event";
import { USE_MOCK, apiFetch } from "./client";
import { mockDelete, mockGetImages, mockUpload } from "./mock";

/** 백엔드 ImageResponse (계약) */
interface ImageResponse {
  id: number;
  comment: string;
  oikosName: string;
  /** 확장형 소속명 (백엔드 제안 반영 예정) */
  affiliationName?: string;
  /** 행사 진행일 (백엔드 제안 반영 예정) */
  day?: Day;
  imageUrl: string;
  contentType?: string;
  uploadedBy?: string;
  hidden?: boolean;
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
    affiliationName: r.affiliationName,
    day: r.day,
    imageUrl: r.imageUrl,
    uploadedBy: r.uploadedBy,
    hidden: r.hidden,
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
 * day는 사용자가 선택해 전달하고, 검증·저장은 백엔드가 맡는다.
 * devOikosName/previewUrl 은 mock 모드 표시 전용(실서버 호출엔 미사용).
 */
export async function uploadImage(
  comment: string,
  file: File,
  day: Day,
  token: string | null,
  dev?: { oikosName: string; previewUrl: string },
): Promise<Photo> {
  if (USE_MOCK)
    return mockUpload(comment, dev?.oikosName ?? "1-1", dev?.previewUrl ?? "", day);
  const form = new FormData();
  form.append("file", file);
  form.append("comment", comment);
  form.append("day", day);
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
