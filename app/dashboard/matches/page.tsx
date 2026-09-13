import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { PotentialBuyerCard, type PotentialBuyerMatch } from "@/components/PotentialBuyerCard";

export default async function DashboardMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>;
}) {
  const { property: propertyFilter } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: properties } = await supabase
    .from("properties")
    .select("id, title, slug")
    .eq("seller_id", user.id)
    .neq("status", "DELETED")
    .order("created_at", { ascending: false });

  const propertyIds = (properties ?? []).map((p) => p.id);
  const propertyById = new Map((properties ?? []).map((p) => [p.id, p]));

  let matches: (PotentialBuyerMatch & { property_id: string })[] = [];

  if (propertyIds.length > 0) {
    let query = supabase
      .from("requirement_matches")
      .select(
        `id, score, reasons, property_id,
         buyer_requirements(title, purpose, property_category, property_type,
           min_size, max_size, size_unit, min_budget, max_budget, payment_type,
           possession_required, expires_at,
           cities(name), areas(name), societies(name),
           profiles(full_name, phone_number))`
      )
      .in("property_id", propertyIds)
      .order("score", { ascending: false });

    if (propertyFilter) query = query.eq("property_id", propertyFilter);

    const { data } = await query;
    matches = (data ?? []) as unknown as typeof matches;
  }

  return (
    <div className="flex flex-1 flex-col bg-[#F7F9FC] pb-10 font-body">
      <SiteHeader />

      <div className="mx-auto w-full max-w-[900px] px-6 pt-8">
        <div className="mb-1 flex items-center gap-2.5">
          <a href="/dashboard" className="font-body text-sm text-[#667085] hover:text-[#0B2545]">
            My Properties
          </a>
          <span className="text-[#98A2B3]">/</span>
          <span className="font-body text-sm font-semibold text-[#0B2545]">Potential Buyers</span>
        </div>
        <h1 className="mb-1 font-display text-xl font-bold text-[#101828]">Potential Buyers</h1>
        <p className="mb-6 font-body text-sm text-[#667085]">
          Buyer requirements our matching engine found for your listings — ranked by how closely they fit.
        </p>

        {propertyFilter && propertyById.has(propertyFilter) && (
          <div className="mb-5 flex items-center gap-2 rounded-lg bg-[#EFF6FF] px-3.5 py-2.5 font-body text-[13px] text-[#1D4ED8]">
            Showing matches for &ldquo;{propertyById.get(propertyFilter)?.title}&rdquo; only.
            <a href="/dashboard/matches" className="ml-auto font-bold underline">
              Clear
            </a>
          </div>
        )}

        {matches.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
            <h3 className="mb-2 font-display text-base font-bold text-[#101828]">No potential buyers yet</h3>
            <p className="mx-auto max-w-[380px] text-sm text-[#667085]">
              We automatically rescan every time a buyer posts a requirement or your listings change — nothing to do
              here, this page will fill in on its own as matches appear.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {matches.map((m) => {
              const p = propertyById.get(m.property_id);
              if (!p) return null;
              return <PotentialBuyerCard key={m.id} match={m} property={p} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
