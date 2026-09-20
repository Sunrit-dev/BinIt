"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, clearToken, getToken, setToken } from "./api";
import { homeForRole, User } from "./types";

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (role?: string, email?: string) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api<User>("/auth/me")
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      login: async (role?: string, email?: string) => {
        const data = await api<{ token: string; user: User }>("/auth/demo", {
          method: "POST",
          body: JSON.stringify({ role, email }),
        });
        setToken(data.token);
        setUser(data.user);
        return data.user;
      },
      logout: () => {
        clearToken();
        setUser(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("binit_token");
          sessionStorage.clear();
          window.location.href = "/signin";
        }
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useRequireAuth(): User {
  const { user, loading } = useAuth();
  const [redirected, setRedirected] = useState(false);
  useEffect(() => {
    if (!loading && !user && typeof window !== "undefined" && !redirected) {
      setRedirected(true);
      window.location.assign("/signin");
    }
  }, [loading, user, redirected]);
  return user as User;
}

export function homePath(user: User | null) {
  return user ? homeForRole(user.role) : "/signin";
}