"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent("/update-password")}`,
    });

    setLoading(false);
    // Always show the same success state regardless of whether the email
    // exists — same reasoning as the login error message: don't reveal
    // account existence.
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-[#F7F9FC] px-6 py-14 font-body">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
        <h1 className="mb-1 font-display text-xl font-bold text-[#101828]">Reset your password</h1>

        {sent ? (
          <p className="mt-4 text-sm text-[#667085]">
            If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset your password. If you
            signed up before passwords existed on this site, this same link will let you set one for the first time.
          </p>
        ) : (
          <>
            <p className="mb-6 text-sm text-[#667085]">
              Enter the email on your account and we&apos;ll send you a reset link.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[#D0D5DD] px-3.5 py-2.5 text-sm text-[#101828] outline-none focus:border-[#1D4ED8]"
              />
              {error && <p className="font-body text-[13px] text-[#DC2626]">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#EA7D0B] py-2.5 font-display text-sm font-extrabold text-white disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-[#667085]">
          <a href="/login" className="font-bold text-[#1D4ED8]">
            Back to sign in
          </a>
        </p>
      </div>
    </div>
  );
}
