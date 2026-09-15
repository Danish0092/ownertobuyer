"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Landed on after clicking a password-recovery link (see
// app/forgot-password/page.tsx and app/auth/confirm/route.ts, which
// verifies the recovery token and redirects here already signed in).
export default function UpdatePasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-[#F7F9FC] px-6 py-14 font-body">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
        <h1 className="mb-1 font-display text-xl font-bold text-[#101828]">Set a new password</h1>
        <p className="mb-6 text-sm text-[#667085]">Choose a password you&apos;ll use to sign in from now on.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full rounded-lg border border-[#D0D5DD] px-3.5 py-2.5 text-sm text-[#101828] outline-none focus:border-[#1D4ED8]"
          />
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full rounded-lg border border-[#D0D5DD] px-3.5 py-2.5 text-sm text-[#101828] outline-none focus:border-[#1D4ED8]"
          />
          {error && <p className="font-body text-[13px] text-[#DC2626]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#EA7D0B] py-2.5 font-display text-sm font-extrabold text-white disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save password"}
          </button>
        </form>
      </div>
    </div>
  );
}
