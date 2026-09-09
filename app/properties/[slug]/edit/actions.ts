"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parsePropertyForm } from "@/lib/parse-property-form";

export type ActionResult = { error: string } | null;

export async function updateProperty(
  propertyId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const parsed = parsePropertyForm(formData);
  if ("error" in parsed) return parsed;
  const { amenity_ids: amenityIds, ...fields } = parsed.fields;

  // RLS ("Users can update own properties") already enforces
  // seller_id = auth.uid() at the database level — the .eq below is
  // belt-and-braces so a mismatched id fails obviously rather than
  // silently updating zero rows.
  const { data: property, error } = await supabase
    .from("properties")
    .update(fields)
    .eq("id", propertyId)
    .eq("seller_id", user.id)
    .select("id, slug")
    .single();

  if (error || !property) {
    return { error: error?.message ?? "Failed to update property. It may not belong to you." };
  }

  // Replace the amenity set wholesale rather than diffing — simpler,
  // and this form is small enough that it's not worth the extra
  // round-trips to compute an add/remove delta.
  await supabase.from("property_amenities").delete().eq("property_id", property.id);
  if (amenityIds.length > 0) {
    const rows = amenityIds.map((amenity_id) => ({ property_id: property.id, amenity_id }));
    const { error: amenityError } = await supabase.from("property_amenities").insert(rows);
    if (amenityError) console.error("Failed to update amenities:", amenityError.message);
  }

  redirect(`/properties/${property.slug}`);
}
