"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { TreeStats } from "@/lib/treeProgress";

export interface AuthUser {
  userId: string;
  email: string;
  fullName: string;
  childId: string;
  childName: string;
  roles: string[];
  preferredLanguage: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  roleCode?: string;
  childDisplayName?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  treeStats: TreeStats | null;
  isLoading: boolean;
  refreshAuth: () => Promise<void>;
  login: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  register: (
    payload: RegisterPayload
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  setTreeStats: React.Dispatch<React.SetStateAction<TreeStats | null>>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  treeStats: null,
  isLoading: true,
  refreshAuth: async () => {},
  login: async () => ({ ok: false }),
  register: async () => ({ ok: false }),
  logout: async () => {},
  setTreeStats: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [treeStats, setTreeStats] = useState<TreeStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) {
        setUser(null);
        setTreeStats(null);
        return;
      }
      const data = (await res.json()) as {
        authenticated?: boolean;
        user?: AuthUser | null;
        treeStats?: TreeStats | null;
      };
      if (data.authenticated && data.user) {
        setUser(data.user);
        setTreeStats(data.treeStats ?? null);
      } else {
        setUser(null);
        setTreeStats(null);
      }
    } catch {
      // Safe fallback when offline or server unreachable
      setUser(null);
      setTreeStats(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        void refreshAuth();
      }
    });
    return () => {
      active = false;
    };
  }, [refreshAuth]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        user?: AuthUser;
        treeStats?: TreeStats;
        error?: string;
      };
      if (!res.ok || !data.success || !data.user) {
        return {
          ok: false,
          error: data.error || "Email atau kata sandi tidak sesuai.",
        };
      }
      setUser(data.user);
      setTreeStats(data.treeStats ?? null);
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.",
      };
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        success?: boolean;
        user?: AuthUser;
        treeStats?: TreeStats;
        error?: string;
      };
      if (!res.ok || !data.success || !data.user) {
        return {
          ok: false,
          error: data.error || "Gagal mendaftarkan akun baru.",
        };
      }
      setUser(data.user);
      setTreeStats(data.treeStats ?? null);
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.",
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Clear local auth state regardless of network failure
    }
    setUser(null);
    setTreeStats(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        treeStats,
        isLoading,
        refreshAuth,
        login,
        register,
        logout,
        setTreeStats,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
