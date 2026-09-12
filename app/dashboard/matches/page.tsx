import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { priceRangeLabel, sizeRangeLabel } from "@/lib/format";
import { labelize } from "@/lib/property-options";

const SCORE_STYLE = (score: number) =>
  score >= 80
    ? { bg: "#DCFCE7", fg: "#15803D" }
    : score >= 65
      ? { bg: "#FFF7E6", fg: "#B45309" }
      : { bg: "#EFF6FF", fg: "#1D4ED8" };

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

  let matches: {
    id: string;
    score: number;
    reasons: string[];
    property_id: string;
    buyer_requirements: {
      title: string;
      purpose: string;
      property_category: string | null;
      property_type: string | null;
      min_size: number | null;
      max_size: number | null;
      size_unit: string | null;
      min_budget: number;
      max_budget: number;
      payment_type: string;
      possession_required: boolean;
      expires_at: string | null;
      cities: { name: string } | null;
      areas: { name: string } | null;
      societies: { name: string } | null;
    } | null;
  }[] = [];

  if (propertyIds.length > 0) {
    let query = supabase
      .from("requirement_matches")
      .select(
        `id, score, reasons, property_id,
         buyer_requirements(title, purpose, property_category, property_type,
           min_size, max_size, size_unit, min_budget, max_budget, payment_type,
           possession_required, expires_at,
           cities(name), areas(name), societies(name))`
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
              const r = m.buyer_requirements;
              const p = propertyById.get(m.property_id);
              if (!r || !p) return null;
              const style = SCORE_STYLE(m.score);
              const sizeLabel = sizeRangeLabel(r.min_size, r.max_size, r.size_unit);
              const location = [r.societies?.name, r.areas?.name, r.cities?.name].filter(Boolean).join(", ");

              return (
                <div
                  key={m.id}
                  className="flex flex-col gap-3.5 rounded-2xl border border-[#EAEFF6] bg-white p-5 shadow-[0_6px_18px_rgba(16,24,40,0.06)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-display text-xs font-bold uppercase tracking-wide text-[#0F766E]">
                        Potential Buyer Found
                      </div>
                      <a href={`/properties/${p.slug}`} className="font-body text-[13px] text-[#667085] hover:underline">
                        for &ldquo;{p.title}&rdquo;
                      </a>
                    </div>
                    <span
                      className="rounded-full px-3 py-1.5 font-display text-sm font-extrabold"
                      style={{ background: style.bg, color: style.fg }}
                    >
                      {m.score}% Match
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl bg-[#F8FAFC] p-4 text-[13px] text-[#344054] sm:grid-cols-3">
                    <div>
                      <div className="text-[11px] font-bold uppercase text-[#98A2B3]">Looking to</div>
                      {r.purpose === "SALE" ? "Buy" : "Rent"}
                      {r.property_type ? ` a ${labelize(r.property_type)}` : ""}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase text-[#98A2B3]">Location</div>
                      {location || "Any area"}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase text-[#98A2B3]">Budget</div>
                      {priceRangeLabel(r.min_budget, r.max_budget)}
                    </div>
                    {sizeLabel && (
                      <div>
                        <div className="text-[11px] font-bold uppercase text-[#98A2B3]">Size</div>
                        {sizeLabel}
                      </div>
                    )}
                    <div>
                      <div className="text-[11px] font-bold uppercase text-[#98A2B3]">Payment</div>
                      {labelize(r.payment_type)}
                    </div>
                    {r.possession_required && (
                      <div>
                        <div className="text-[11px] font-bold uppercase text-[#98A2B3]">Possession</div>
                        Needed immediately
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {m.reasons.map((reason) => (
                      <span
                        key={reason}
                        className="rounded-full bg-[#ECFDF5] px-2.5 py-1 font-body text-[12px] font-medium text-[#15803D]"
                      >
                        ✓ {reason}
                      </span>
                    ))}
                  </div>

                  <p className="text-[11.5px] text-[#98A2B3]">
                    This is what the buyer is looking for, not who they are — direct contact between matched buyers
                    and sellers isn&apos;t available yet.
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
