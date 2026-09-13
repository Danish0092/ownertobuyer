"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { uniqueSlug } from "@/lib/slug";
import { parsePropertyForm } from "@/lib/parse-property-form";

export type ActionResult = { error: string } | null;

export async function createProperty(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const parsed = parsePropertyForm(formData);
  if ("error" in parsed) return parsed;
  const { amenity_ids: amenityIds, ...fields } = parsed.fields;

  const slug = uniqueSlug(fields.title);

  // NOTE: no moderation dashboard exists yet (feature #20 in the spec),
  // so listings publish immediately rather than sitting in
  // PENDING_REVIEW forever. Swap this to 'PENDING_REVIEW' once an admin
  // review queue exists.
  // Kept out of parsePropertyForm/PropertyFields deliberately: that
  // parser is shared with the edit flow (app/properties/[slug]/edit),
  // which has no UI for this checkbox — if it went through the shared
  // fields object, every edit save would silently reset an already-
  // confirmed Realtor's authorization claim back to false.
  const representationConfirmed = fields.seller_type === "DEALER" && formData.get("representation_confirmed") === "on";

  const { data: property, error } = await supabase
    .from("properties")
    .insert({
      ...fields,
      seller_id: user.id,
      slug,
      status: "PUBLISHED",
      published_at: new Date().toISOString(),
      representation_confirmed: representationConfirmed,
    })
    .select("id, slug")
    .single();

  if (error || !property) {
    return { error: error?.message ?? "Failed to create property." };
  }

  if (amenityIds.length > 0) {
    const rows = amenityIds.map((amenity_id) => ({
      property_id: property.id,
      amenity_id,
    }));
    const { error: amenityError } = await supabase.from("property_amenities").insert(rows);
    // Non-fatal: the property was created successfully either way.
    if (amenityError) {
      console.error("Failed to attach amenities:", amenityError.message);
    }
  }

  // Photos/video (only sent by the PostPropertyWizard flow — the
  // plain single-page form has no upload step yet). Uploaded here,
  // after the row exists, because the property-media Storage policies
  // key off properties.seller_id via the {property_id}/... path, so a
  // photo can't be attributed to a property that doesn't exist yet.
  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const video = formData.get("video");

  for (let i = 0; i < photos.length; i++) {
    const file = photos[i];
    const path = `${property.id}/${i}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("property-media").upload(path, file);
    if (uploadError) {
      console.error("Photo upload failed:", uploadError.message);
      continue;
    }
    await supabase.from("property_media").insert({
      property_id: property.id,
      media_type: "IMAGE",
      storage_path: path,
      sort_order: i,
      is_primary: i === 0,
    });
  }

  if (video instanceof File && video.size > 0) {
    const path = `${property.id}/video-${video.name}`;
    const { error: uploadError } = await supabase.storage.from("property-media").upload(path, video);
    if (!uploadError) {
      await supabase.from("property_media").insert({
        property_id: property.id,
        media_type: "VIDEO",
        storage_path: path,
        sort_order: photos.length,
        is_primary: false,
      });
    } else {
      console.error("Video upload failed:", uploadError.message);
    }
  }

  redirect(`/properties/${property.slug}`);
}
