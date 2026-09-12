"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseRequirementForm } from "@/lib/parse-requirement-form";
import type { RequirementActionResult } from "@/app/requirements/new/actions";

const EXPIRY_DAYS = [30, 60, 90] as const;

// Saving an edit always recomputes expires_at from today using the
// selected expiry option, rather than leaving the original expiry
// untouched — editing is treated as a natural "renew" point, which
// keeps the expiry model simple (one field, always relative to the
// last save) instead of needing to track "did they actually change
// this dropdown".
export async function updateRequirement(
  requirementId: string,
  _prevState: RequirementActionResult,
  formData: FormData
): Promise<RequirementActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const parsed = parseRequirementForm(formData);
  if ("error" in parsed) return parsed;

  const expiryDays = Number(formData.get("expiry_days") ?? "30");
  if (!EXPIRY_DAYS.includes(expiryDays as (typeof EXPIRY_DAYS)[number])) {
    return { error: "Invalid expiry period." };
  }
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();

  // RLS ("Buyer requirements update: own or admin") already enforces
  // buyer_id = auth.uid() at the database level — the .eq below is
  // belt-and-braces, same reasoning as updateProperty.
  const { error } = await supabase
    .from("buyer_requirements")
    .update({ ...parsed.fields, expires_at: expiresAt })
    .eq("id", requirementId)
    .eq("buyer_id", user.id);

  if (error) return { error: error.message };

  redirect("/requirements");
}
