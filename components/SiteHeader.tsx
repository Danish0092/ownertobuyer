import { createClient } from "@/lib/supabase/server";

// Shared top nav — used on Home, Search, and PropertyDetail. An async
// Server Component (not a layout) because each of those pages has its
// own distinct hero/header background right underneath it in the
// design; this only owns the nav bar itself.
export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initial = "OT";
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    initial = (profile?.full_name || "?").charAt(0).toUpperCase();
  }

  return (
    <header className="sticky top-0 z-50 flex items-center gap-6 border-b border-[#EAEFF6] bg-white px-7 py-3.5 shadow-[0_2px_10px_rgba(16,24,40,0.04)]">
      <a href="/" className="font-display text-[19px] font-extrabold text-[#0B2545]">
        OwnerTo<span className="text-[#F59E0B]">Buyer</span>
      </a>
      <nav className="ml-3 hidden flex-wrap gap-5 lg:flex">
        <a href="/search?purpose=SALE" className="font-body text-sm text-[#667085] transition-colors hover:text-[#0B2545]">
          Buy
        </a>
        <a href="/search?purpose=RENT" className="font-body text-sm text-[#667085] transition-colors hover:text-[#0B2545]">
          Rent
        </a>
        <a href="/search?seller=OWNER" className="font-body text-sm text-[#667085] transition-colors hover:text-[#0B2545]">
          Owner Direct
        </a>
        <span className="font-body text-sm text-[#98A2B3]">Property Videos</span>
        <a href="/saved" className="font-body text-sm text-[#667085] transition-colors hover:text-[#0B2545]">
          Saved
        </a>
        {user && (
          <a href="/dashboard" className="font-body text-sm text-[#667085] transition-colors hover:text-[#0B2545]">
            My Properties
          </a>
        )}
      </nav>
      <div className="ml-auto flex items-center gap-2.5">
        <a
          href="/properties/new"
          className="whitespace-nowrap rounded-[10px] bg-gradient-to-br from-[#F59E0B] to-[#EA7D0B] px-4.5 py-2.5 font-display text-[13px] font-extrabold text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)]"
        >
          Post Property FREE
        </a>
        <a
          href={user ? "/profile" : "/login"}
          className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#EFF6FF] font-display text-[13px] font-extrabold text-[#1D4ED8]"
        >
          {initial}
        </a>
      </div>
    </header>
  );
}
