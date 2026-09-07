import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Handles the link Supabase's default auth email templates point to:
// {{ .SiteURL }}/auth/confirm?token_hash=...&type=...
// Verifying here (server-side) lets us set the session as cookies via
// lib/supabase/server.ts, which a plain client-side hash-fragment
// parse would not do for a server-rendered app.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(next);
    }
  }

  redirect("/login?error=invalid_or_expired_link");
}
