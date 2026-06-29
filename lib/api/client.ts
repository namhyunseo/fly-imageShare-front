// ============================================================
// API 클라이언트 공통 (백엔드 계약 정합)
//
// 모든 API 전용 모듈(auth/images/display)이 이 클라이언트를 통해
// 서버에 접근한다. NEXT_PUBLIC_API_BASE_URL이 비어 있으면 dev-only
// mock 모드(USE_MOCK)로 동작하고, 채워지면 실서버로 전환된다.
// ============================================================

const RAW_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

/** dev-only: API base가 없으면 mock 모드 (운영에서는 항상 false) */
export const USE_MOCK = RAW_BASE === "";

// 프로덕션 안전장치: 실서버 URL 없이 빌드되면 mock이 그대로 배포돼
// 가짜 사진이 운영에 노출된다. dev에서는 mock 모드를 허용하되,
// production 빌드에서는 NEXT_PUBLIC_API_BASE_URL을 강제해 빌드를 실패시킨다.
if (USE_MOCK && process.env.NODE_ENV === "production") {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL이 설정되지 않았습니다. " +
      "프로덕션 빌드는 실서버 URL이 반드시 필요합니다(mock 배포 방지).",
  );
}

/**
 * 실제 호출에 쓸 base URL.
 * 모바일/LAN 테스트: base가 localhost인데 브라우저는 맥북 IP로 접속 중이면
 * host를 브라우저 host로 치환해 같은 Wi-Fi의 폰이 실제 API를 보게 한다.
 */
export function apiBase(): string {
  if (!RAW_BASE) return "";
  if (typeof window === "undefined") return RAW_BASE;
  try {
    const u = new URL(RAW_BASE);
    const local = u.hostname === "localhost" || u.hostname === "127.0.0.1";
    const browser = window.location.hostname;
    const browserLocal = browser === "localhost" || browser === "127.0.0.1";
    if (local && !browserLocal) {
      u.hostname = browser;
      return u.toString().replace(/\/+$/, "");
    }
  } catch {
    /* RAW_BASE가 절대 URL이 아니면 그대로 사용 */
  }
  return RAW_BASE;
}

/** 사진 content의 표시용 절대 URL. 절대 URL(S3 등)이면 그대로 반환. */
export function imageSrc(imageUrl: string): string {
  if (/^https?:\/\//.test(imageUrl)) return imageUrl;
  return apiBase() + imageUrl;
}

interface ApiErrorBody {
  message?: string;
  details?: string;
}

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
  /** 401/403 = 로그인 만료 또는 권한 오류 */
  get isAuth(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

interface FetchOptions {
  method?: string;
  json?: unknown;
  formData?: FormData;
  token?: string | null;
  noContent?: boolean;
}

/** 공통 fetch 래퍼. 실패 시 ApiError(message/details 우선)로 throw. */
export async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.json !== undefined) headers["Content-Type"] = "application/json";
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;

  const res = await fetch(apiBase() + path, {
    method: opts.method ?? "GET",
    headers,
    body: opts.formData ?? (opts.json !== undefined ? JSON.stringify(opts.json) : undefined),
  });

  if (!res.ok) {
    let message = `요청에 실패했어요. (${res.status})`;
    try {
      const body = (await res.json()) as ApiErrorBody;
      // 백엔드 계약: message=사용자용 한국어, details=내부 디버깅용(영문 예외).
      // 사용자에게는 message를 우선 노출하고, 없을 때만 details로 보강한다.
      message = body.message || body.details || message;
    } catch {
      /* 본문이 JSON이 아니면 기본 메시지 유지 */
    }
    throw new ApiError(res.status, message);
  }

  if (opts.noContent || res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** 백엔드 커서 페이지 응답 — GET /images, /admin/images */
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasNext: boolean;
}

/**
 * 커서 페이지를 끝까지 모아 전량 반환한다.
 * - 신 백엔드: { items, nextCursor, hasNext } 를 hasNext 동안 반복 수집.
 * - 구 백엔드: 배열을 그대로 반환하던 시절과도 호환(Array면 그대로 사용).
 * 페이징 UI 도입 전까지 기존 "전체 로드" UX를 유지하기 위한 장치다.
 */
export async function fetchAll<T>(
  path: string,
  opts: FetchOptions = {},
  pageSize = 30, // 백엔드 MAX_PAGE_LIMIT=30 — 초과 시 400. 이 값을 넘기지 말 것.
): Promise<T[]> {
  const sep = path.includes("?") ? "&" : "?";
  const out: T[] = [];
  let cursor: string | null = null;
  for (;;) {
    const q: string = `${path}${sep}limit=${pageSize}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const res: T[] | CursorPage<T> = await apiFetch<T[] | CursorPage<T>>(q, opts);
    if (Array.isArray(res)) {
      out.push(...res); // 구 백엔드(배열 응답)
      break;
    }
    out.push(...res.items);
    if (!res.hasNext || !res.nextCursor) break;
    cursor = res.nextCursor;
  }
  return out;
}
