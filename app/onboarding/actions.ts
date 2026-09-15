"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACCOUNT_TYPES } from "@/lib/property-options";
import { ROLE_PRIMARY_PATH } from "@/lib/auth-roles";

export type OnboardingResult = { error: string } | null;

export async function completeOnboarding(_prev: OnboardingResult, formData: FormData): Promise<OnboardingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const accountType = formData.get("account_type");
  if (typeof accountType !== "string" || !ACCOUNT_TYPES.includes(accountType as (typeof ACCOUNT_TYPES)[number])) {
    return { error: "Please choose an option." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ account_type: accountType, onboarding_completed: true })
    .eq("id", user.id);

  if (error) return { error: error.message };

  redirect(ROLE_PRIMARY_PATH[accountType as keyof typeof ROLE_PRIMARY_PATH]);
}
