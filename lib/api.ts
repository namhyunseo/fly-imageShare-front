// ============================================================
// API 클라이언트 (백엔드 계약 정합 + mock/real 토글)
//
// NEXT_PUBLIC_API_BASE_URL 이 비어 있으면 mock 모드(USE_MOCK=true).
// 채워지면 실서버 모드로 자동 전환된다. 백엔드가 source of truth이며
// 프론트는 이 모듈을 통해서만 서버에 접근한다.
// ============================================================

const RAW_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

/** API base가 없으면 mock 모드 */
export const USE_MOCK = RAW_BASE === "";

/**
 * 실제 호출에 쓸 base URL.
 * 모바일/LAN 테스트: base가 localhost인데 브라우저는 맥북 IP로 접속 중이면
 * host를 브라우저 host로 치환해 같은 Wi-Fi의 폰이 실제 API를 보게 한다.
 * (백엔드 docs: NEXT_PUBLIC_API_BASE_URL host 치환)
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

/** 사진 content의 표시용 절대 URL. mock의 절대 URL은 그대로 반환. */
export function imageSrc(imageUrl: string): string {
  if (/^https?:\/\//.test(imageUrl)) return imageUrl;
  return apiBase() + imageUrl;
}

/** 백엔드 에러 응답 형태 (docs: 에러 응답) */
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
  /** JSON body (multipart는 formData 사용) */
  json?: unknown;
  formData?: FormData;
  token?: string | null;
  /** 응답 본문이 없을 때 true */
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
      message = body.details || body.message || message;
    } catch {
      /* 본문이 JSON이 아니면 기본 메시지 유지 */
    }
    throw new ApiError(res.status, message);
  }

  if (opts.noContent || res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
