"use client";

import { useActionState } from "react";
import { adminLogin } from "./actions";

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminLogin, null);

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-8 shadow-[0_6px_18px_rgba(16,24,40,0.08)]">
      <div className="mb-1">
        <h1 className="font-display text-xl font-bold text-[#101828]">Admin sign in</h1>
        <p className="font-body text-sm text-[#667085]">OwnerToBuyer staff only.</p>
      </div>

      {state && "error" in state && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-body text-sm text-red-700">
          {state.error}
        </p>
      )}

      <label className="flex flex-col gap-1 font-body text-sm text-[#344054]">
        Email
        <input
          type="email"
          name="email"
          required
          autoComplete="username"
          className="rounded-lg border border-[#EAEFF6] px-3 py-2 text-sm text-[#101828]"
        />
      </label>

      <label className="flex flex-col gap-1 font-body text-sm text-[#344054]">
        Password
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="rounded-lg border border-[#EAEFF6] px-3 py-2 text-sm text-[#101828]"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-lg bg-[#0B2545] px-4 py-2.5 font-display text-sm font-bold text-white disabled:opacity-50"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
