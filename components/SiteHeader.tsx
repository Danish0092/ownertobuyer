import { createClient } from "@/lib/supabase/server";
import { getAccountType } from "@/lib/auth-roles";
import { LogoutButton } from "@/components/LogoutButton";
import { MobileNav } from "@/components/MobileNav";
import { PUBLIC_NAV_ITEMS, AUTHENTICATED_NAV_ITEMS, getRoleNavItems, PRIMARY_CTA } from "@/lib/nav-config";

// Shared top nav — used on Home, Search, and PropertyDetail. An async
// Server Component (not a layout) because each of those pages has its
// own distinct hero/header background right underneath it in the
// design; this only owns the nav bar itself.
//
// Nav items are role-aware (lib/nav-config.ts): the public marketplace
// links are always shown, but the management items (My Properties vs.
// Properties I Represent vs. My Projects, etc.) and the primary CTA
// button change based on the signed-in user's account_type. This is
// UI-only — the actual authorization for the management routes lives
// server-side (lib/supabase/proxy.ts + each page), so this nav can't
// be relied on as the security boundary, only as not-misleading.
export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initial = "OT";
  let navItems = [...PUBLIC_NAV_ITEMS];
  let cta = { label: "Post Property FREE", href: "/properties/new" };

  if (user) {
    const [{ data: profile }, accountType] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      getAccountType(supabase, user.id),
    ]);
    initial = (profile?.full_name || "?").charAt(0).toUpperCase();
    navItems = [...PUBLIC_NAV_ITEMS, ...AUTHENTICATED_NAV_ITEMS, ...getRoleNavItems(accountType)];
    cta = PRIMARY_CTA[accountType];
  }

  return (
    <header className="sticky top-0 z-50 flex items-center gap-3 border-b border-[#EAEFF6] bg-white px-4 sm:px-7 py-3.5 shadow-[0_2px_10px_rgba(16,24,40,0.04)]">
      <MobileNav items={navItems} cta={cta} signedIn={!!user} />
      <a href="/" className="font-display text-[19px] font-extrabold text-[#0B2545]">
        OwnerTo<span className="text-[#F59E0B]">Buyer</span>
      </a>
      <nav className="ml-6 hidden flex-wrap gap-5 lg:flex">
        {navItems.map((item) =>
          item.disabled ? (
            <span key={item.label} className="font-body text-sm text-[#98A2B3]">
              {item.label}
            </span>
          ) : (
            <a
              key={item.label}
              href={item.href}
              className="font-body text-sm text-[#667085] transition-colors hover:text-[#0B2545]"
            >
              {item.label}
            </a>
          )
        )}
      </nav>
      <div className="ml-auto flex items-center gap-2.5">
        <a
          href={cta.href}
          className="hidden whitespace-nowrap sm:block rounded-[10px] bg-gradient-to-br from-[#F59E0B] to-[#EA7D0B] px-4.5 py-2.5 font-display text-[13px] font-extrabold text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)]"
        >
          {cta.label}
        </a>
        <a
          href={user ? "/profile" : "/login"}
          className="hidden h-[38px] w-[38px] items-center justify-center rounded-full bg-[#EFF6FF] sm:flex font-display text-[13px] font-extrabold text-[#1D4ED8]"
        >
          {initial}
        </a>
        {user && (
          <>
            <LogoutButton variant="icon" className="sm:hidden" />
            <LogoutButton variant="text" className="hidden sm:block" />
          </>
        )}
      </div>
    </header>
  );
}
