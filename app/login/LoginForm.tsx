"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ROLE_PRIMARY_PATH } from "@/lib/auth-roles";
import type { AccountType } from "@/lib/property-options";

// Real password login. Phone is shown as a tab for the eventual OTP flow
// but stays disabled until an SMS provider is configured (see
// FEATURES.md "Explicitly NOT Built Yet"). Accounts created before
// passwords existed (the old magic-link-only flow) regain access via
// "Forgot password", which lets them set a password for the first time —
// no data is lost, it's just a one-time extra step.
export function LoginForm() {
  const supabase = createClient();
  const router = useRouter();

  const [method, setMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError, data } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !data.user) {
      setLoading(false);
      // Generic message — don't reveal whether the account exists, is
      // blocked, or just has the wrong password.
      setError("Incorrect email or password.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_blocked, account_type, onboarding_completed")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profile?.is_blocked) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("This account has been blocked. Contact support if you think this is a mistake.");
      return;
    }

    setLoading(false);
    const next = !profile?.onboarding_completed
      ? "/onboarding"
      : ROLE_PRIMARY_PATH[(profile.account_type as AccountType) ?? "OWNER"];
    router.push(next);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
      <h1 className="mb-1 font-display text-xl font-bold text-[#101828]">Sign in</h1>
      <p className="mb-6 text-sm text-[#667085]">Welcome back to OwnerToBuyer.</p>

      <div className="mb-6 flex rounded-lg bg-[#F1F5F9] p-1">
        <button
          type="button"
          onClick={() => setMethod("email")}
          className={`flex-1 rounded-md py-2 font-display text-[13px] font-bold transition-colors ${
            method === "email" ? "bg-white text-[#0B2545] shadow-sm" : "text-[#667085]"
          }`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => setMethod("phone")}
          className={`flex-1 rounded-md py-2 font-display text-[13px] font-bold transition-colors ${
            method === "phone" ? "bg-white text-[#0B2545] shadow-sm" : "text-[#667085]"
          }`}
        >
          Phone
        </button>
      </div>

      {method === "phone" ? (
        <div className="rounded-lg bg-[#F7F9FC] px-4 py-8 text-center text-sm text-[#667085]">
          Phone login is coming soon. Please continue with email for now.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <label className="flex flex-col gap-1.5">
            <span className="font-display text-[12.5px] font-bold text-[#344054]">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-[#D0D5DD] px-3.5 py-2.5 text-sm text-[#101828] outline-none focus:border-[#1D4ED8]"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-display text-[12.5px] font-bold text-[#344054]">Password</span>
              <a href="/forgot-password" className="font-body text-xs font-bold text-[#1D4ED8]">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full rounded-lg border border-[#D0D5DD] px-3.5 py-2.5 pr-16 text-sm text-[#101828] outline-none focus:border-[#1D4ED8]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 font-body text-xs font-bold text-[#1D4ED8]"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {error && <p className="font-body text-[13px] text-[#DC2626]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#EA7D0B] py-2.5 font-display text-sm font-extrabold text-white disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-[#667085]">
        New to OwnerToBuyer?{" "}
        <a href="/signup" className="font-bold text-[#1D4ED8]">
          Create an account
        </a>
      </p>
    </div>
  );
}
