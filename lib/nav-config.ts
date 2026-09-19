import type { AccountType } from "@/lib/property-options";

export type NavItem = { label: string; href: string; disabled?: boolean };

// The public marketplace (browse/search/projects) is never role-gated —
// every authenticated user, and anonymous visitors, can see these. Only
// the management-oriented items below differ per role. See
// lib/supabase/proxy.ts for the server-side enforcement that backs this
// up (a role mismatch on a management route redirects away, this config
// just keeps the nav from ever offering a link you'd get bounced from).
export const PUBLIC_NAV_ITEMS: NavItem[] = [
  { label: "Buy", href: "/search" },
  { label: "Rent", href: "/search?purpose=RENT" },
  { label: "Projects", href: "/projects" },
];

// Shown to any authenticated user regardless of role — bookmarking a
// listing while browsing isn't a management action.
export const AUTHENTICATED_NAV_ITEMS: NavItem[] = [{ label: "Saved", href: "/saved" }];

// Role-specific management nav — this is the part that actually
// differs, matching each role's dashboard branch in app/dashboard/page.tsx.
export function getRoleNavItems(accountType: AccountType): NavItem[] {
  switch (accountType) {
    case "OWNER":
    case "DEALER":
      return [
        { label: "My Properties", href: "/dashboard" },
        { label: "Buyer Matches", href: "/dashboard/matches" },
      ];
    case "BUYER":
      return [
        { label: "My Requirements", href: "/requirements" },
        { label: "Matching Properties", href: "/requirements/matches" },
      ];
    case "DEVELOPER":
      return [
        { label: "My Projects", href: "/dashboard" },
        { label: "Leads", href: "#", disabled: true },
      ];
  }
}

export const PRIMARY_CTA: Record<AccountType, { label: string; href: string }> = {
  OWNER: { label: "Post Property FREE", href: "/properties/new" },
  DEALER: { label: "Post Property FREE", href: "/properties/new" },
  BUYER: { label: "+ Post Requirement", href: "/requirements/new" },
  DEVELOPER: { label: "+ Create Project", href: "/projects/new" },
};
