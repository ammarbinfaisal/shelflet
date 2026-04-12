"use client";

import { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { PublicLoginForm } from "@/app/public-login";

export function AuthGate({ children }: { children: ReactNode }) {
  const { token, requiresAuth, isLoading } = useAuth();

  if (isLoading) {
    return <div className="text-center py-8 text-neutral-400">Loading...</div>;
  }

  if (requiresAuth && !token) {
    return <PublicLoginForm />;
  }

  return <>{children}</>;
}
