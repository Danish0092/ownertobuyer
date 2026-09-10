import { createClient } from "@/lib/supabase/server";
import { CategoryIcon } from "@/components/CategoryIcon";
import { PropertyCard, type PropertyCardData } from "@/components/PropertyCard";
import { HeroSearch } from "@/components/HeroSearch";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { priceLabel, specsLine, areaLine } from "@/lib/format";

// Landing page rebuilt from the OwnerToBuyer Claude Design artifact
// (colors, fonts, copy, and section layout reproduced from its
// decompiled template). Unlike the design mock, category counts,
// featured listings, and the area grid are wired to real Supabase
// data rather than hardcoded placeholder numbers — the site is real,
// even while inventory is still thin.

const CATEGORIES: {
  value: "HOUSE" | "PLOT" | "APARTMENT" | "COMMERCIAL" | "AGRICULTURAL_LAND" | "FARM_HOUSE";
  label: string;
  icon: "house" | "plot" | "apartment" | "commercial" | "agricultural" | "farmhouse";
  bg: string;
  fg: string;
}[] = [
  { value: "HOUSE", label: "House", icon: "house", bg: "#EFF6FF", fg: "#2563EB" },
  { value: "PLOT", label: "Plot", icon: "plot", bg: "#FEF3E2", fg: "#D97706" },
  { value: "APARTMENT", label: "Apartment", icon: "apartment", bg: "#F1F0FE", fg: "#7C3AED" },
  { value: "COMMERCIAL", label: "Commercial", icon: "commercial", bg: "#FEECEC", fg: "#DC2626" },
  { value: "AGRICULTURAL_LAND", label: "Agricultural", icon: "agricultural", bg: "#ECFDF5", fg: "#0F766E" },
  { value: "FARM_HOUSE", label: "Farm House", icon: "farmhouse", bg: "#EAF7F1", fg: "#15803D" },
];

