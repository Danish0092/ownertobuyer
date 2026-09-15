import type { AccountType } from "@/lib/property-options";

// Where a homepage "I have a property" / "I need a property" / etc. entry
// point sends an already-signed-in user, and where onboarding sends a
// brand-new one right after they pick a role. One place so the homepage
// CTAs and the onboarding redirect can't drift apart.
export const ROLE_PRIMARY_PATH: Record<AccountType, string> = {
  OWNER: "/properties/new",
  BUYER: "/requirements/new",
  DEALER: "/dashboard",
  DEVELOPER: "/dashboard",
};

export function isAccountType(value: string | null | undefined): value is AccountType {
  return value === "OWNER" || value === "BUYER" || value === "DEALER" || value === "DEVELOPER";
}
