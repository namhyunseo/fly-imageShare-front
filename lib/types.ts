// ============================================================
// 도메인 타입 — 백엔드 계약(contract)에 정합
//
// 백엔드가 source of truth. role은 대문자 enum, 사진은 ImageResponse,
// 오이코스는 groupName("1-1" 형식) 문자열을 그대로 사용한다.
// ============================================================

/** 권한 3단계 (백엔드 UserRole enum, 대문자) */
export type Role = "ADMIN" | "LEADER" | "VIEWER";

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "관리자",
  LEADER: "리더",
  VIEWER: "뷰어",
};

/** 게시 가능한 권한인지 (리더 이상) */
export function canPost(role: Role): boolean {
  return role === "ADMIN" || role === "LEADER";
}

/**
 * 사진 — 백엔드 ImageResponse 정합.
 * (화면이 쓰는 필드 위주. width/height 등 메타는 필요 시 확장)
 */
export interface Photo {
  /** 백엔드 Long → string */
  id: string;
  comment: string;
  /** 오이코스 식별자 "1-1" ~ "1-5" */
  groupName: string;
  /** "/images/{id}/content" 상대경로 (또는 S3 절대 URL) */
  imageUrl: string;
  /** 업로더 표시명 */
  uploadedBy?: string;
  /** ISO 8601 */
  createdAt: string;
}

/** 업로드 입력 (id·시각·URL은 서버가 부여) */
export interface NewPhoto {
  groupName: string;
  comment: string;
}

/** 로그인 세션 — 백엔드 LoginResponse 정합 */
export interface Session {
  token: string;
  username: string;
  displayName: string;
  role: Role;
  /** 리더는 발급 계정에 내장된 오이코스. 관리자는 없음(null). */
  groupName: string | null;
}
