import type { createClient } from "@/lib/supabase/server";
import type { AccountType } from "@/lib/property-options";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Where a homepage "I have a property" / "I need a property" / etc. entry
// point sends an already-signed-in user, and where onboarding sends a
// brand-new one right after they pick a role. One place so the homepage
// CTAs and the onboarding redirect can't drift apart.
export const ROLE_PRIMARY_PATH: Record<AccountType, string> = {
  OWNER: "/properties/new",
  BUYER: "/requirements/new",
  DEVELOPER: "/dashboard",
};

export function isAccountType(value: string | null | undefined): value is AccountType {
  return value === "OWNER" || value === "BUYER" || value === "DEVELOPER";
}

export async function getAccountType(supabase: Supabase, userId: string): Promise<AccountType> {
  const { data } = await supabase.from("profiles").select("account_type").eq("id", userId).maybeSingle();
  return isAccountType(data?.account_type) ? data.account_type : "OWNER";
}
