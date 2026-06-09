"use client";

// ============================================================
// 권한 컨텍스트 (mock)
//
// 시안의 role 전환을 클라이언트 상태로. localStorage에 저장해
// 새로고침에도 유지. 추후 Supabase Auth 세션으로 교체 지점.
// ============================================================
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Role } from "./types";

const STORAGE_KEY = "oikos-role";

interface AuthState {
  /** null = 아직 입장 전 */
  role: Role | null;
  login: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);

  // 초기 1회: 저장된 세션 복원
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Role | null;
    if (saved === "admin" || saved === "leader" || saved === "viewer") {
      setRole(saved);
    }
  }, []);

  const login = useCallback((next: Role) => {
    setRole(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const logout = useCallback(() => {
    setRole(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
