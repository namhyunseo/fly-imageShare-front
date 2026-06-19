// ============================================================
// 관리자 API — 게시물 운영 / 사용자 관리 / affiliation 조회
//
// 현재 백엔드 관리자 제안 범위(/admin/images, /admin/users,
// /admin/affiliations)에 맞춘다. 삭제 대신 숨김·복구(visibility)를
// 우선 사용하고, 사용자 관리는 role·affiliation·displayName 조정에 집중.
// ============================================================
import type { AdminUser, Affiliation, AffiliationType, Photo, Role } from "../types";
import { USE_MOCK, apiFetch } from "./client";
import { mapImage, type ImageResponse } from "./images";
import {
  mockAdminImages,
  mockAdminUsers,
  mockAffiliations,
  mockSetHidden,
  mockUpdateUser,
} from "./mock";

/** 백엔드 AdminUserResponse → 프론트 AdminUser */
interface AdminUserResponse {
  id: number;
  username: string;
  displayName: string;
  affiliationKey: string | null;
  affiliationName: string | null;
  affiliationType: string | null;
  role: string;
  active: boolean;
}
function mapUser(r: AdminUserResponse): AdminUser {
  return {
    id: String(r.id),
    username: r.username,
    displayName: r.displayName,
    affiliationKey: r.affiliationKey,
    affiliationName: r.affiliationName,
    affiliationType: (r.affiliationType as AffiliationType | null) ?? null,
    role: r.role.toUpperCase() as Role,
    active: r.active,
  };
}

/** 백엔드 AffiliationResponse → 프론트 Affiliation */
interface AffiliationResponse {
  id?: number;
  affiliationKey: string;
  affiliationName: string;
  affiliationType: string;
}
function mapAffiliation(r: AffiliationResponse): Affiliation {
  return {
    affiliationKey: r.affiliationKey,
    affiliationName: r.affiliationName,
    affiliationType: r.affiliationType as AffiliationType,
  };
}

/** 게시물 목록 (숨김 포함, 최신순) — GET /admin/images */
export async function getAdminImages(token: string | null): Promise<Photo[]> {
  if (USE_MOCK) return mockAdminImages();
  const list = await apiFetch<ImageResponse[]>("/admin/images", { token });
  return list.map(mapImage);
}

/** 노출/숨김 토글 — 삭제가 아닌 복구 가능한 상태 제어 */
export async function setImageHidden(
  id: string,
  hidden: boolean,
  token: string | null,
): Promise<Photo> {
  if (USE_MOCK) return mockSetHidden(id, hidden);
  const updated = await apiFetch<ImageResponse>(`/admin/images/${id}/visibility`, {
    method: "PATCH",
    json: { hidden },
    token,
  });
  return mapImage(updated);
}

/** 운영 계정 목록 — GET /admin/users */
export async function getAdminUsers(token: string | null): Promise<AdminUser[]> {
  if (USE_MOCK) return mockAdminUsers();
  const list = await apiFetch<AdminUserResponse[]>("/admin/users", { token });
  return list.map(mapUser);
}

/** 사용자 수정 (role/affiliation/displayName) — PATCH /admin/users/{id} */
export async function updateUser(
  id: string,
  patch: { role?: Role; affiliationName?: string | null; displayName?: string },
  token: string | null,
): Promise<AdminUser> {
  if (USE_MOCK) return mockUpdateUser(id, patch);
  return mapUser(
    await apiFetch<AdminUserResponse>(`/admin/users/${id}`, {
      method: "PATCH",
      json: patch,
      token,
    }),
  );
}

/** affiliation 기준 데이터 (사용자 수정 시 소속 후보) — GET /admin/affiliations */
export async function getAdminAffiliations(token: string | null): Promise<Affiliation[]> {
  if (USE_MOCK) return mockAffiliations();
  const list = await apiFetch<AffiliationResponse[]>("/admin/affiliations", { token });
  return list.map(mapAffiliation);
}
