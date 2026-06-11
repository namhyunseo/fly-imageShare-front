// ============================================================
// 인증 API — 로그인 (POST /auth/login)
// ============================================================
import type { Role, Session } from "../types";
import { USE_MOCK, apiFetch } from "./client";
import { mockLogin } from "./mock";

/** 백엔드 LoginResponse (계약) */
interface LoginResponse {
  token: string;
  username: string;
  displayName: string;
  role: string;
  oikosName: string | null;
}

/** 리더·관리자 로그인 → 세션. 뷰어는 로그인 없이 익명 진입(AuthProvider). */
export async function login(username: string, password: string): Promise<Session> {
  if (USE_MOCK) return mockLogin(username);
  const r = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    json: { username, password },
  });
  return { ...r, role: r.role.toUpperCase() as Role };
}
