"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Real email/password signup. Phone signup is shown as a tab so the
// entry point exists in the UI, but stays disabled until an SMS
// provider is wired into Supabase Auth (no phone auth backend exists
// yet — see FEATURES.md "Explicitly NOT Built Yet").
export function SignupForm({ initialRole }: { initialRole: string | null }) {
  const supabase = createClient();
  const router = useRouter();

  const [method, setMethod] = useState<"email" | "phone">("email");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const onboardingNext = initialRole ? `/onboarding?role=${initialRole}` : "/onboarding";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(onboardingNext)}`,
      },
    });

    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // If email confirmation is disabled on the project, signUp returns an
    // active session immediately — no need to make the user check email.
    if (data.session) {
      router.push(onboardingNext);
      router.refresh();
      return;
    }

    setAwaitingConfirmation(true);
  }

  if (awaitingConfirmation) {
    return (
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
        <h1 className="mb-2 font-display text-xl font-bold text-[#101828]">Check your email</h1>
        <p className="text-sm text-[#667085]">
          We sent a confirmation link to <strong>{email}</strong>. Click it to verify your account and choose how
          you&apos;ll use OwnerToBuyer.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
      <h1 className="mb-1 font-display text-xl font-bold text-[#101828]">Create your account</h1>
      <p className="mb-6 text-sm text-[#667085]">Free to join. No agency, no commission.</p>

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
          Phone signup is coming soon. Please continue with email for now.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <Field label="Full name">
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-[#D0D5DD] px-3.5 py-2.5 text-sm text-[#101828] outline-none focus:border-[#1D4ED8]"
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-[#D0D5DD] px-3.5 py-2.5 text-sm text-[#101828] outline-none focus:border-[#1D4ED8]"
            />
          </Field>

          <Field label="Password">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
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
          </Field>

          <Field label="Confirm password">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full rounded-lg border border-[#D0D5DD] px-3.5 py-2.5 text-sm text-[#101828] outline-none focus:border-[#1D4ED8]"
            />
          </Field>

          {error && <p className="font-body text-[13px] text-[#DC2626]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#EA7D0B] py-2.5 font-display text-sm font-extrabold text-white disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-[#667085]">
        Already have an account?{" "}
        <a href="/login" className="font-bold text-[#1D4ED8]">
          Sign in
        </a>
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-display text-[12.5px] font-bold text-[#344054]">{label}</span>
      {children}
    </label>
  );
}
