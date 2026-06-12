// ============================================================
// 모던 라인 아이콘 세트 (직접 디자인)
//
// 이모지 대신 사용하는 24x24 라인 아이콘. stroke는 currentColor라
// 부모 텍스트 색(탭 활성색·박스 강조색 등)을 자동으로 따라간다.
// 크기는 className의 h-/w- 유틸로 조절.
// ============================================================
import type { SVGProps } from "react";

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** 갤러리 — 사진 프레임 + 해/산 */
export function IconGallery(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="8.5" cy="9" r="1.6" />
      <path d="M20.5 14.5 16 10 6 19.5" />
    </svg>
  );
}

/** 올리기 — 위로 향한 화살표 + 트레이 */
export function IconUpload(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} aria-hidden>
      <path d="M12 15V4.5" />
      <path d="M8 8l4-4 4 4" />
      <path d="M4 13.5v3A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-3" />
    </svg>
  );
}

/** 빔 — 프로젝터(렌즈 + 다리) */
export function IconBeam(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} aria-hidden>
      <rect x="2.5" y="7.5" width="19" height="9" rx="2.5" />
      <circle cx="14.5" cy="12" r="2.4" />
      <circle cx="6.5" cy="11" r="0.85" fill="currentColor" stroke="none" />
      <path d="M6.5 16.5V18M17.5 16.5V18" />
    </svg>
  );
}

/** 카메라 — 사진 선택용 */
export function IconCamera(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} aria-hidden>
      <rect x="3" y="8" width="18" height="11" rx="3" />
      <path d="M8 8l1.3-2.2a1 1 0 0 1 .86-.5h3.68a1 1 0 0 1 .86.5L16 8" />
      <circle cx="12" cy="13.5" r="3.2" />
    </svg>
  );
}

/** 자물쇠 — 잠금/뷰어 권한 */
export function IconLock(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} aria-hidden>
      <rect x="4.5" y="10" width="15" height="10" rx="2.5" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </svg>
  );
}

/** 연필 — 게시 권한/편집 */
export function IconEdit(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} aria-hidden>
      <path d="M14.5 5.5l4 4" />
      <path d="M4.5 19.5l1-4.2L16 4.8a2 2 0 0 1 2.8 2.8L8.7 18.2z" />
    </svg>
  );
}

/** 경고 — 에러 안내 */
export function IconWarning(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} aria-hidden>
      <path d="M12 4.5 21 19.5H3z" />
      <path d="M12 10v4.2" />
      <path d="M12 17.2h.01" />
    </svg>
  );
}

/** 텐트 — 수련회 브랜드 마크 */
export function IconTent(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} aria-hidden>
      <path d="M12 4 3.5 19.5h17z" />
      <path d="M9.3 19.5 12 13l2.7 6.5" />
    </svg>
  );
}

/** 눈 — 비밀번호 표시 */
export function IconEye(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} aria-hidden>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** 눈 가림 — 비밀번호 숨김 */
export function IconEyeOff(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} aria-hidden>
      <path d="M3 3l18 18" />
      <path d="M10.6 6.1A9.7 9.7 0 0 1 12 6c6 0 9.5 6 9.5 6a16.2 16.2 0 0 1-3.3 3.8" />
      <path d="M6.7 7.9A15.7 15.7 0 0 0 2.5 12S6 18 12 18a9.4 9.4 0 0 0 3.3-.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

/** 닫기 / 제거 */
export function IconClose(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

/** 왼쪽 화살표 — 이전 */
export function IconChevronLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} aria-hidden>
      <path d="M14.5 6 9 12l5.5 6" />
    </svg>
  );
}

/** 오른쪽 화살표 — 다음 */
export function IconChevronRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} aria-hidden>
      <path d="M9.5 6 15 12l-5.5 6" />
    </svg>
  );
}

/** 휴지통 — 삭제(관리자) */
export function IconTrash(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} aria-hidden>
      <path d="M4 7h16" />
      <path d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
      <path d="M6.5 7 7.4 19.6A2 2 0 0 0 9.4 21.5h5.2a2 2 0 0 0 2-1.9L17.5 7" />
      <path d="M10 11v6.5M14 11v6.5" />
    </svg>
  );
}