export default async function Home() {
  const supabase = await createClient();

  const [
    { count: houseCount },
    { count: plotCount },
    { count: apartmentCount },
    { count: commercialCount },
    { count: agriCount },
    { count: farmCount },
    { data: featured },
    { data: areas },
  ] = await Promise.all([
    supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "PUBLISHED").eq("property_type", "HOUSE"),
    supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "PUBLISHED").eq("property_type", "PLOT"),
    supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "PUBLISHED").eq("property_type", "APARTMENT"),
    supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "PUBLISHED").eq("category", "COMMERCIAL"),
    supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "PUBLISHED").eq("property_type", "AGRICULTURAL_LAND"),
    supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "PUBLISHED").eq("property_type", "FARM_HOUSE"),
    supabase
      .from("properties")
      .select(
        "id, title, slug, price, price_type, size, size_unit, bedrooms, bathrooms, seller_type, purpose, cities(name), areas(name), societies(name)"
      )
      .eq("status", "PUBLISHED")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase.from("areas").select("id, name, cities(name)").order("name").limit(8),
  ]);

  const counts: Record<string, number> = {
    HOUSE: houseCount ?? 0,
    PLOT: plotCount ?? 0,
    APARTMENT: apartmentCount ?? 0,
    COMMERCIAL: commercialCount ?? 0,
    AGRICULTURAL_LAND: agriCount ?? 0,
    FARM_HOUSE: farmCount ?? 0,
  };

  const featuredCards: PropertyCardData[] = (featured ?? []).map((p) => ({
    title: p.title,
    badgeText: p.seller_type === "OWNER" ? "OWNER DIRECT" : "DEALER",
    areaLine: areaLine(p.societies?.name, p.areas?.name, p.cities?.name),
    priceLabel: priceLabel(p.price, p.price_type),
    specsLine: specsLine(p.size, p.size_unit, p.bedrooms, p.bathrooms),
    sellerName: "Seller",
    sellerTypeLabel: p.seller_type === "OWNER" ? "Owner" : "Dealer",
    hasVideo: false,
    href: `/properties/${p.slug}`,
  }));

  return (
    <div className="flex flex-1 flex-col font-body">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B2545] via-[#123A63] to-[#1D4ED8] px-6 pb-[90px] pt-14">
        <div className="pointer-events-none absolute -right-[60px] -top-[60px] h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.35),transparent_70%)]" />
        <div className="pointer-events-none absolute -left-[10%] bottom-[-80px] h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.25),transparent_70%)]" />
        <div className="relative mx-auto flex max-w-[1140px] flex-col items-center gap-3.5 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3.5 py-1.5 font-display text-xs font-bold tracking-wide text-[#7DD3C0]">
            LAHORE&apos;S OWNER-DIRECT MARKETPLACE
          </span>
          <h1 className="max-w-[780px] font-display text-[clamp(30px,5vw,52px)] font-extrabold leading-[1.1] text-white">
            Find Property. Connect Directly.
          </h1>
          <p className="max-w-[560px] text-base text-[#C7D6EE]">
            Buy, sell and rent properties directly from owners and trusted
            marketplace participants — no unnecessary middlemen.
          </p>

          <HeroSearch />
        </div>
      </section>

      {/* Category quick-filters */}
      <div className="relative z-[2] mx-auto -mt-[46px] w-full max-w-[1140px] px-6">
        <div className="flex gap-3 overflow-x-auto pb-1.5">
          {CATEGORIES.map((c) => (
            <a
              key={c.value}
              href={`/search?type=${c.value}`}
              className="flex h-28 w-32 flex-none flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#EAEFF6] bg-white shadow-[0_6px_18px_rgba(16,24,40,0.08)]"
            >
              <span
                className="flex h-8.5 w-8.5 items-center justify-center rounded-[10px]"
                style={{ background: c.bg, color: c.fg }}
              >
                <CategoryIcon name={c.icon} />
              </span>
              <span className="font-display text-[12.5px] font-bold text-[#123A63]">{c.label}</span>
              <span className="text-[11px] font-medium text-[#98A2B3]">
                {counts[c.value]} {counts[c.value] === 1 ? "property" : "properties"}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Featured / owner-direct properties */}
      <section className="mx-auto w-full max-w-[1140px] px-6 pb-2 pt-16">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="m-0 mb-1 font-display text-[28px] font-extrabold text-[#101828]">
              Properties Directly From Owners
            </h2>
            <p className="m-0 text-sm text-[#667085]">
              Skip the middleman and connect directly with property owners.
            </p>
          </div>
          <a href="/search?seller=OWNER" className="font-display text-[13px] font-bold text-[#0D9488]">
            View all →
          </a>
        </div>

        {featuredCards.length > 0 ? (
          <div className="mt-5.5 grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4.5">
            {featuredCards.map((card) => (
              <PropertyCard key={card.href} data={card} />
            ))}
          </div>
        ) : (
          <div className="mt-5.5 rounded-2xl border border-dashed border-[#EAEFF6] bg-[#F7F9FC] px-6 py-14 text-center">
            <p className="mb-3 text-sm text-[#667085]">
              No properties published yet — be the first.
            </p>
            <a
              href="/properties/new"
              className="inline-block rounded-[10px] bg-gradient-to-br from-[#F59E0B] to-[#EA7D0B] px-5 py-2.5 font-display text-[13px] font-extrabold text-white"
            >
              Post Property FREE
            </a>
          </div>
        )}
      </section>

      {/* Video discovery */}
      <section className="mt-14 bg-gradient-to-b from-[#EFFCF8] to-[#F7F9FC] px-6 py-14">
        <div className="mx-auto max-w-[1140px]">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="m-0 mb-1 font-display text-[28px] font-extrabold text-[#101828]">
                Discover Properties Through Video
              </h2>
              <p className="m-0 text-sm text-[#667085]">Walk through real properties before you visit.</p>
            </div>
            <button type="button" className="font-display text-[13px] font-bold text-[#0D9488]">
              Watch more →
            </button>
          </div>
          <div className="mt-5.5 rounded-2xl border border-dashed border-[#CFEAE1] bg-white/60 px-6 py-12 text-center text-sm text-[#667085]">
            No property videos yet — sellers can add one when they post a listing.
          </div>
        </div>
      </section>

      {/* Popular areas */}
      <section className="mx-auto w-full max-w-[1140px] px-6 pb-2 pt-14">
        <h2 className="m-0 mb-5 font-display text-[28px] font-extrabold text-[#101828]">
          Popular Lahore Areas
        </h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5">
          {(areas ?? []).map((a) => (
            <a
              key={a.id}
              href={`/search?q=${encodeURIComponent(a.name)}`}
              className="flex items-center justify-between rounded-[14px] border border-[#EAEFF6] bg-white px-4.5 py-4.5 text-left font-display text-sm font-bold text-[#123A63] shadow-[0_4px_12px_rgba(16,24,40,0.05)]"
            >
              {a.name}
              <span className="text-base text-[#14B8A6]">→</span>
            </a>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="mx-auto my-14 w-full max-w-[1140px] px-6">
        <div className="rounded-3xl bg-gradient-to-br from-[#F59E0B] to-[#EA580C] px-8 py-12 text-center shadow-[0_20px_46px_rgba(217,119,6,0.28)]">
          <h2 className="m-0 mb-2 font-display text-[30px] font-extrabold text-white">
            Have a property to sell or rent?
          </h2>
          <p className="m-0 mb-5 text-[15px] text-[#FFE9C7]">
            List it FREE. Reach thousands of buyers directly — no fees, no commission.
          </p>
          <a
            href="/properties/new"
            className="inline-block rounded-xl bg-white px-8.5 py-4 font-display text-[15px] font-extrabold text-[#D97706] shadow-[0_8px_20px_rgba(0,0,0,0.15)]"
          >
            Post Property — FREE
          </a>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
