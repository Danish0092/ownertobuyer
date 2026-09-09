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

// Shared by both create (app/properties/new/actions.ts) and edit
// (app/properties/[id]/edit/actions.ts) — the field set and
// validation rules are identical; only what happens with the parsed
// result (insert vs. update) differs.
export function parsePropertyForm(formData: FormData): { error: string } | { fields: PropertyFields } {
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

  return {
    fields: {
      title,
      purpose,
      category,
      property_type: propertyType,
      city_id: cityId,
      price,
      seller_type: sellerType,
      area_id: str(formData, "area_id"),
      society_id: str(formData, "society_id"),
      address: str(formData, "address"),
      description: str(formData, "description"),
      size: num(formData, "size"),
      size_unit: oneOf(str(formData, "size_unit"), SIZE_UNITS),
      price_type: oneOf(str(formData, "price_type"), PRICE_TYPES) ?? "TOTAL",
      bedrooms: num(formData, "bedrooms"),
      bathrooms: num(formData, "bathrooms"),
      parking_spaces: num(formData, "parking_spaces"),
      floor_number: num(formData, "floor_number"),
      total_floors: num(formData, "total_floors"),
      possession_status: oneOf(str(formData, "possession_status"), POSSESSION_STATUSES) ?? "NOT_SPECIFIED",
      installment_available: formData.get("installment_available") === "on",
      furnished_status: oneOf(str(formData, "furnished_status"), FURNISHED_STATUSES) ?? "NOT_SPECIFIED",
      construction_status: oneOf(str(formData, "construction_status"), CONSTRUCTION_STATUSES) ?? "NOT_SPECIFIED",
      authority_status: oneOf(str(formData, "authority_status"), AUTHORITY_STATUSES) ?? "NOT_PROVIDED",
      amenity_ids: formData.getAll("amenities").filter((v): v is string => typeof v === "string"),
    },
  };
}

export type PropertyFields = {
  title: string;
  purpose: string;
  category: string;
  property_type: string;
  city_id: string;
  price: number;
  seller_type: string;
  area_id: string | null;
  society_id: string | null;
  address: string | null;
  description: string | null;
  size: number | null;
  size_unit: string | null;
  price_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spaces: number | null;
  floor_number: number | null;
  total_floors: number | null;
  possession_status: string;
  installment_available: boolean;
  furnished_status: string;
  construction_status: string;
  authority_status: string;
  amenity_ids: string[];
};
