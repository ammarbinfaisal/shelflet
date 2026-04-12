"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.books.ammarfaisal.me";

interface AuthContextType {
  token: string | null;
  requiresAuth: boolean | null;
  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [requiresAuth, setRequiresAuth] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("public_token");
    if (stored) setToken(stored);

    fetch(`${API_BASE}/api/auth/status`)
      .then((res) => res.json())
      .then((data) => {
        setRequiresAuth(data.requiresAuth);
        setIsLoading(false);
      })
      .catch(() => {
        setRequiresAuth(false);
        setIsLoading(false);
      });
  }, []);

  const login = async (password: string) => {
    const res = await fetch(`${API_BASE}/api/public-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    if (res.ok && data.token) {
      localStorage.setItem("public_token", data.token);
      setToken(data.token);
      return { success: true };
    }
    return { success: false, error: data.error || "Login failed" };
  };

  const logout = () => {
    localStorage.removeItem("public_token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, requiresAuth, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("public_token");
}

export function useAuthFetch() {
  const { token } = useAuth();

  return async (path: string, init?: RequestInit) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((init?.headers as Record<string, string>) || {}),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    return fetch(`${API_BASE}${path}`, { ...init, headers });
  };
}
