// ============================================================
// 도메인 타입 — 백엔드 계약(contract)에 정합
//
// 백엔드가 source of truth. 소속은 oikosName이 아니라 affiliation 모델로
// 일반화되어 있다: affiliationKey/affiliationName/affiliationType.
// (숫자 오이코스도 affiliationType=OIKOS 인 affiliation 의 하나)
// role은 대문자 enum. 업로드는 코멘트+day만 보내고 소속은 서버가
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
 * 소속 종류. 숫자 오이코스(OIKOS) 외에 회장단·예배팀·교사 같은 확장형
 * 소속도 같은 레벨에서 다룬다. (백엔드 AffiliationType enum 정합)
 */
export type AffiliationType = "OIKOS" | "PRESIDENT" | "WORSHIP" | "TEACHER";

export const AFFILIATION_TYPE_LABEL: Record<AffiliationType, string> = {
  OIKOS: "오이코스",
  PRESIDENT: "회장단",
  WORSHIP: "예배팀",
  TEACHER: "교사",
};

/** 소속 기준 데이터 — 백엔드 AffiliationResponse 정합 */
export interface Affiliation {
  /** 내부 식별 키 (예: "1-1", "president-team") */
  affiliationKey: string;
  /** 표시명 (예: "1-1", "회장단") */
  affiliationName: string;
  affiliationType: AffiliationType;
}

/** 운영 계정 — 백엔드 AdminUserResponse 정합 */
export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  /** 소속. 관리자는 없을 수 있음(null). */
  affiliationKey: string | null;
  affiliationName: string | null;
  affiliationType: AffiliationType | null;
  role: Role;
  active?: boolean;
}

/** 사진 — 백엔드 ImageResponse 정합 */
export interface Photo {
  /** 백엔드 Long → string */
  id: string;
  comment: string;
  /** 소속 식별 키 (업로더 사용자 기준) */
  affiliationKey?: string;
  /** 소속 표시명 (예: "1-3", "회장단") — 표시·필터의 기준 */
  affiliationName: string;
  affiliationType?: AffiliationType;
  /** 행사 진행일. 업로드 시 필수 선택값. */
  day?: Day;
  /** "/images/{id}/content" 상대경로 (또는 S3/R2 절대 URL) */
  imageUrl: string;
  /** 썸네일 URL (백엔드 제공 시) */
  thumbnailUrl?: string;
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

/** 사진의 소속명 — 표시·필터·그룹핑의 기준 */
export function affiliationOf(p: Photo): string {
  return p.affiliationName ?? "";
}

/** 로그인 세션 — 백엔드 LoginResponse 정합 */
export interface Session {
  token: string;
  username: string;
  displayName: string;
  role: Role;
  /** 리더는 발급 계정에 내장된 소속. 관리자는 없을 수 있음(null). */
  affiliationKey: string | null;
  affiliationName: string | null;
  affiliationType: AffiliationType | null;
}

/**
 * 이 사진을 수정·삭제할 수 있는지 — 관리자이거나 업로더 본인일 때.
 *
 * 최종 권한 판단은 백엔드가 한다(업로더 본인 또는 관리자). 프론트는
 * 버튼 노출용 근사치로, 업로더 식별자(uploadedBy)와 세션을 맞춘다.
 */
export function canManagePhoto(
  photo: Photo,
  session: Session | null,
  role: Role | null,
): boolean {
  if (role === "ADMIN") return true;
  if (!session) return false;
  return (
    photo.uploadedBy === session.displayName ||
    photo.uploadedBy === session.username
  );
}
