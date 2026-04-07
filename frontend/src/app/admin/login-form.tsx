"use client";

import { useActionState } from "react";

type LoginState = { error?: string } | null;

async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const password = formData.get("password") as string;
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  if (!res.ok) {
    return { error: "Wrong password" };
  }

  window.location.href = "/admin";
  return null;
}

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <input
        name="password"
        type="password"
        placeholder="Password"
        required
        className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
      />
      {state?.error && (
        <p className="text-red-600 text-sm">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="w-full px-4 py-2 bg-neutral-900 text-white rounded-md text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
      >
        {isPending ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}
