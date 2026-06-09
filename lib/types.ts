// ============================================================
// 도메인 타입 — 시안의 권한 3단계 + 오이코스(조) + 사진
// ============================================================

/** 권한 3단계: 관리자(전체 관리·모더레이션) / 리더(게시) / 뷰어(열람) */
export type Role = "admin" | "leader" | "viewer";

export const ROLE_LABEL: Record<Role, string> = {
  admin: "관리자",
  leader: "리더",
  viewer: "뷰어",
};

/** 게시 가능한 권한인지 (리더 이상) */
export function canPost(role: Role): boolean {
  return role === "admin" || role === "leader";
}

/** 오이코스 = 조 */
export interface Oikos {
  id: string;
  /** 표시명 예: "1조 소망" */
  name: string;
}

export interface Photo {
  id: string;
  /** 원본 이미지 URL (mock: 외부 / 실제: Supabase 스토리지) */
  url: string;
  /** 로드 실패 시 대체 URL (mock 전용, 실연동 후 제거) */
  fallbackUrl?: string;
  oikosId: string;
  /** 한 줄 코멘트 (≤50자) */
  comment: string;
  /** ISO 8601 생성 시각 */
  createdAt: string;
}

/** 업로드 입력 (id·시각은 서버가 부여) */
export interface NewPhoto {
  url: string;
  fallbackUrl?: string;
  oikosId: string;
  comment: string;
}
