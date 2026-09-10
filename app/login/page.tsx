"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Temporary email-link login while Phone OTP (the spec'd auth method)
// waits on a Twilio/SMS provider being configured in the Supabase
// dashboard. Nothing about the properties/profiles schema depends on
// which auth method is used — this can be swapped later without
// touching the database.
//
// Supabase's default email templates send a confirmation LINK, not a
// numeric code, so this is a single-step "check your email" flow. The
// link points at /auth/confirm, which verifies the token server-side
// and sets a proper cookie session (see app/auth/confirm/route.ts).
export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwLoading(true);
    setPwError(null);

    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setPwLoading(false);
      setPwError(error?.message ?? "Sign in failed.");
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("is_blocked").eq("id", data.user.id).maybeSingle();
    if (profile?.is_blocked) {
      await supabase.auth.signOut();
      setPwLoading(false);
      setPwError("This account has been blocked. Contact support if you think this is a mistake.");
      return;
    }

    setPwLoading(false);
    router.push("/properties/new");
    router.refresh();
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-sm rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-black">
        <h1 className="mb-1 text-xl font-semibold text-black dark:text-zinc-50">
          Sign in
        </h1>

        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded border border-black/[.15] px-3 py-2 text-sm dark:border-white/[.2] dark:bg-black dark:text-zinc-50"
        />

        <form onSubmit={signInWithPassword} className="mb-6 flex flex-col gap-3 border-b border-black/[.08] pb-6 dark:border-white/[.145]">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Testing login (password)
          </p>
          <input
            type="password"
            required
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border border-black/[.15] px-3 py-2 text-sm dark:border-white/[.2] dark:bg-black dark:text-zinc-50"
          />
          {pwError && <p className="text-sm text-red-600">{pwError}</p>}
          <button
            type="submit"
            disabled={pwLoading}
            className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            {pwLoading ? "Signing in..." : "Sign in with password"}
          </button>
          <p className="text-xs text-zinc-500">
            Create this account first in Supabase Dashboard →
            Authentication → Users → Add user (check &quot;Auto Confirm
            User&quot;).
          </p>
        </form>

        {sent ? (
          <p className="text-sm text-black dark:text-zinc-50">
            Check <strong>{email}</strong> and click the sign-in link we
            sent you. It will bring you back here, signed in.
          </p>
        ) : (
          <form onSubmit={sendLink} className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Email link (production)
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="rounded border border-black/[.15] px-4 py-2 text-sm font-medium text-black disabled:opacity-50 dark:border-white/[.2] dark:text-zinc-50"
            >
              {loading ? "Sending..." : "Send sign-in link instead"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
