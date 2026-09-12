import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { priceRangeLabel, sizeRangeLabel } from "@/lib/format";
import { labelize } from "@/lib/property-options";
import { RequirementActions } from "./RequirementActions";

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  ACTIVE: { bg: "#DCFCE7", fg: "#15803D" },
  PAUSED: { bg: "#FFF7E6", fg: "#B45309" },
  FULFILLED: { bg: "#EFF6FF", fg: "#1D4ED8" },
  EXPIRED: { bg: "#F1F5F9", fg: "#475467" },
  CANCELLED: { bg: "#F1F5F9", fg: "#98A2B3" },
};

export default async function MyRequirementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: requirements } = await supabase
    .from("buyer_requirements")
    .select(
      `id, title, purpose, property_type, min_budget, max_budget, min_size, max_size, size_unit,
       status, expires_at, created_at, cities(name), areas(name), societies(name)`
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  const ids = (requirements ?? []).map((r) => r.id);
  const matchCounts = new Map<string, number>();
  if (ids.length > 0) {
    const { data: matches } = await supabase.from("requirement_matches").select("requirement_id").in("requirement_id", ids);
    for (const m of matches ?? []) {
      matchCounts.set(m.requirement_id, (matchCounts.get(m.requirement_id) ?? 0) + 1);
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-[#F7F9FC] pb-10 font-body">
      <SiteHeader />

      <div className="mx-auto w-full max-w-[900px] px-6 pt-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2.5">
          <h1 className="m-0 font-display text-xl font-bold text-[#101828]">My Requirements</h1>
          <a
            href="/requirements/new"
            className="rounded-[10px] bg-gradient-to-br from-[#F59E0B] to-[#EA7D0B] px-5 py-2.5 font-display text-[13px] font-extrabold text-white"
          >
            + Post New Requirement
          </a>
        </div>

        {!requirements || requirements.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
            <h3 className="mb-2 font-display text-base font-bold text-[#101828]">
              You haven&apos;t posted any requirements yet.
            </h3>
            <p className="mx-auto mb-5 max-w-[380px] text-sm text-[#667085]">
              Tell us what you&apos;re looking for and we&apos;ll alert you the moment a matching property is
              listed.
            </p>
            <a
              href="/requirements/new"
              className="inline-block rounded-[10px] bg-gradient-to-br from-[#F59E0B] to-[#EA7D0B] px-5.5 py-3 font-display text-[13.5px] font-extrabold text-white"
            >
              Post Requirement — FREE
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {requirements.map((r) => {
              const style = STATUS_STYLE[r.status] ?? STATUS_STYLE.ACTIVE;
              const location = [r.societies?.name, r.areas?.name, r.cities?.name].filter(Boolean).join(", ");
              const sizeLabel = sizeRangeLabel(r.min_size, r.max_size, r.size_unit);
              const matchCount = matchCounts.get(r.id) ?? 0;
              const expired = r.expires_at ? new Date(r.expires_at) <= new Date() : false;

              return (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 rounded-2xl border border-[#EAEFF6] bg-white p-4.5 shadow-[0_6px_18px_rgba(16,24,40,0.06)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-display text-[15px] font-bold text-[#101828]">{r.title}</div>
                      <div className="text-xs text-[#667085]">
                        {r.purpose === "SALE" ? "Buy" : "Rent"}
                        {r.property_type ? ` · ${labelize(r.property_type)}` : ""}
                        {location ? ` · ${location}` : ""}
                      </div>
                    </div>
                    <span
                      className="flex-none rounded-full px-2.5 py-1 font-display text-[11px] font-bold"
                      style={{ background: style.bg, color: style.fg }}
                    >
                      {expired && r.status === "ACTIVE" ? "Expired" : labelize(r.status)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-[#344054]">
                    <span className="font-display font-bold text-[#0B2545]">
                      {priceRangeLabel(r.min_budget, r.max_budget)}
                    </span>
                    {sizeLabel && <span>{sizeLabel}</span>}
                  </div>

                  {matchCount > 0 && (
                    <a
                      href={`/requirements/matches?requirement=${r.id}`}
                      className="self-start rounded-full bg-[#ECFDF5] px-2.5 py-1 font-display text-[11px] font-bold text-[#15803D]"
                    >
                      🎯 {matchCount} matching propert{matchCount === 1 ? "y" : "ies"} found
                    </a>
                  )}

                  <RequirementActions requirementId={r.id} status={r.status} />
                </div>
              );
            })}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
