import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SavedGrid, type SavedCard } from "@/components/SavedGrid";
import { priceLabel, specsLine, areaLine } from "@/lib/format";
import { resolveCardMedia, type MediaRow } from "@/lib/property-media";

// Supabase's generated types consistently mis-infer these embeds as
// arrays even for a many-to-one relation (favorites.property_id ->
// properties.id, one row) — the same pre-existing quirk seen across the
// rest of this codebase (Home/Search/PropertyDetail). Cast to the real
// runtime shape here instead of spreading `as any` through the render code.
type FavProperty = {
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
  status: string;
  cities: { name: string } | null;
  areas: { name: string } | null;
  societies: { name: string } | null;
  property_media: MediaRow[];
};

export default async function SavedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: favorites } = await supabase
    .from("favorites")
    .select(
      `property_id, created_at,
       properties(id, title, slug, price, price_type, size, size_unit, bedrooms, bathrooms, seller_type, status,
         cities(name), areas(name), societies(name),
         property_media(storage_path, media_type, is_primary, sort_order))`
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // A favorited property can come back null here if it was deleted, or if
  // it's no longer visible under RLS (e.g. hidden, or its seller was
  // blocked) — skip those rather than rendering a broken card.
  const live = (favorites ?? [])
    .map((f) => f.properties as unknown as FavProperty | null)
    .filter((p): p is FavProperty => p != null && p.status === "PUBLISHED");

  const cardMedia = await resolveCardMedia(supabase, live);

  const items: SavedCard[] = live.map((p) => ({
    propertyId: p.id,
    card: {
      title: p.title,
      badgeText: p.seller_type === "OWNER" ? "OWNER DIRECT" : "DEALER",
      areaLine: areaLine(p.societies?.name, p.areas?.name, p.cities?.name),
      priceLabel: priceLabel(p.price, p.price_type),
      specsLine: specsLine(p.size, p.size_unit, p.bedrooms, p.bathrooms),
      sellerName: "Seller",
      sellerTypeLabel: p.seller_type === "OWNER" ? "Owner" : "Dealer",
      photoUrl: cardMedia.get(p.id)?.photoUrl,
      hasVideo: cardMedia.get(p.id)?.hasVideo ?? false,
      href: `/properties/${p.slug}`,
    },
  }));

  return (
    <div className="flex flex-1 flex-col bg-[#F7F9FC] font-body">
      <SiteHeader />
      <div className="mx-auto w-full max-w-[1140px] px-6 pt-6">
        <h1 className="mb-1 font-display text-xl font-bold text-[#101828]">Saved Properties</h1>
        <p className="mb-2 text-sm text-[#667085]">
          {items.length} propert{items.length === 1 ? "y" : "ies"} saved
        </p>
      </div>
      <SavedGrid initialItems={items} />
      <SiteFooter />
    </div>
  );
}
