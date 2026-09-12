"use server";

import { createClient } from "@/lib/supabase/server";
import { parsePakistaniPrice } from "@/lib/parse-price";
import {
  PROPERTY_CATEGORIES,
  PROPERTY_TYPES,
  PROPERTY_PURPOSES,
  SIZE_UNITS,
  FURNISHED_STATUSES,
  type PropertyCategory,
} from "@/lib/property-options";

export type RequirementActionResult = { error: string } | { ok: true } | null;

const PAYMENT_TYPES = ["CASH", "INSTALLMENTS", "BANK_FINANCING", "ANY"] as const;
const EXPIRY_DAYS = [30, 60, 90] as const;

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

export async function createRequirement(
  _prev: RequirementActionResult,
  formData: FormData
): Promise<RequirementActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in to post a requirement." };

  const purpose = str(formData, "purpose");
  if (!purpose || !PROPERTY_PURPOSES.includes(purpose as (typeof PROPERTY_PURPOSES)[number])) {
    return { error: "Please choose whether you're looking to buy or rent." };
  }

  const cityId = str(formData, "city_id");
  if (!cityId) return { error: "City is required." };

  const category = str(formData, "category");
  if (category && !PROPERTY_CATEGORIES.includes(category as PropertyCategory)) {
    return { error: "Invalid property category." };
  }

  const minBudgetRaw = str(formData, "min_budget");
  const maxBudgetRaw = str(formData, "max_budget");
  if (!minBudgetRaw || !maxBudgetRaw) return { error: "Both minimum and maximum budget are required." };

  const minBudget = parsePakistaniPrice(minBudgetRaw);
  const maxBudget = parsePakistaniPrice(maxBudgetRaw);
  if (minBudget === null || maxBudget === null) {
    return { error: "Budget doesn't look right — try e.g. \"1.40 Crore\" or \"50 Lac\"." };
  }
  if (minBudget > maxBudget) return { error: "Minimum budget can't be more than maximum budget." };

  const minSize = num(formData, "min_size");
  const maxSize = num(formData, "max_size");
  if (minSize !== null && maxSize !== null && minSize > maxSize) {
    return { error: "Minimum size can't be more than maximum size." };
  }
  const sizeUnit = str(formData, "size_unit");
  if ((minSize !== null || maxSize !== null) && !sizeUnit) {
    return { error: "Pick a size unit if you're specifying a size range." };
  }
  if (sizeUnit && !SIZE_UNITS.includes(sizeUnit as (typeof SIZE_UNITS)[number])) {
    return { error: "Invalid size unit." };
  }

  const propertyType = str(formData, "property_type");
  if (propertyType && !PROPERTY_TYPES.includes(propertyType as (typeof PROPERTY_TYPES)[number])) {
    return { error: "Invalid property type." };
  }

  const paymentType = str(formData, "payment_type") ?? "ANY";
  if (!PAYMENT_TYPES.includes(paymentType as (typeof PAYMENT_TYPES)[number])) {
    return { error: "Invalid payment type." };
  }

  const expiryDays = Number(str(formData, "expiry_days") ?? "30");
  if (!EXPIRY_DAYS.includes(expiryDays as (typeof EXPIRY_DAYS)[number])) {
    return { error: "Invalid expiry period." };
  }
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();

  const furnishedStatus = str(formData, "furnished_status");
  if (furnishedStatus && !FURNISHED_STATUSES.includes(furnishedStatus as (typeof FURNISHED_STATUSES)[number])) {
    return { error: "Invalid furnished status." };
  }

  const title = str(formData, "title") ?? `Looking for a property in ${str(formData, "city_name") ?? "Lahore"}`;

  const { error } = await supabase.from("buyer_requirements").insert({
    buyer_id: user.id,
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
    payment_type: paymentType,
    possession_required: formData.get("possession_required") === "on",
    bedrooms_min: num(formData, "bedrooms_min"),
    bathrooms_min: num(formData, "bathrooms_min"),
    furnished_status: furnishedStatus,
    status: "ACTIVE",
    expires_at: expiresAt,
  });

  if (error) return { error: error.message };

  return { ok: true };
}
