"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://football-analytics-production-5b3d.up.railway.app";

export interface AuthUser {
  id: number;
  email: string;
  role: "user" | "admin";
  phone?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore token from localStorage and fetch /me
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("plusone-token") : null;
    if (!stored) { setLoading(false); return; }
    setToken(stored);
    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.id) setUser(data); else clearAuth(); })
      .catch(() => clearAuth())
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined") localStorage.removeItem("plusone-token");
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || "Login failed");
    }
    const data = await res.json();
    const { token: tok, user: u } = data;
    if (typeof window !== "undefined") localStorage.setItem("plusone-token", tok);
    setToken(tok);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin: user?.role === "admin" }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/** Returns the stored token — use inside API calls that need auth */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("plusone-token");
}
