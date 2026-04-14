"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { config } from "@/lib/config";

export function PublicLoginForm() {
  const { login } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsPending(true);

    const result = await login(password);
    if (!result.success) {
      setError(result.error || "Login failed");
    }
    setIsPending(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">{config.siteName}</h1>
        <p className="text-neutral-600 text-center mb-6">
          Enter the password to view the book collection.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full px-4 py-2 bg-neutral-900 text-white rounded-md text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {isPending ? "Logging in..." : "View Books"}
          </button>
        </form>
      </div>
    </div>
  );
}
