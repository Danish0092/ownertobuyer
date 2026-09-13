import { priceLabel, specsLine, areaLine } from "@/lib/format";
import type { MediaRow } from "@/lib/property-media";

export type MatchedProperty = {
  id: string;
  title: string;
  slug: string;
  price: number;
  price_type: string;
  size: number | null;
  size_unit: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  seller_type: string;
  cities: { name: string } | null;
  areas: { name: string } | null;
  societies: { name: string } | null;
  property_media: MediaRow[];
};

// The "buyer sees a matched property" card — used on /requirements/matches
// (a buyer's own requirements) and reused as the other half of the
// Realtor's consolidated Dealer Match view, since a client-requirement
// match is exactly the same shape as a buyer's own.
export function MatchingPropertyCard({
  score,
  reasons,
  property,
  photoUrl,
}: {
  score: number;
  reasons: string[];
  property: MatchedProperty;
  photoUrl: string | null | undefined;
}) {
  return (
    <a
      href={`/properties/${property.slug}`}
      className="flex gap-4 rounded-2xl border border-[#EAEFF6] bg-white p-4 shadow-[0_6px_18px_rgba(16,24,40,0.06)]"
    >
      <div className="h-[92px] w-[120px] flex-none overflow-hidden rounded-xl bg-[#DDE8F5]">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={property.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-[#8FA6C6]">
            No photo
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="font-display text-[14.5px] font-bold text-[#101828]">{property.title}</div>
          <span className="flex-none rounded-full bg-[#DCFCE7] px-2.5 py-1 font-display text-xs font-extrabold text-[#15803D]">
            {score}% Match
          </span>
        </div>
        <div className="text-xs text-[#667085]">{areaLine(property.societies?.name, property.areas?.name, property.cities?.name)}</div>
        <div className="font-display text-[15px] font-extrabold text-[#0B2545]">{priceLabel(property.price, property.price_type)}</div>
        <div className="text-xs font-medium text-[#475467]">
          {specsLine(property.size, property.size_unit, property.bedrooms, property.bathrooms)}
        </div>
        <div className="mt-auto flex flex-wrap gap-1.5">
          {reasons.slice(0, 3).map((reason) => (
            <span key={reason} className="rounded-full bg-[#ECFDF5] px-2 py-0.5 font-body text-[11px] font-medium text-[#15803D]">
              ✓ {reason}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
}
