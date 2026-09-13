import { parsePakistaniPrice } from "@/lib/parse-price";
import { AUTHORITY_STATUSES } from "@/lib/property-options";
import { PROJECT_DEVELOPMENT_STATUSES } from "@/lib/project-options";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  return v.trim();
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  if (value && (allowed as readonly string[]).includes(value)) return value as T;
  return null;
}

// Shared by both create (app/projects/new/actions.ts) and edit
// (app/projects/[slug]/edit/actions.ts) — same split as
// lib/parse-property-form.ts and lib/parse-requirement-form.ts.
export function parseProjectForm(formData: FormData): { error: string } | { fields: ProjectFields } {
  const name = str(formData, "name");
  const developerName = str(formData, "developer_name");
  const cityId = str(formData, "city_id");

  if (!name || !developerName || !cityId) {
    return { error: "Please fill in all required fields." };
  }

  const minPriceRaw = str(formData, "min_price");
  const maxPriceRaw = str(formData, "max_price");
  const minPrice = minPriceRaw ? parsePakistaniPrice(minPriceRaw) : null;
  const maxPrice = maxPriceRaw ? parsePakistaniPrice(maxPriceRaw) : null;
  if (minPriceRaw && minPrice === null) {
    return { error: 'Starting price doesn\'t look right — try e.g. "1.40 Crore" or "50 Lac".' };
  }
  if (maxPriceRaw && maxPrice === null) {
    return { error: 'Maximum price doesn\'t look right — try e.g. "1.40 Crore" or "50 Lac".' };
  }
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    return { error: "Starting price can't be more than the maximum price." };
  }

  return {
    fields: {
      name,
      developer_name: developerName,
      description: str(formData, "description"),
      city_id: cityId,
      area_id: str(formData, "area_id"),
      society_id: str(formData, "society_id"),
      address: str(formData, "address"),
      approval_status: oneOf(str(formData, "approval_status"), AUTHORITY_STATUSES) ?? "NOT_PROVIDED",
      development_status: oneOf(str(formData, "development_status"), PROJECT_DEVELOPMENT_STATUSES) ?? "PLANNING",
      min_price: minPrice,
      max_price: maxPrice,
      contact_name: str(formData, "contact_name"),
      contact_phone: str(formData, "contact_phone"),
    },
  };
}

export type ProjectFields = {
  name: string;
  developer_name: string;
  description: string | null;
  city_id: string;
  area_id: string | null;
  society_id: string | null;
  address: string | null;
  approval_status: string;
  development_status: string;
  min_price: number | null;
  max_price: number | null;
  contact_name: string | null;
  contact_phone: string | null;
};
