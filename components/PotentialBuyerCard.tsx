import { priceRangeLabel, sizeRangeLabel } from "@/lib/format";
import { labelize } from "@/lib/property-options";
import { ContactBuyerButtons } from "@/components/ContactBuyerButtons";

const SCORE_STYLE = (score: number) =>
  score >= 80
    ? { bg: "#DCFCE7", fg: "#15803D" }
    : score >= 65
      ? { bg: "#FFF7E6", fg: "#B45309" }
      : { bg: "#EFF6FF", fg: "#1D4ED8" };

export type PotentialBuyerMatch = {
  id: string;
  score: number;
  reasons: string[];
  buyer_requirements: {
    title: string;
    purpose: string;
    property_type: string | null;
    min_size: number | null;
    max_size: number | null;
    size_unit: string | null;
    min_budget: number;
    max_budget: number;
    payment_type: string;
    possession_required: boolean;
    cities: { name: string } | null;
    areas: { name: string } | null;
    societies: { name: string } | null;
    profiles: { full_name: string; phone_number: string | null } | null;
  } | null;
};

// The "seller sees a matched buyer requirement" card — used on
// /dashboard/matches (an owner's own properties).
export function PotentialBuyerCard({
  match,
  property,
}: {
  match: PotentialBuyerMatch;
  property: { title: string; slug: string };
}) {
  const r = match.buyer_requirements;
  if (!r) return null;
  const style = SCORE_STYLE(match.score);
  const sizeLabel = sizeRangeLabel(r.min_size, r.max_size, r.size_unit);
  const location = [r.societies?.name, r.areas?.name, r.cities?.name].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-3.5 rounded-2xl border border-[#EAEFF6] bg-white p-5 shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-display text-xs font-bold uppercase tracking-wide text-[#0F766E]">
            Potential Buyer Found
          </div>
          <a href={`/properties/${property.slug}`} className="font-body text-[13px] text-[#667085] hover:underline">
            for &ldquo;{property.title}&rdquo;
          </a>
        </div>
        <span
          className="rounded-full px-3 py-1.5 font-display text-sm font-extrabold"
          style={{ background: style.bg, color: style.fg }}
        >
          {match.score}% Match
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
        {match.reasons.map((reason) => (
          <span key={reason} className="rounded-full bg-[#ECFDF5] px-2.5 py-1 font-body text-[12px] font-medium text-[#15803D]">
            ✓ {reason}
          </span>
        ))}
      </div>

      <div className="border-t border-[#F1F5F9] pt-3.5">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E0ECFF] font-display text-xs font-bold text-[#2563EB]">
            {(r.profiles?.full_name ?? "?").charAt(0)}
          </span>
          <span className="font-body text-[13px] font-semibold text-[#344054]">{r.profiles?.full_name ?? "Buyer"}</span>
        </div>
        <ContactBuyerButtons
          buyerName={r.profiles?.full_name ?? "there"}
          phoneNumber={r.profiles?.phone_number ?? null}
          requirementTitle={r.title}
        />
      </div>
    </div>
  );
}
