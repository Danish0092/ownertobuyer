// Mirrors the enums defined in supabase/migrations/20260905124436_initial_schema.sql
// (plus the OTHER category added in 20260907150000_add_other_property_category.sql).
// Kept as plain data so both the client form and the server action can
// validate against the same source of truth.

// PROJECTS was added in 20260918120000_expand_property_categories.sql.
export const PROPERTY_CATEGORIES = [
  "RESIDENTIAL",
  "COMMERCIAL",
  "AGRICULTURAL",
  "PROJECTS",
  "OTHER",
] as const;
export type PropertyCategory = (typeof PROPERTY_CATEGORIES)[number];

export const PROPERTY_TYPES = [
  // Residential
  "HOUSE",
  "VILLA",
  "APARTMENT",
  "TOWNHOUSE",
  "PENTHOUSE",
  "FARM_HOUSE",
  "UPPER_PORTION",
  "LOWER_PORTION",
  "ROOM_STUDIO",
  "PLOT",
  "RESIDENTIAL_FILE",
  // Commercial
  "SHOP",
  "OFFICE",
  "SHOWROOM",
  "BUILDING",
  "COMMERCIAL_UNIT",
  "WAREHOUSE",
  "FACTORY",
  "HOTEL",
  "RESTAURANT_CAFE",
  "PETROL_STATION",
  // Land & agricultural
  "AGRICULTURAL_LAND",
  "FARM_LAND",
  "INDUSTRIAL_LAND",
  "COMMERCIAL_LAND",
  "RESIDENTIAL_LAND",
  "ORCHARD_NURSERY",
  // Projects & investments
  "NEW_DEVELOPMENT_PROJECT",
  "HOUSING_SOCIETY",
  "APARTMENT_PROJECT",
  "VILLA_PROJECT",
  "COMMERCIAL_PROJECT",
  "INSTALLMENT_PLAN",
  "INVESTMENT_OPPORTUNITY",
  "PRE_LAUNCH_PROJECT",
  "RENTAL_RETURN_PROPERTY",
  "OTHER",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

// Which property_type values are selectable once a category is chosen.
// PLOT is valid under both RESIDENTIAL and COMMERCIAL (a plot bought to
// build a house vs. one bought for a shop/warehouse); FARM_HOUSE is valid
// under RESIDENTIAL and AGRICULTURAL ("Farmhouses & Farms").
export const PROPERTY_TYPES_BY_CATEGORY: Record<PropertyCategory, PropertyType[]> = {
  RESIDENTIAL: [
    "HOUSE",
    "VILLA",
    "APARTMENT",
    "TOWNHOUSE",
    "PENTHOUSE",
    "FARM_HOUSE",
    "UPPER_PORTION",
    "LOWER_PORTION",
    "ROOM_STUDIO",
    "PLOT",
    "RESIDENTIAL_FILE",
  ],
  COMMERCIAL: [
    "PLOT",
    "SHOP",
    "OFFICE",
    "SHOWROOM",
    "BUILDING",
    "COMMERCIAL_UNIT",
    "WAREHOUSE",
    "FACTORY",
    "HOTEL",
    "RESTAURANT_CAFE",
    "PETROL_STATION",
  ],
  AGRICULTURAL: [
    "AGRICULTURAL_LAND",
    "FARM_LAND",
    "FARM_HOUSE",
    "INDUSTRIAL_LAND",
    "COMMERCIAL_LAND",
    "RESIDENTIAL_LAND",
    "ORCHARD_NURSERY",
  ],
  PROJECTS: [
    "NEW_DEVELOPMENT_PROJECT",
    "HOUSING_SOCIETY",
    "APARTMENT_PROJECT",
    "VILLA_PROJECT",
    "COMMERCIAL_PROJECT",
    "INSTALLMENT_PLAN",
    "INVESTMENT_OPPORTUNITY",
    "PRE_LAUNCH_PROJECT",
    "RENTAL_RETURN_PROPERTY",
  ],
  OTHER: ["OTHER"],
};

const LABEL_OVERRIDES: Record<string, string> = {
  AGRICULTURAL: "Land & Agricultural",
  PROJECTS: "Projects & Investments",
  APARTMENT: "Apartment / Flat",
  ROOM_STUDIO: "Room / Studio",
  RESTAURANT_CAFE: "Restaurant / Cafe",
  ORCHARD_NURSERY: "Orchard / Nursery",
  FARM_HOUSE: "Farmhouse",
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

// properties.seller_type — who's listed as selling THIS property.
// Deliberately separate from a profile's own account_type (a dealer
// account isn't forced to have every listing tagged dealer-owned).
export const SELLER_TYPES = ["OWNER", "DEALER"] as const;

// profiles.account_type — the four product account types. Distinct
// from SELLER_TYPES above even though OWNER/DEALER happen to overlap;
// this drives which dashboard a user sees, not property listing
// authorization (RLS never checks account_type, only seller_id/buyer_id
// ownership — see 20260913120000_add_buyer_developer_account_types.sql).
// Chosen once at onboarding as the user's primary type / initial intent —
// used for admin visibility and analytics, not to gate marketplace features.
export const ACCOUNT_TYPES = ["BUYER", "OWNER", "DEALER", "DEVELOPER"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  OWNER: "Seller / Owner",
  BUYER: "Buyer",
  DEALER: "Dealer / Realtor",
  DEVELOPER: "Developer / Society",
};

export function labelize(value: string): string {
  if (LABEL_OVERRIDES[value]) return LABEL_OVERRIDES[value];
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}
