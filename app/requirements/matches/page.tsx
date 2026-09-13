import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { resolveCardMedia } from "@/lib/property-media";
import { MatchingPropertyCard, type MatchedProperty } from "@/components/MatchingPropertyCard";

export default async function RequirementMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ requirement?: string }>;
}) {
  const { requirement: requirementFilter } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: requirements } = await supabase
    .from("buyer_requirements")
    .select("id, title")
    .eq("buyer_id", user.id);

  const requirementIds = (requirements ?? []).map((r) => r.id);
  const requirementById = new Map((requirements ?? []).map((r) => [r.id, r]));

  let matches: { id: string; score: number; reasons: string[]; requirement_id: string; properties: MatchedProperty | null }[] = [];

  if (requirementIds.length > 0) {
    let query = supabase
      .from("requirement_matches")
      .select(
        `id, score, reasons, requirement_id,
         properties(id, title, slug, price, price_type, size, size_unit, bedrooms, bathrooms, seller_type,
           cities(name), areas(name), societies(name),
           property_media(storage_path, media_type, is_primary, sort_order))`
      )
      .in("requirement_id", requirementIds)
      .order("score", { ascending: false });

    if (requirementFilter) query = query.eq("requirement_id", requirementFilter);

    const { data } = await query;
    matches = (data ?? []) as unknown as typeof matches;
  }

  const liveMatches = matches.filter((m) => m.properties != null) as (typeof matches[number] & { properties: MatchedProperty })[];
  const cardMedia = await resolveCardMedia(
    supabase,
    liveMatches.map((m) => m.properties)
  );

  return (
    <div className="flex flex-1 flex-col bg-[#F7F9FC] pb-10 font-body">
      <SiteHeader />

      <div className="mx-auto w-full max-w-[900px] px-6 pt-8">
        <div className="mb-1 flex items-center gap-2.5">
          <a href="/requirements" className="font-body text-sm text-[#667085] hover:text-[#0B2545]">
            My Requirements
          </a>
          <span className="text-[#98A2B3]">/</span>
          <span className="font-body text-sm font-semibold text-[#0B2545]">Matching Properties</span>
        </div>
        <h1 className="mb-1 font-display text-xl font-bold text-[#101828]">Matching Properties</h1>
        <p className="mb-6 font-body text-sm text-[#667085]">
          Live listings our matching engine found for your requirements — ranked by how closely they fit.
        </p>

        {requirementFilter && requirementById.has(requirementFilter) && (
          <div className="mb-5 flex items-center gap-2 rounded-lg bg-[#EFF6FF] px-3.5 py-2.5 font-body text-[13px] text-[#1D4ED8]">
            Showing matches for &ldquo;{requirementById.get(requirementFilter)?.title}&rdquo; only.
            <a href="/requirements/matches" className="ml-auto font-bold underline">
              Clear
            </a>
          </div>
        )}

        {liveMatches.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
            <h3 className="mb-2 font-display text-base font-bold text-[#101828]">No matching properties yet</h3>
            <p className="mx-auto max-w-[380px] text-sm text-[#667085]">
              We automatically rescan every time a new property is listed — this page fills in on its own, nothing
              to do here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {liveMatches.map((m) => (
              <MatchingPropertyCard
                key={m.id}
                score={m.score}
                reasons={m.reasons}
                property={m.properties}
                photoUrl={cardMedia.get(m.properties.id)?.photoUrl}
              />
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
