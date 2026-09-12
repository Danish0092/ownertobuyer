"use server";

import { createClient } from "@/lib/supabase/server";
import { parseRequirementForm } from "@/lib/parse-requirement-form";

export type RequirementActionResult = { error: string } | { ok: true } | null;

const EXPIRY_DAYS = [30, 60, 90] as const;

export async function createRequirement(
  _prev: RequirementActionResult,
  formData: FormData
): Promise<RequirementActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in to post a requirement." };

  const parsed = parseRequirementForm(formData);
  if ("error" in parsed) return parsed;

  const expiryDays = Number(formData.get("expiry_days") ?? "30");
  if (!EXPIRY_DAYS.includes(expiryDays as (typeof EXPIRY_DAYS)[number])) {
    return { error: "Invalid expiry period." };
  }
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("buyer_requirements").insert({
    ...parsed.fields,
    buyer_id: user.id,
    status: "ACTIVE",
    expires_at: expiresAt,
  });

  if (error) return { error: error.message };

  return { ok: true };
}
