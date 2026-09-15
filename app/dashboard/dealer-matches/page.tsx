import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { PotentialBuyerCard, type PotentialBuyerMatch } from "@/components/PotentialBuyerCard";
import { MatchingPropertyCard, type MatchedProperty } from "@/components/MatchingPropertyCard";
import { resolveCardMedia } from "@/lib/property-media";
import { getAccountType } from "@/lib/auth-roles";

// A Realtor operates on both sides of the matching engine at once —
// their represented properties (as seller) and the client requirements
// they post on a buyer's behalf (as buyer). Both already work exactly
// like an Owner's or Buyer's own matches (same tables, same RLS, same
// scoring), so this page is a straight union of what /dashboard/matches
// and /requirements/matches already show, not a new matching feature.
export default async function DealerMatchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // This consolidated view is Realtor/Dealer-specific — a Buyer or
  // Owner manually hitting this URL would only ever see their own
  // ownership-scoped (usually empty) data anyway, but it's still the
  // wrong dashboard for their role, so redirect them to their own.
  const accountType = await getAccountType(supabase, user.id);
  if (accountType !== "DEALER") redirect("/dashboard");

  const [{ data: properties }, { data: requirements }] = await Promise.all([
    supabase.from("properties").select("id, title, slug").eq("seller_id", user.id).neq("status", "DELETED"),
    supabase.from("buyer_requirements").select("id, title").eq("buyer_id", user.id),
  ]);

  const propertyIds = (properties ?? []).map((p) => p.id);
  const propertyById = new Map((properties ?? []).map((p) => [p.id, p]));
  const requirementIds = (requirements ?? []).map((r) => r.id);

  let sellerSideMatches: (PotentialBuyerMatch & { property_id: string })[] = [];
  if (propertyIds.length > 0) {
    const { data } = await supabase
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
    sellerSideMatches = (data ?? []) as unknown as typeof sellerSideMatches;
  }

  let buyerSideMatches: { id: string; score: number; reasons: string[]; requirement_id: string; properties: MatchedProperty | null }[] = [];
  if (requirementIds.length > 0) {
    const { data } = await supabase
      .from("requirement_matches")
      .select(
        `id, score, reasons, requirement_id,
         properties(id, title, slug, price, price_type, size, size_unit, bedrooms, bathrooms, seller_type,
           cities(name), areas(name), societies(name),
           property_media(storage_path, media_type, is_primary, sort_order))`
      )
      .in("requirement_id", requirementIds)
      .order("score", { ascending: false });
    buyerSideMatches = (data ?? []) as unknown as typeof buyerSideMatches;
  }
  const liveBuyerSideMatches = buyerSideMatches.filter((m) => m.properties != null) as (typeof buyerSideMatches[number] & {
    properties: MatchedProperty;
  })[];
  const cardMedia = await resolveCardMedia(
    supabase,
    liveBuyerSideMatches.map((m) => m.properties)
  );

  const totalMatches = sellerSideMatches.length + liveBuyerSideMatches.length;

  return (
    <div className="flex flex-1 flex-col bg-[#F7F9FC] pb-10 font-body">
      <SiteHeader />

      <div className="mx-auto w-full max-w-[900px] px-6 pt-8">
        <div className="mb-1 flex items-center gap-2.5">
          <a href="/dashboard" className="font-body text-sm text-[#667085] hover:text-[#0B2545]">
            Represented Properties
          </a>
          <span className="text-[#98A2B3]">/</span>
          <span className="font-body text-sm font-semibold text-[#0B2545]">Dealer Matches</span>
        </div>
        <h1 className="mb-1 font-display text-xl font-bold text-[#101828]">Dealer Matches</h1>
        <p className="mb-6 font-body text-sm text-[#667085]">
          Everything our matching engine found across both sides of your business — buyers for the properties you
          represent, and properties for the requirements you&apos;ve posted on your clients&apos; behalf.
        </p>

        {totalMatches === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
            <h3 className="mb-2 font-display text-base font-bold text-[#101828]">No matches yet</h3>
            <p className="mx-auto max-w-[380px] text-sm text-[#667085]">
              This fills in automatically as you add represented properties and client requirements — nothing to do
              here.
            </p>
          </div>
        ) : (
          <>
            <section className="mb-8">
              <h2 className="mb-3 font-display text-base font-bold text-[#101828]">
                Buyers for Your Represented Properties
                <span className="ml-2 font-body text-[13px] font-normal text-[#98A2B3]">({sellerSideMatches.length})</span>
              </h2>
              {sellerSideMatches.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {sellerSideMatches.map((m) => {
                    const p = propertyById.get(m.property_id);
                    if (!p) return null;
                    return <PotentialBuyerCard key={m.id} match={m} property={p} />;
                  })}
                </div>
              ) : (
                <p className="rounded-2xl bg-white px-5 py-6 text-sm text-[#98A2B3] shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
                  No buyer matches yet for your represented properties.
                </p>
              )}
            </section>

            <section>
              <h2 className="mb-3 font-display text-base font-bold text-[#101828]">
                Properties for Your Client Requirements
                <span className="ml-2 font-body text-[13px] font-normal text-[#98A2B3]">({liveBuyerSideMatches.length})</span>
              </h2>
              {liveBuyerSideMatches.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {liveBuyerSideMatches.map((m) => (
                    <MatchingPropertyCard
                      key={m.id}
                      score={m.score}
                      reasons={m.reasons}
                      property={m.properties}
                      photoUrl={cardMedia.get(m.properties.id)?.photoUrl}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl bg-white px-5 py-6 text-sm text-[#98A2B3] shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
                  No property matches yet for your client requirements.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
