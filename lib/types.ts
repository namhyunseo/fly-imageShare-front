// ============================================================
// 도메인 타입 — 백엔드 계약(contract)에 정합
//
// 백엔드가 source of truth. 오이코스 식별자는 oikosName("1-1" 형식),
// role은 대문자 enum. 업로드는 코멘트만 보내고 오이코스는 서버가
// 로그인 사용자 세션으로 결정한다.
// ============================================================

import type { Day } from "./event";

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
 * 소속 종류. 숫자 오이코스(OIKOS) 외에 회장단·예배팀 같은 확장형 소속도
 * 같은 레벨에서 다룬다.
 */
export type AffiliationType = "OIKOS" | "PRESIDENT" | "WORSHIP";

export const AFFILIATION_TYPE_LABEL: Record<AffiliationType, string> = {
  OIKOS: "오이코스",
  PRESIDENT: "회장단",
  WORSHIP: "예배팀",
};

/** 소속 기준 데이터 (관리자 affiliation 조회 / 사용자 소속 후보) */
export interface Affiliation {
  /** 내부 식별 키 (예: "1-1", "president-team") */
  affiliationKey: string;
  /** 표시명 (예: "1-1", "회장단") */
  affiliationName: string;
  type: AffiliationType;
}

/** 사진 — 백엔드 ImageResponse 정합 */
export interface Photo {
  /** 백엔드 Long → string */
  id: string;
  comment: string;
  /** 오이코스 식별자 "1-1" ~ "1-5" (업로더 사용자 기준) */
  oikosName: string;
  /**
   * 확장형 소속명. 회장단·예배팀 등은 oikosName과 다를 수 있다.
   * 없으면 oikosName이 곧 소속명. (백엔드 연동 전 mock에서 채움)
   */
  affiliationName?: string;
  /** 행사 진행일. 업로드 시 필수 선택값. (백엔드 연동 전 mock에서 채움) */
  day?: Day;
  /** "/images/{id}/content" 상대경로 (또는 S3 절대 URL) */
  imageUrl: string;
  /** 업로더 표시명 */
  uploadedBy?: string;
  /** 노출 상태. true면 관리자가 숨긴 게시물(복구 가능). 기본 노출. */
  hidden?: boolean;
  /** ISO 8601 */
  createdAt: string;
  /** 원본 픽셀 크기 (빔에서 원본 비율 표시용) */
  width?: number;
  height?: number;
}

/** 사진의 소속명 — 확장형 우선, 없으면 오이코스명 */
export function affiliationOf(p: Photo): string {
  return p.affiliationName ?? p.oikosName;
}

/** 로그인 세션 — 백엔드 LoginResponse 정합 */
export interface Session {
  token: string;
  username: string;
  displayName: string;
  role: Role;
  /** 리더는 발급 계정에 내장된 오이코스. 관리자는 없을 수 있음(null). */
  oikosName: string | null;
}
