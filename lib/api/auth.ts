// ============================================================
// 인증 API — 로그인 (POST /auth/login)
// ============================================================
import type { AffiliationType, Role, Session } from "../types";
import { USE_MOCK, apiFetch } from "./client";
import { mockLogin } from "./mock";

/** 백엔드 LoginResponse (계약) — affiliation 모델 기준 */
interface LoginResponse {
  token: string;
  username: string;
  displayName: string;
  role: string;
  affiliationKey: string | null;
  affiliationName: string | null;
  affiliationType: string | null;
}

/** 리더·관리자 로그인 → 세션. 뷰어는 로그인 없이 익명 진입(AuthProvider). */
export async function login(username: string, password: string): Promise<Session> {
  if (USE_MOCK) return mockLogin(username);
  const r = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    json: { username, password },
  });
  return {
    token: r.token,
    username: r.username,
    displayName: r.displayName,
    role: r.role.toUpperCase() as Role,
    affiliationKey: r.affiliationKey,
    affiliationName: r.affiliationName,
    affiliationType: (r.affiliationType as AffiliationType | null) ?? null,
  };
}
