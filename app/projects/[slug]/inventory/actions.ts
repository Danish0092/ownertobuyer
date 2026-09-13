"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PROPERTY_TYPES, SIZE_UNITS } from "@/lib/property-options";

export type InventoryActionResult = { error: string } | { ok: true } | null;

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

export async function addInventoryItem(
  projectSlug: string,
  _prev: InventoryActionResult,
  formData: FormData
): Promise<InventoryActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const propertyType = str(formData, "property_type");
  if (!propertyType || !PROPERTY_TYPES.includes(propertyType as (typeof PROPERTY_TYPES)[number])) {
    return { error: "Please choose a valid unit type." };
  }

  const priceMin = num(formData, "price_min");
  if (priceMin === null) return { error: "Starting price is required." };
  const priceMax = num(formData, "price_max");
  if (priceMax !== null && priceMin > priceMax) return { error: "Starting price can't exceed the maximum price." };

  const sizeUnit = str(formData, "size_unit");
  if (sizeUnit && !SIZE_UNITS.includes(sizeUnit as (typeof SIZE_UNITS)[number])) {
    return { error: "Invalid size unit." };
  }

  const totalUnits = num(formData, "total_units");
  const availableUnits = num(formData, "available_units");
  if (totalUnits !== null && availableUnits !== null && availableUnits > totalUnits) {
    return { error: "Available units can't exceed total units." };
  }

  // RLS ("Project inventory insert: own project or admin") re-checks
  // ownership at the database level regardless of this lookup — this
  // is just so a mismatched project can fail with a clear message
  // instead of a generic RLS denial.
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("slug", projectSlug)
    .eq("developer_id", user.id)
    .maybeSingle();
  if (!project) return { error: "Project not found or it doesn't belong to you." };

  const { error } = await supabase.from("project_inventory").insert({
    project_id: project.id,
    property_type: propertyType,
    size: num(formData, "size"),
    size_unit: sizeUnit,
    price_min: priceMin,
    price_max: priceMax,
    total_units: totalUnits,
    available_units: availableUnits,
    payment_plan: str(formData, "payment_plan"),
  });

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectSlug}/inventory`);
  return { ok: true };
}

export async function deleteInventoryItem(itemId: string, projectSlug: string): Promise<InventoryActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.from("project_inventory").delete().eq("id", itemId);
  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectSlug}/inventory`);
  return { ok: true };
}
