import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { priceLabel, areaLine } from "@/lib/format";
import { labelize } from "@/lib/property-options";
import { logoutAction } from "./actions";
import { DeletePropertyButton } from "./DeletePropertyButton";

const TABS = [
  { value: "ALL", label: "All", statuses: null },
  { value: "PUBLISHED", label: "Published", statuses: ["PUBLISHED"] },
  { value: "DRAFT", label: "Draft", statuses: ["DRAFT"] },
  { value: "SOLD_RENTED", label: "Sold / Rented", statuses: ["SOLD", "RENTED"] },
  { value: "HIDDEN", label: "Hidden", statuses: ["HIDDEN"] },
] as const;

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  PUBLISHED: { bg: "#DCFCE7", fg: "#15803D" },
  DRAFT: { bg: "#FFF7E6", fg: "#B45309" },
  PENDING_REVIEW: { bg: "#FFF7E6", fg: "#B45309" },
};
const DEFAULT_STATUS_STYLE = { bg: "#F1F5F9", fg: "#475467" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = TABS.find((t) => t.value === tab) ?? TABS[0];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, account_type, phone_verified")
    .eq("id", user.id)
    .single();

  let propertiesQuery = supabase
    .from("properties")
    .select(
      "id, title, slug, price, price_type, status, views_count, cities(name), areas(name), societies(name)"
    )
    .eq("seller_id", user.id)
    .neq("status", "DELETED")
    .order("created_at", { ascending: false });

  if (activeTab.statuses) {
    propertiesQuery = propertiesQuery.in("status", activeTab.statuses);
  }

  const { data: properties } = await propertiesQuery;

  const propertyIds = (properties ?? []).map((p) => p.id);
  const contactCounts = new Map<string, { whatsapp: number; call: number }>();
  if (propertyIds.length > 0) {
    const { data: contacts } = await supabase
      .from("property_contacts")
      .select("property_id, contact_type")
      .in("property_id", propertyIds);
    for (const c of contacts ?? []) {
      const entry = contactCounts.get(c.property_id) ?? { whatsapp: 0, call: 0 };
      if (c.contact_type === "WHATSAPP") entry.whatsapp++;
      if (c.contact_type === "CALL") entry.call++;
      contactCounts.set(c.property_id, entry);
    }
  }

  // All of a seller's own properties are covered by "seller_id = my
  // own id", not just the ones on this tab, so this stays accurate
  // regardless of which status filter is active above.
  const matchCounts = new Map<string, number>();
  let totalMatches = 0;
  {
    const { data: allOwnPropertyIds } = await supabase.from("properties").select("id").eq("seller_id", user.id);
    const ids = (allOwnPropertyIds ?? []).map((p) => p.id);
    if (ids.length > 0) {
      const { data: matches } = await supabase.from("requirement_matches").select("property_id").in("property_id", ids);
      for (const m of matches ?? []) {
        matchCounts.set(m.property_id, (matchCounts.get(m.property_id) ?? 0) + 1);
        totalMatches++;
      }
    }
  }

  const userInitial = (profile?.full_name || "?").charAt(0).toUpperCase();

  return (
    <div className="flex flex-1 flex-col bg-[#F7F9FC] pb-6 font-body">
      <SiteHeader />

      <div className="bg-gradient-to-r from-[#0B2545] to-[#1D4ED8] px-6 py-8">
        <div className="mx-auto flex max-w-[1140px] items-center gap-3.5">
          <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-white/16 font-display text-xl font-extrabold text-white">
            {userInitial}
          </div>
          <div>
            <div className="font-display text-lg font-extrabold text-white">
              {profile?.full_name ?? "User"}
            </div>
            <div className="text-[12.5px] text-[#B7D4FF]">
              {profile?.account_type === "DEALER" ? "Dealer" : "Owner"} • Mobile{" "}
              {profile?.phone_verified ? "verified ✓" : "not verified"}
            </div>
          </div>
          <form action={logoutAction} className="ml-auto">
            <button
              type="submit"
              className="rounded-[10px] bg-white/12 px-4 py-2.5 font-display text-[12.5px] font-bold text-white"
            >
              Logout
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1140px] flex-wrap items-center justify-between gap-2.5 px-6 pt-6">
        <h3 className="m-0 font-display text-lg font-bold text-[#101828]">My Properties</h3>
        <div className="flex items-center gap-2.5">
          {totalMatches > 0 && (
            <a
              href="/dashboard/matches"
              className="rounded-[10px] bg-[#ECFDF5] px-4 py-2.5 font-display text-[13px] font-bold text-[#15803D]"
            >
              🎯 {totalMatches} Potential Buyer{totalMatches === 1 ? "" : "s"}
            </a>
          )}
          <a
            href="/properties/new"
            className="rounded-[10px] bg-gradient-to-br from-[#F59E0B] to-[#EA7D0B] px-5 py-2.5 font-display text-[13px] font-extrabold text-white"
          >
            + Post New Property
          </a>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1140px] gap-2 overflow-x-auto px-6 pt-4">
        {TABS.map((t) => (
          <a
            key={t.value}
            href={t.value === "ALL" ? "/dashboard" : `/dashboard?tab=${t.value}`}
            className="flex-none rounded-full px-4 py-2 font-display text-[12.5px] font-bold"
            style={
              activeTab.value === t.value
                ? { background: "linear-gradient(135deg,#2563EB,#1D4ED8)", color: "#fff" }
                : { background: "#EEF2F7", color: "#475467" }
            }
          >
            {t.label}
          </a>
        ))}
      </div>

      {properties && properties.length > 0 ? (
        <div className="mx-auto grid w-full max-w-[1140px] grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 px-6 pt-4.5">
          {properties.map((p) => {
            const style = STATUS_STYLE[p.status] ?? DEFAULT_STATUS_STYLE;
            const counts = contactCounts.get(p.id) ?? { whatsapp: 0, call: 0 };
            return (
              <div
                key={p.id}
                className="flex flex-col gap-2 rounded-2xl border border-[#EAEFF6] bg-white p-4.5 shadow-[0_6px_18px_rgba(16,24,40,0.06)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-display text-[15px] font-bold text-[#101828]">{p.title}</div>
                    <div className="text-xs text-[#667085]">
                      {areaLine(p.societies?.name, p.areas?.name, p.cities?.name)}
                    </div>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 font-display text-[11px] font-bold"
                    style={{ background: style.bg, color: style.fg }}
                  >
                    {labelize(p.status)}
                  </span>
                </div>
                <div className="font-display text-[17px] font-extrabold text-[#0B2545]">
                  {priceLabel(p.price, p.price_type)}
                </div>
                <div className="flex gap-3.5 text-xs text-[#667085]">
                  <span>👁 {p.views_count} views</span>
                  <span>💬 {counts.whatsapp}</span>
                  <span>📞 {counts.call}</span>
                </div>
                {(matchCounts.get(p.id) ?? 0) > 0 && (
                  <a
                    href={`/dashboard/matches?property=${p.id}`}
                    className="self-start rounded-full bg-[#ECFDF5] px-2.5 py-1 font-display text-[11px] font-bold text-[#15803D]"
                  >
                    🎯 {matchCounts.get(p.id)} potential buyer{matchCounts.get(p.id) === 1 ? "" : "s"}
                  </a>
                )}
                <div className="mt-1 flex gap-2">
                  <a
                    href={`/properties/${p.slug}/edit`}
                    className="flex-1 rounded-[9px] bg-[#EFF6FF] py-2.5 text-center font-display text-[12.5px] font-bold text-[#1D4ED8]"
                  >
                    Edit
                  </a>
                  <DeletePropertyButton propertyId={p.id} title={p.title} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-6 py-16 text-center text-[#667085]">
          <h4 className="mb-3 font-display text-base font-bold text-[#101828]">
            {activeTab.value === "ALL"
              ? "You haven't posted any properties yet."
              : `No properties in "${activeTab.label}".`}
          </h4>
          <a
            href="/properties/new"
            className="inline-block rounded-[10px] bg-gradient-to-br from-[#F59E0B] to-[#EA7D0B] px-5.5 py-3 font-display text-[13.5px] font-extrabold text-white"
          >
            Post Property FREE
          </a>
        </div>
      )}
    </div>
  );
}
