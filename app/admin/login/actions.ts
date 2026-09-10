"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminLoginResult = { error: string } | null;

// Deliberately generic on every failure path — wrong password, unknown
// email, and "correct password but not an admin" all return the same
// message. Distinguishing them would let this form be used to probe
// which emails exist or which accounts hold the ADMIN role.
const DENIED = "Invalid credentials or insufficient permissions.";

export async function adminLogin(_prev: AdminLoginResult, formData: FormData): Promise<AdminLoginResult> {
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return { error: DENIED };
  }

  const supabase = await createClient();

  // Reuses the same Supabase Auth used by the normal /login flow — this
  // is not a second authentication system, just an extra role check
  // layered on top of it.
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: DENIED };

  // The role never comes from the client — it's re-derived server-side
  // from the session that Supabase Auth just verified, via the
  // SECURITY DEFINER is_admin() function backed by user_roles.
  const [{ data: isAdmin }, { data: profile }] = await Promise.all([
    supabase.rpc("is_admin"),
    supabase.from("profiles").select("is_blocked").eq("id", data.user.id).maybeSingle(),
  ]);
  if (!isAdmin || profile?.is_blocked) {
    // Valid credentials, but not an admin (or a blocked account): don't
    // leave them signed in under an admin-attempted session.
    await supabase.auth.signOut();
    return { error: DENIED };
  }

  redirect("/admin");
}
