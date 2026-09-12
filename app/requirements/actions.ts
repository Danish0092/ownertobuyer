"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error: string } | { ok: true };

export async function pauseRequirement(requirementId: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("buyer_requirements")
    .update({ status: "PAUSED" })
    .eq("id", requirementId)
    .eq("buyer_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/requirements");
  return { ok: true };
}

export async function reactivateRequirement(requirementId: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: existing } = await supabase
    .from("buyer_requirements")
    .select("expires_at")
    .eq("id", requirementId)
    .eq("buyer_id", user.id)
    .maybeSingle();

  // Reactivating an already-expired requirement needs a fresh expiry,
  // or the matching trigger would immediately treat it as expired
  // again and clear any matches right back out.
  const needsFreshExpiry = !existing?.expires_at || new Date(existing.expires_at) <= new Date();
  const update: { status: string; expires_at?: string } = { status: "ACTIVE" };
  if (needsFreshExpiry) {
    update.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  const { error } = await supabase
    .from("buyer_requirements")
    .update(update)
    .eq("id", requirementId)
    .eq("buyer_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/requirements");
  return { ok: true };
}

// Soft-delete, matching the same pattern properties uses (a status
// value, not an actual SQL DELETE) — CANCELLED keeps the row around
// for the buyer's own history instead of losing it outright.
export async function cancelRequirement(requirementId: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("buyer_requirements")
    .update({ status: "CANCELLED" })
    .eq("id", requirementId)
    .eq("buyer_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/requirements");
  return { ok: true };
}
