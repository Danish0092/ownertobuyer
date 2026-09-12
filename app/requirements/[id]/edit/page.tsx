import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RequirementForm } from "@/app/requirements/new/RequirementForm";
import { priceLabel } from "@/lib/format";
import { updateRequirement } from "./actions";

export default async function EditRequirementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: requirement } = await supabase
    .from("buyer_requirements")
    .select(
      `id, buyer_id, title, description, purpose, property_category, property_type, city_id, area_id, society_id,
       min_size, max_size, size_unit, min_budget, max_budget, payment_type, possession_required,
       bedrooms_min, bathrooms_min, furnished_status, expires_at, cities(name)`
    )
    .eq("id", id)
    .maybeSingle();

  if (!requirement) notFound();
  if (requirement.buyer_id !== user.id) redirect("/requirements");

  const [{ data: areas }, { data: societies }] = await Promise.all([
    supabase.from("areas").select("id, city_id, name").eq("city_id", requirement.city_id).order("name"),
    supabase.from("societies").select("id, city_id, name").eq("city_id", requirement.city_id).order("name"),
  ]);

  const daysRemaining = requirement.expires_at
    ? Math.ceil((new Date(requirement.expires_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : 30;
  const expiryDays = [30, 60, 90].reduce((closest, opt) =>
    Math.abs(opt - daysRemaining) < Math.abs(closest - daysRemaining) ? opt : closest
  );

  return (
    <div className="flex flex-1 flex-col bg-[#F7F9FC] font-body">
      <SiteHeader />
      <div className="mx-auto w-full max-w-[820px] px-6 py-10">
        <div className="mb-7 text-center">
          <h1 className="mb-2 font-display text-2xl font-extrabold text-[#0B2545]">Edit Requirement</h1>
          <p className="mx-auto max-w-[480px] font-body text-sm text-[#667085]">
            Saving refreshes when this requirement expires and rescans live listings against the updated details.
          </p>
        </div>
        <RequirementForm
          cityId={requirement.city_id}
          cityName={requirement.cities?.name ?? "Lahore"}
          areas={areas ?? []}
          societies={societies ?? []}
          action={updateRequirement.bind(null, requirement.id)}
          submitLabel="Save changes"
          pendingLabel="Saving..."
          initial={{
            title: requirement.title,
            description: requirement.description ?? undefined,
            purpose: requirement.purpose,
            category: requirement.property_category ?? undefined,
            propertyType: requirement.property_type ?? undefined,
            areaId: requirement.area_id ?? undefined,
            societyId: requirement.society_id ?? undefined,
            minSize: requirement.min_size ?? undefined,
            maxSize: requirement.max_size ?? undefined,
            sizeUnit: requirement.size_unit ?? undefined,
            minBudgetLabel: priceLabel(requirement.min_budget, "TOTAL").replace("PKR ", ""),
            maxBudgetLabel: priceLabel(requirement.max_budget, "TOTAL").replace("PKR ", ""),
            paymentType: requirement.payment_type,
            possessionRequired: requirement.possession_required,
            bedroomsMin: requirement.bedrooms_min ?? undefined,
            bathroomsMin: requirement.bathrooms_min ?? undefined,
            furnishedStatus: requirement.furnished_status ?? undefined,
            expiryDays,
          }}
        />
      </div>
      <SiteFooter />
    </div>
  );
}
