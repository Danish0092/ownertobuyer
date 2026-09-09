import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { PropertyForm } from "@/app/properties/new/PropertyForm";
import { updateProperty } from "./actions";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: property } = await supabase
    .from("properties")
    .select(
      `id, seller_id, title, purpose, category, property_type, description, city_id, area_id, society_id,
       address, price, price_type, size, size_unit, bedrooms, bathrooms, parking_spaces, floor_number,
       total_floors, possession_status, furnished_status, construction_status, authority_status,
       installment_available, seller_type, property_amenities(amenity_id)`
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!property) notFound();
  // RLS would block the update anyway, but redirect rather than let a
  // non-owner sit on a form that will fail on submit.
  if (property.seller_id !== user.id) redirect(`/properties/${slug}`);

  const [{ data: cities }, { data: areas }, { data: societies }, { data: amenities }] = await Promise.all([
    supabase.from("cities").select("id, name").order("name"),
    supabase.from("areas").select("id, city_id, name").order("name"),
    supabase.from("societies").select("id, city_id, name").order("name"),
    supabase.from("amenities").select("id, name, category").order("name"),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl py-12 px-6">
        <h1 className="mb-1 text-2xl font-semibold text-black dark:text-zinc-50">Edit property</h1>
        <p className="mb-8 text-sm text-zinc-500">
          Changes are visible immediately — there is no review step before an edit goes live.
        </p>
        <PropertyForm
          cities={cities ?? []}
          areas={areas ?? []}
          societies={societies ?? []}
          amenities={amenities ?? []}
          defaultSellerType={property.seller_type}
          action={updateProperty.bind(null, property.id)}
          submitLabel="Save changes"
          pendingLabel="Saving..."
          initial={{
            title: property.title,
            purpose: property.purpose,
            sellerType: property.seller_type,
            category: property.category as "RESIDENTIAL" | "COMMERCIAL" | "AGRICULTURAL" | "OTHER",
            propertyType: property.property_type,
            description: property.description ?? undefined,
            cityId: property.city_id,
            areaId: property.area_id ?? undefined,
            societyId: property.society_id ?? undefined,
            address: property.address ?? undefined,
            price: property.price,
            priceType: property.price_type,
            size: property.size ?? undefined,
            sizeUnit: property.size_unit ?? undefined,
            bedrooms: property.bedrooms ?? undefined,
            bathrooms: property.bathrooms ?? undefined,
            parkingSpaces: property.parking_spaces ?? undefined,
            floorNumber: property.floor_number ?? undefined,
            totalFloors: property.total_floors ?? undefined,
            possessionStatus: property.possession_status,
            furnishedStatus: property.furnished_status,
            constructionStatus: property.construction_status,
            authorityStatus: property.authority_status,
            installmentAvailable: property.installment_available,
            amenityIds: property.property_amenities.map((pa) => pa.amenity_id),
          }}
        />
      </main>
    </div>
  );
}
