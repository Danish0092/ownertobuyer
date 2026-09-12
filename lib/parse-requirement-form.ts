import { parsePakistaniPrice } from "@/lib/parse-price";
import {
  PROPERTY_CATEGORIES,
  PROPERTY_TYPES,
  PROPERTY_TYPES_BY_CATEGORY,
  PROPERTY_PURPOSES,
  SIZE_UNITS,
  FURNISHED_STATUSES,
} from "@/lib/property-options";

const PAYMENT_TYPES = ["CASH", "INSTALLMENTS", "BANK_FINANCING", "ANY"] as const;

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

// Shared by both create (app/requirements/new/actions.ts) and edit
// (app/requirements/[id]/edit/actions.ts) — mirrors the split between
// lib/parse-property-form.ts and its two call sites.
export function parseRequirementForm(formData: FormData): { error: string } | { fields: RequirementFields } {
  const purpose = oneOf(str(formData, "purpose"), PROPERTY_PURPOSES);
  const cityId = str(formData, "city_id");

  if (!purpose || !cityId) {
    return { error: "Please fill in all required fields." };
  }

  const minBudgetRaw = str(formData, "min_budget");
  const maxBudgetRaw = str(formData, "max_budget");
  if (!minBudgetRaw || !maxBudgetRaw) return { error: "Both minimum and maximum budget are required." };

  const minBudget = parsePakistaniPrice(minBudgetRaw);
  const maxBudget = parsePakistaniPrice(maxBudgetRaw);
  if (minBudget === null || maxBudget === null) {
    return { error: 'Budget doesn\'t look right — try e.g. "1.40 Crore" or "50 Lac".' };
  }
  if (minBudget > maxBudget) return { error: "Minimum budget can't be more than maximum budget." };

  const minSize = num(formData, "min_size");
  const maxSize = num(formData, "max_size");
  if (minSize !== null && maxSize !== null && minSize > maxSize) {
    return { error: "Minimum size can't be more than maximum size." };
  }
  const sizeUnit = oneOf(str(formData, "size_unit"), SIZE_UNITS);
  if ((minSize !== null || maxSize !== null) && !sizeUnit) {
    return { error: "Pick a size unit if you're specifying a size range." };
  }

  const category = oneOf(str(formData, "category"), PROPERTY_CATEGORIES);
  const propertyType = oneOf(str(formData, "property_type"), PROPERTY_TYPES);
  if (propertyType && category && !PROPERTY_TYPES_BY_CATEGORY[category].includes(propertyType)) {
    return { error: "That property type doesn't belong to the selected category." };
  }

  const title = str(formData, "title") ?? `Looking for a property in ${str(formData, "city_name") ?? "Lahore"}`;

  return {
    fields: {
      title,
      description: str(formData, "description"),
      purpose,
      property_category: category,
      property_type: propertyType,
      city_id: cityId,
      area_id: str(formData, "area_id"),
      society_id: str(formData, "society_id"),
      min_size: minSize,
      max_size: maxSize,
      size_unit: sizeUnit,
      min_budget: minBudget,
      max_budget: maxBudget,
      payment_type: oneOf(str(formData, "payment_type"), PAYMENT_TYPES) ?? "ANY",
      possession_required: formData.get("possession_required") === "on",
      bedrooms_min: num(formData, "bedrooms_min"),
      bathrooms_min: num(formData, "bathrooms_min"),
      furnished_status: oneOf(str(formData, "furnished_status"), FURNISHED_STATUSES),
    },
  };
}

export type RequirementFields = {
  title: string;
  description: string | null;
  purpose: string;
  property_category: string | null;
  property_type: string | null;
  city_id: string;
  area_id: string | null;
  society_id: string | null;
  min_size: number | null;
  max_size: number | null;
  size_unit: string | null;
  min_budget: number;
  max_budget: number;
  payment_type: string;
  possession_required: boolean;
  bedrooms_min: number | null;
  bathrooms_min: number | null;
  furnished_status: string | null;
};
