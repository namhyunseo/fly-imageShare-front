"use client";

// ============================================================
// 인증 컨텍스트
//
// 리더·관리자: /auth/login으로 토큰 발급 → 세션 유지(localStorage).
//   세션에 oikosName을 보관(업로드 시 서버가 사용하므로 표시용).
// 뷰어: 백엔드 계정이 없음 → 토큰 없는 익명 진입(프론트 파생 상태).
// 갤러리·디스플레이는 공개라 토큰 없이 열람 가능.
// ============================================================
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { login as apiLogin } from "./api/auth";
import type { Role, Session } from "./types";

const SESSION_KEY = "oikos-session";
const VIEWER_KEY = "oikos-viewer";

interface AuthState {
  /** 로그인 세션 (리더·관리자). 뷰어/미입장은 null */
  session: Session | null;
  /** 파생 권한: 세션 role > 뷰어 > null */
  role: Role | null;
  /** 리더·관리자 로그인 */
  login: (username: string, password: string) => Promise<void>;
  /** 뷰어로 둘러보기 (익명) */
  enterViewer: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isViewer, setIsViewer] = useState(false);

  // 초기 1회: 저장된 세션/뷰어 상태 복원 (localStorage 동기화)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setSession(JSON.parse(saved) as Session);
      else if (localStorage.getItem(VIEWER_KEY)) setIsViewer(true);
    } catch {
      /* 파싱 실패 무시 */
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const next = await apiLogin(username, password);
    setSession(next);
    setIsViewer(false);
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    localStorage.removeItem(VIEWER_KEY);
  }, []);

  const enterViewer = useCallback(() => {
    setSession(null);
    setIsViewer(true);
    localStorage.removeItem(SESSION_KEY);
    localStorage.setItem(VIEWER_KEY, "1");
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    setIsViewer(false);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(VIEWER_KEY);
  }, []);

  const role: Role | null = session?.role ?? (isViewer ? "VIEWER" : null);

  const value = useMemo(
    () => ({ session, role, login, enterViewer, logout }),
    [session, role, login, enterViewer, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
