import { createClient } from "@/lib/supabase/server";
import { PropertyCard, type PropertyCardData } from "@/components/PropertyCard";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { priceLabel, specsLine, areaLine } from "@/lib/format";
import { resolveCardMedia } from "@/lib/property-media";
import { PROPERTY_TYPES, type PropertyType } from "@/lib/property-options";
import { SearchControls, type SearchState } from "./SearchControls";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const purpose = one(sp.purpose) === "RENT" ? "RENT" : "SALE";
  const q = one(sp.q) ?? "";
  const sort = one(sp.sort) ?? "recommended";
  const type = PROPERTY_TYPES.includes(one(sp.type) as PropertyType) ? (one(sp.type) as PropertyType) : null;
  const beds = one(sp.beds) ? Number(one(sp.beds)) : null;
  const furnished = one(sp.furnished) ?? null;
  const priceMax = one(sp.priceMax) ? Number(one(sp.priceMax)) : null;

  const supabase = await createClient();

  let query = supabase
    .from("properties")
    .select(
      "id, title, slug, price, price_type, size, size_unit, bedrooms, bathrooms, seller_type, cities(name), areas(name), societies(name), property_media(storage_path, media_type, is_primary, sort_order)",
      { count: "exact" }
    )
    .eq("status", "PUBLISHED")
    .eq("purpose", purpose);

  if (q) query = query.or(`title.ilike.%${q}%,address.ilike.%${q}%`);
  if (type) query = query.eq("property_type", type);
  if (beds) query = beds >= 5 ? query.gte("bedrooms", 5) : query.eq("bedrooms", beds);
  if (furnished) query = query.eq("furnished_status", furnished);
  if (priceMax) query = query.lte("price", priceMax);

  switch (sort) {
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "price-low":
      query = query.order("price", { ascending: true });
      break;
    case "price-high":
      query = query.order("price", { ascending: false });
      break;
    case "views":
      query = query.order("views_count", { ascending: false });
      break;
    default:
      // "Recommended" has no ranking model yet — falls back to newest.
      query = query.order("created_at", { ascending: false });
  }

  const { data: results, count } = await query.limit(24);

  const cardMedia = await resolveCardMedia(supabase, results ?? []);

  const cards: PropertyCardData[] = (results ?? []).map((p) => ({
    title: p.title,
    badgeText: "OWNER DIRECT",
    areaLine: areaLine(p.societies?.name, p.areas?.name, p.cities?.name),
    priceLabel: priceLabel(p.price, p.price_type),
    specsLine: specsLine(p.size, p.size_unit, p.bedrooms, p.bathrooms),
    sellerName: "Seller",
    sellerTypeLabel: "Owner",
    photoUrl: cardMedia.get(p.id)?.photoUrl,
    href: `/properties/${p.slug}`,
  }));

  const initial: SearchState = {
    purpose,
    q,
    sort,
    filters: {
      propertyType: type,
      bedrooms: beds,
      furnished: furnished as SearchState["filters"]["furnished"],
      priceMax,
    },
  };

  return (
    <div className="flex flex-1 flex-col bg-[#F7F9FC] font-body">
      <SiteHeader />
      <SearchControls initial={initial} />

      <div className="mx-auto w-full max-w-[1140px] px-6 pb-2 pt-5 text-[13px] font-semibold text-[#667085]">
        {count ?? 0} {count === 1 ? "property" : "properties"} found
      </div>

      {cards.length > 0 ? (
        <div className="mx-auto grid w-full max-w-[1140px] grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 px-6 pb-12 pt-2">
          {cards.map((card) => (
            <PropertyCard key={card.href} data={card} />
          ))}
        </div>
      ) : (
        <div className="px-6 py-24 text-center text-[#667085]">
          <h3 className="mb-2 font-display text-lg font-bold text-[#101828]">No properties found</h3>
          <p className="mb-5 text-sm">Try changing your filters or search another area.</p>
          <a
            href="/search"
            className="inline-block rounded-[10px] bg-[#2563EB] px-6 py-2.5 font-display text-[13px] font-bold text-white"
          >
            Clear Filters
          </a>
        </div>
      )}
      <SiteFooter />
    </div>
  );
}
