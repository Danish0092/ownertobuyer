"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { uniqueSlug } from "@/lib/slug";
import {
  PROPERTY_CATEGORIES,
  PROPERTY_TYPES,
  PROPERTY_TYPES_BY_CATEGORY,
  PROPERTY_PURPOSES,
  SIZE_UNITS,
  PRICE_TYPES,
  POSSESSION_STATUSES,
  FURNISHED_STATUSES,
  CONSTRUCTION_STATUSES,
  AUTHORITY_STATUSES,
  SELLER_TYPES,
  type PropertyCategory,
} from "@/lib/property-options";

export type ActionResult = { error: string } | null;

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  return v.trim();
}

function num(formData: FormData, key: string): number | null {
  const v = str(formData, key);
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  if (value && (allowed as readonly string[]).includes(value)) return value as T;
  return null;
}

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

  // --- Required fields ---
  const title = str(formData, "title");
  const purpose = oneOf(str(formData, "purpose"), PROPERTY_PURPOSES);
  const category = oneOf(str(formData, "category"), PROPERTY_CATEGORIES);
  const propertyType = oneOf(str(formData, "property_type"), PROPERTY_TYPES);
  const cityId = str(formData, "city_id");
  const price = num(formData, "price");
  const sellerType = oneOf(str(formData, "seller_type"), SELLER_TYPES);

  if (!title || !purpose || !category || !propertyType || !cityId || price === null || !sellerType) {
    return { error: "Please fill in all required fields." };
  }

  // Defense in depth: the client form already constrains which
  // property_type options are shown per category, but a direct POST
  // could bypass that, so re-check server-side too.
  if (!PROPERTY_TYPES_BY_CATEGORY[category as PropertyCategory].includes(propertyType)) {
    return { error: "That property type doesn't belong to the selected category." };
  }

  // --- Optional fields ---
  const areaId = str(formData, "area_id");
  const societyId = str(formData, "society_id");
  const address = str(formData, "address");
  const description = str(formData, "description");
  const size = num(formData, "size");
  const sizeUnit = oneOf(str(formData, "size_unit"), SIZE_UNITS);
  const priceType = oneOf(str(formData, "price_type"), PRICE_TYPES) ?? "TOTAL";
  const bedrooms = num(formData, "bedrooms");
  const bathrooms = num(formData, "bathrooms");
  const parkingSpaces = num(formData, "parking_spaces");
  const floorNumber = num(formData, "floor_number");
  const totalFloors = num(formData, "total_floors");
  const possessionStatus = oneOf(str(formData, "possession_status"), POSSESSION_STATUSES) ?? "NOT_SPECIFIED";
  const installmentAvailable = formData.get("installment_available") === "on";
  const furnishedStatus = oneOf(str(formData, "furnished_status"), FURNISHED_STATUSES) ?? "NOT_SPECIFIED";
  const constructionStatus = oneOf(str(formData, "construction_status"), CONSTRUCTION_STATUSES) ?? "NOT_SPECIFIED";
  const authorityStatus = oneOf(str(formData, "authority_status"), AUTHORITY_STATUSES) ?? "NOT_PROVIDED";
  const amenityIds = formData.getAll("amenities").filter((v): v is string => typeof v === "string");

  const slug = uniqueSlug(title);

  // NOTE: no moderation dashboard exists yet (feature #20 in the spec),
  // so listings publish immediately rather than sitting in
  // PENDING_REVIEW forever. Swap this to 'PENDING_REVIEW' once an admin
  // review queue exists.
  const { data: property, error } = await supabase
    .from("properties")
    .insert({
      seller_id: user.id,
      title,
      slug,
      purpose,
      category,
      property_type: propertyType,
      city_id: cityId,
      area_id: areaId,
      society_id: societyId,
      address,
      price,
      price_type: priceType,
      size,
      size_unit: sizeUnit,
      bedrooms,
      bathrooms,
      parking_spaces: parkingSpaces,
      floor_number: floorNumber,
      total_floors: totalFloors,
      possession_status: possessionStatus,
      installment_available: installmentAvailable,
      furnished_status: furnishedStatus,
      construction_status: constructionStatus,
      authority_status: authorityStatus,
      description,
      seller_type: sellerType,
      status: "PUBLISHED",
      published_at: new Date().toISOString(),
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

  redirect(`/properties/${property.slug}`);
}
