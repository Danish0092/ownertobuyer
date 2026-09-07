import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { labelize } from "@/lib/property-options";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: property } = await supabase
    .from("properties")
    .select(
      `id, title, description, purpose, category, property_type, price, price_type,
       size, size_unit, bedrooms, bathrooms, parking_spaces, floor_number, total_floors,
       possession_status, installment_available, furnished_status, construction_status,
       authority_status, seller_type, status, address, created_at,
       cities(name), areas(name), societies(name),
       property_amenities(amenities(name))`
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!property) {
    notFound();
  }

  const amenities = property.property_amenities
    .map((pa) => pa.amenities?.name)
    .filter((n): n is string => Boolean(n));

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 dark:bg-black">
      <main className="w-full max-w-2xl py-12 px-6">
        <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
          {labelize(property.purpose)} · {labelize(property.property_type)}
        </p>
        <h1 className="mb-2 text-2xl font-semibold text-black dark:text-zinc-50">
          {property.title}
        </h1>
        <p className="mb-6 text-sm text-zinc-500">
          {[property.societies?.name, property.areas?.name, property.cities?.name]
            .filter(Boolean)
            .join(", ")}
          {property.address ? ` — ${property.address}` : ""}
        </p>

        <p className="mb-6 text-xl font-semibold text-black dark:text-zinc-50">
          PKR {Number(property.price).toLocaleString()}
          {property.price_type === "PER_MONTH" ? " / month" : ""}
        </p>

        {property.description && (
          <p className="mb-6 whitespace-pre-wrap text-sm text-black dark:text-zinc-50">
            {property.description}
          </p>
        )}

        <dl className="mb-6 grid grid-cols-2 gap-3 text-sm">
          {property.size && (
            <Field label="Size" value={`${property.size} ${labelize(property.size_unit ?? "")}`} />
          )}
          {property.bedrooms !== null && <Field label="Bedrooms" value={String(property.bedrooms)} />}
          {property.bathrooms !== null && <Field label="Bathrooms" value={String(property.bathrooms)} />}
          {property.parking_spaces !== null && (
            <Field label="Parking" value={String(property.parking_spaces)} />
          )}
          <Field label="Possession" value={labelize(property.possession_status)} />
          <Field label="Furnished" value={labelize(property.furnished_status)} />
          <Field label="Construction" value={labelize(property.construction_status)} />
          <Field label="Seller type" value={labelize(property.seller_type)} />
          {property.installment_available && <Field label="Installments" value="Available" />}
        </dl>

        {amenities.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-2 text-sm font-medium text-black dark:text-zinc-50">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {amenities.map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-black/[.1] px-3 py-1 text-xs text-black dark:border-white/[.15] dark:text-zinc-50"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <strong>Authority/NOC status: {labelize(property.authority_status)}.</strong>{" "}
          This is a claim made by the seller, not verified by OwnerToBuyer.
          OwnerToBuyer does not guarantee ownership, documents, approvals, or
          any other legal detail about this property. Buyers must complete
          their own due diligence with the relevant authorities before making
          any payment.
        </div>
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-black dark:text-zinc-50">{value}</dd>
    </div>
  );
}
