import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { labelize } from "@/lib/property-options";
import { priceLabel } from "@/lib/format";
import { BackButton } from "@/components/BackButton";
import { SaveButton } from "@/components/SaveButton";
import { ContactButtons } from "@/components/ContactButtons";
import { ReportButton } from "@/components/ReportButton";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: property } = await supabase
    .from("properties")
    .select(
      `id, seller_id, title, description, purpose, category, property_type, price, price_type,
       size, size_unit, bedrooms, bathrooms, parking_spaces, floor_number, total_floors,
       possession_status, installment_available, furnished_status, construction_status,
       authority_status, seller_type, representation_confirmed, status, address, created_at,
       cities(name), areas(name), societies(name),
       property_amenities(amenities(name)),
       property_media(storage_path, media_type, is_primary, sort_order),
       profiles(full_name, account_type, phone_number, created_at)`
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!property) {
    notFound();
  }

  // property-media is a private bucket (RLS keyed off the property's
  // status) — a signed URL is needed rather than a raw public one.
  const sortedMedia = [...property.property_media].sort((a, b) => a.sort_order - b.sort_order);
  const mediaUrls = await Promise.all(
    sortedMedia.slice(0, 3).map(async (m) => {
      const { data } = await supabase.storage.from("property-media").createSignedUrl(m.storage_path, 3600);
      return { url: data?.signedUrl ?? null, type: m.media_type };
    })
  );

  const [{ count: sellerListingsCount }, favoriteRow] = await Promise.all([
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", property.seller_id)
      .eq("status", "PUBLISHED"),
    user
      ? supabase
          .from("favorites")
          .select("id")
          .eq("user_id", user.id)
          .eq("property_id", property.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const features = property.property_amenities
    .map((pa) => pa.amenities?.name)
    .filter((n): n is string => Boolean(n));

  const areaLine = [property.societies?.name, property.areas?.name, property.cities?.name]
    .filter(Boolean)
    .join(", ");

  const detailRows: { label: string; value: string }[] = [
    { label: "Purpose", value: labelize(property.purpose) },
    { label: "Category", value: labelize(property.category) },
    { label: "Property Type", value: labelize(property.property_type) },
    ...(property.floor_number != null ? [{ label: "Floor", value: String(property.floor_number) }] : []),
    ...(property.total_floors != null ? [{ label: "Total Floors", value: String(property.total_floors) }] : []),
    ...(property.parking_spaces != null ? [{ label: "Parking", value: String(property.parking_spaces) }] : []),
    { label: "Possession", value: labelize(property.possession_status) },
    { label: "Construction", value: labelize(property.construction_status) },
    { label: "Price Type", value: labelize(property.price_type) },
    ...(property.installment_available ? [{ label: "Installments", value: "Available" }] : []),
  ];

  const seller = property.profiles;
  // "Represented by" — never implies the realtor owns it, per the
  // product rule that a realtor is not the owner just because they
  // posted the listing.
  const sellerBadgeText = property.seller_type === "OWNER" ? "LISTED BY OWNER" : "LISTED BY REALTOR";
  const sellerJoined = seller?.created_at
    ? new Date(seller.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";

  return (
    <div className="flex flex-1 flex-col bg-[#F7F9FC] pb-24 font-body">
      <SiteHeader />
      <div className="mx-auto w-full max-w-[1140px] px-6 pt-5">
        <BackButton />
      </div>

      {/* Photo gallery — real uploads via signed URLs (property-media
          is a private bucket), falling back to placeholders when a
          listing has none yet. */}
      <div className="mx-auto flex w-full max-w-[1140px] flex-wrap gap-2.5 px-6 pt-4">
        {mediaUrls[0]?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrls[0].url}
            alt=""
            className="h-[340px] min-w-[280px] flex-[2] rounded-[18px] object-cover"
          />
        ) : (
          <div className="flex h-[340px] min-w-[280px] flex-[2] items-center justify-center rounded-[18px] bg-[#DDE8F5] text-sm text-[#7C93B5]">
            No photos yet
          </div>
        )}
        <div className="flex min-w-[200px] flex-1 flex-col gap-2.5">
          {[1, 2].map((i) =>
            mediaUrls[i]?.url ? (
              mediaUrls[i].type === "VIDEO" ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video key={i} src={mediaUrls[i].url!} controls className="h-[165px] rounded-[18px] object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={mediaUrls[i].url!} alt="" className="h-[165px] rounded-[18px] object-cover" />
              )
            ) : (
              <div
                key={i}
                className="flex h-[165px] items-center justify-center rounded-[18px] bg-[#DDE8F5] text-xs text-[#7C93B5]"
              >
                {i === 1 ? "Photo 2" : "Photo / Video"}
              </div>
            )
          )}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1140px] flex-wrap gap-8 px-6 pt-6.5">
        {/* Main column */}
        <div className="min-w-[320px] flex-[2]">
          <div className="mb-2 flex items-center gap-2.5">
            <span
              className="rounded-full px-3.5 py-1.5 font-display text-[11px] font-extrabold"
              style={
                property.seller_type === "OWNER"
                  ? { background: "linear-gradient(135deg,#22C55E,#14B8A6)", color: "#fff" }
                  : { background: "#EEF2F7", color: "#475467" }
              }
            >
              {property.seller_type === "OWNER" ? "OWNER DIRECT" : "DEALER"}
            </span>
            <SaveButton propertyId={property.id} initialSaved={!!favoriteRow?.data} isLoggedIn={!!user} />
          </div>

          <h1 className="mb-1.5 font-display text-[26px] font-extrabold text-[#101828]">{property.title}</h1>
          <div className="mb-3.5 text-sm text-[#667085]">
            {areaLine}
            {property.address ? ` — ${property.address}` : ""}
          </div>
          <div className="mb-4 font-display text-[30px] font-extrabold text-[#0B2545]">
            PKR {priceLabel(property.price, property.price_type).replace("PKR ", "")}
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {property.size && (
              <Pill bg="#EFF6FF" fg="#1D4ED8">
                {property.size} {labelize(property.size_unit ?? "")}
              </Pill>
            )}
            {property.bedrooms != null && (
              <Pill bg="#EFF6FF" fg="#1D4ED8">
                {property.bedrooms} Beds
              </Pill>
            )}
            {property.bathrooms != null && (
              <Pill bg="#EFF6FF" fg="#1D4ED8">
                {property.bathrooms} Baths
              </Pill>
            )}
            <Pill bg="#F0FDF4" fg="#15803D">
              {labelize(property.furnished_status)}
            </Pill>
          </div>

          {property.description && (
            <>
              <h3 className="mb-2.5 font-display text-base font-bold text-[#101828]">Property Overview</h3>
              <p className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-[#475467]">
                {property.description}
              </p>
            </>
          )}

          <h3 className="mb-2.5 font-display text-base font-bold text-[#101828]">Property Details</h3>
          <div className="mb-6 grid grid-cols-2 gap-2.5">
            {detailRows.map((row) => (
              <div
                key={row.label}
                className="flex justify-between rounded-[10px] border border-[#EAEFF6] bg-white px-3.5 py-2.5 text-[13px]"
              >
                <span className="text-[#667085]">{row.label}</span>
                <span className="font-semibold text-[#101828]">{row.value}</span>
              </div>
            ))}
          </div>

          {features.length > 0 && (
            <>
              <h3 className="mb-2.5 font-display text-base font-bold text-[#101828]">Features &amp; Amenities</h3>
              <div className="mb-6 flex flex-wrap gap-2">
                {features.map((f) => (
                  <span key={f} className="rounded-full bg-[#F1F5F9] px-3.5 py-1.5 text-[12.5px] font-semibold text-[#334155]">
                    {f}
                  </span>
                ))}
              </div>
            </>
          )}

          <h3 className="mb-1 font-display text-base font-bold text-[#101828]">Approval / Authority Information</h3>
          <p className="mb-2.5 text-[11.5px] text-[#98A2B3]">
            Seller-provided information — not independently verified by the platform.
          </p>
          <div className="mb-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#FFF7E6] px-3.5 py-1.5 text-[12.5px] font-semibold text-[#B45309]">
              {labelize(property.authority_status)}
            </span>
          </div>

          <h3 className="mb-2.5 font-display text-base font-bold text-[#101828]">Location</h3>
          <div className="mb-4 flex h-[180px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#DDE8F5] to-[#EFF6FF] text-[13px] text-[#667085]">
            Map placeholder — {areaLine}
          </div>

          <ReportButton propertyId={property.id} />
        </div>

        {/* Sidebar */}
        <div className="min-w-[280px] flex-1">
          <div className="mb-4.5 rounded-[18px] border border-[#EAEFF6] bg-white p-5.5 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
            <div className="mb-3 font-display text-xs font-extrabold text-[#0F766E]">{sellerBadgeText}</div>
            <div className="mb-4.5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E0ECFF] font-display text-lg font-extrabold text-[#1D4ED8]">
                {(seller?.full_name ?? "?").charAt(0)}
              </div>
              <div>
                <div className="font-display font-bold text-[#101828]">
                  {property.seller_type === "DEALER"
                    ? `Represented by ${seller?.full_name ?? "Realtor"}`
                    : (seller?.full_name ?? "Seller")}
                </div>
                <div className="text-xs text-[#667085]">
                  {/* Uses this LISTING's seller_type (matches the badge above),
                      not the seller's own profile account_type — those can now
                      legitimately diverge since account_type also covers
                      BUYER/DEVELOPER, which aren't valid ways to describe who's
                      selling a specific property. */}
                  {property.seller_type === "OWNER" ? "Owner" : "Realtor / Dealer"} • Joined {sellerJoined}
                </div>
              </div>
            </div>
            <div className="mb-4 text-[12.5px] text-[#475467]">
              {sellerListingsCount ?? 0} active listing{(sellerListingsCount ?? 0) === 1 ? "" : "s"} on OwnerToBuyer
            </div>
            {property.seller_type === "DEALER" && property.representation_confirmed && (
              <div className="mb-4 rounded-lg bg-[#F8FAFC] px-3 py-2.5 text-[11.5px] text-[#667085]">
                ✓ This realtor has declared they are authorized to represent this property. This is a self-declared
                claim — OwnerToBuyer does not verify ownership or authorization.
              </div>
            )}
            <ContactButtons propertyId={property.id} propertyTitle={property.title} phoneNumber={seller?.phone_number ?? null} />
            <p className="mt-3.5 text-center text-[11px] text-[#98A2B3]">
              Verify all property information independently before making any payment or transaction.
            </p>
          </div>

          <div className="rounded-2xl border border-[#FDE9B8] bg-[#FFF9EB] p-4.5">
            <div className="mb-1.5 font-display text-[13px] font-extrabold text-[#B45309]">Important</div>
            <p className="m-0 text-[12.5px] leading-relaxed text-[#8A5A0A]">
              We are only a connection platform between buyers and sellers. We do not verify
              ownership, documents, approvals, NOCs, dues, property authenticity, or the accuracy
              of information provided by sellers. Buyers and sellers are responsible for their own
              due diligence before making any payment or transaction.
            </p>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function Pill({ bg, fg, children }: { bg: string; fg: string; children: React.ReactNode }) {
  return (
    <span
      className="rounded-full px-3.5 py-1.5 text-[12.5px] font-bold"
      style={{ background: bg, color: fg }}
    >
      {children}
    </span>
  );
}
