// Mirrors the enums defined in supabase/migrations/20260905124436_initial_schema.sql
// (plus the OTHER category added in 20260907150000_add_other_property_category.sql).
// Kept as plain data so both the client form and the server action can
// validate against the same source of truth.

export const PROPERTY_CATEGORIES = [
  "RESIDENTIAL",
  "COMMERCIAL",
  "AGRICULTURAL",
  "OTHER",
] as const;
export type PropertyCategory = (typeof PROPERTY_CATEGORIES)[number];

export const PROPERTY_TYPES = [
  "HOUSE",
  "APARTMENT",
  "FARM_HOUSE",
  "PLOT",
  "SHOP",
  "OFFICE",
  "BUILDING",
  "FACTORY",
  "WAREHOUSE",
  "AGRICULTURAL_LAND",
  "OTHER",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

// Which property_type values are selectable once a category is chosen.
// PLOT is valid under both RESIDENTIAL and COMMERCIAL (a plot bought to
// build a house vs. one bought for a shop/warehouse).
export const PROPERTY_TYPES_BY_CATEGORY: Record<PropertyCategory, PropertyType[]> = {
  RESIDENTIAL: ["HOUSE", "APARTMENT", "FARM_HOUSE", "PLOT"],
  COMMERCIAL: ["SHOP", "OFFICE", "BUILDING", "FACTORY", "WAREHOUSE", "PLOT"],
  AGRICULTURAL: ["AGRICULTURAL_LAND"],
  OTHER: ["OTHER"],
};

export const PROPERTY_PURPOSES = ["SALE", "RENT"] as const;
export type PropertyPurpose = (typeof PROPERTY_PURPOSES)[number];

export const SIZE_UNITS = ["MARLA", "KANAL", "SQ_FT", "SQ_YD", "SQ_M", "ACRES"] as const;
export type SizeUnit = (typeof SIZE_UNITS)[number];

export const PRICE_TYPES = ["TOTAL", "PER_MONTH"] as const;
export type PriceType = (typeof PRICE_TYPES)[number];

export const POSSESSION_STATUSES = [
  "AVAILABLE",
  "POSSESSION_AVAILABLE",
  "POSSESSION_PENDING",
  "UNDER_CONSTRUCTION",
  "NOT_APPLICABLE",
  "NOT_SPECIFIED",
] as const;

export const FURNISHED_STATUSES = [
  "FURNISHED",
  "SEMI_FURNISHED",
  "UNFURNISHED",
  "NOT_APPLICABLE",
  "NOT_SPECIFIED",
] as const;

export const CONSTRUCTION_STATUSES = [
  "READY",
  "UNDER_CONSTRUCTION",
  "PLOT",
  "NOT_APPLICABLE",
  "NOT_SPECIFIED",
] as const;

// NOT_PROVIDED / NOT_SURE / OTHER are intentionally the "safe" defaults —
// the rest are explicitly phrased as seller claims, never platform-verified
// facts, per the legal/disclaimer requirement.
export const AUTHORITY_STATUSES = [
  "NOT_PROVIDED",
  "SELLER_CLAIMS_APPROVED",
  "SELLER_CLAIMS_NOC",
  "SELLER_CLAIMS_AUTHORITY_APPROVAL",
  "NOT_SURE",
  "OTHER",
] as const;

export const SELLER_TYPES = ["OWNER", "DEALER"] as const;

export function labelize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}
