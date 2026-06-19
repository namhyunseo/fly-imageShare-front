// ============================================================
// 태그 API — 프로그램 태그 (공개 목록 / 관리자 CRUD)
//
// 공개: GET /tags (활성 태그만)
// 관리자: GET/POST/PATCH/PATCH status/DELETE /admin/tags
// ============================================================
import type { Tag } from "../types";
import { USE_MOCK, apiFetch } from "./client";
import {
  mockAdminTags,
  mockCreateTag,
  mockDeleteTag,
  mockSetTagStatus,
  mockTags,
  mockUpdateTag,
} from "./mock";

/** 백엔드 TagResponse (계약) */
interface TagResponse {
  id: number;
  tagKey: string;
  tagName: string;
  active: boolean;
  createdAt?: string;
  imageCount?: number;
}

function mapTag(r: TagResponse): Tag {
  return {
    id: String(r.id),
    tagKey: r.tagKey,
    tagName: r.tagName,
    active: r.active,
    createdAt: r.createdAt,
    imageCount: r.imageCount,
  };
}

/** 공개 태그 목록 (활성만) — GET /tags */
export async function getTags(): Promise<Tag[]> {
  if (USE_MOCK) return mockTags();
  const list = await apiFetch<TagResponse[]>("/tags");
  return list.map(mapTag);
}

/** 관리자 태그 목록 (전체) — GET /admin/tags */
export async function getAdminTags(token: string | null): Promise<Tag[]> {
  if (USE_MOCK) return mockAdminTags();
  const list = await apiFetch<TagResponse[]>("/admin/tags", { token });
  return list.map(mapTag);
}

/** 태그 생성 — POST /admin/tags */
export async function createTag(
  input: { tagKey: string; tagName: string; active?: boolean },
  token: string | null,
): Promise<Tag> {
  if (USE_MOCK) return mockCreateTag(input);
  return mapTag(
    await apiFetch<TagResponse>("/admin/tags", { method: "POST", json: input, token }),
  );
}

/** 태그 이름 수정 — PATCH /admin/tags/{id} */
export async function updateTag(
  id: string,
  tagName: string,
  token: string | null,
): Promise<Tag> {
  if (USE_MOCK) return mockUpdateTag(id, tagName);
  return mapTag(
    await apiFetch<TagResponse>(`/admin/tags/${id}`, {
      method: "PATCH",
      json: { tagName },
      token,
    }),
  );
}

/** 태그 활성/비활성 — PATCH /admin/tags/{id}/status */
export async function setTagStatus(
  id: string,
  active: boolean,
  token: string | null,
): Promise<Tag> {
  if (USE_MOCK) return mockSetTagStatus(id, active);
  return mapTag(
    await apiFetch<TagResponse>(`/admin/tags/${id}/status`, {
      method: "PATCH",
      json: { active },
      token,
    }),
  );
}

/** 태그 삭제 (미사용 태그만) — DELETE /admin/tags/{id} */
export async function deleteTag(id: string, token: string | null): Promise<void> {
  if (USE_MOCK) return mockDeleteTag(id);
  await apiFetch<void>(`/admin/tags/${id}`, { method: "DELETE", token, noContent: true });
}
