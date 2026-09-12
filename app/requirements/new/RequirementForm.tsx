"use client";

import { useActionState, useMemo, useState } from "react";
import {
  PROPERTY_CATEGORIES,
  PROPERTY_TYPES_BY_CATEGORY,
  PROPERTY_PURPOSES,
  SIZE_UNITS,
  FURNISHED_STATUSES,
  labelize,
  type PropertyCategory,
} from "@/lib/property-options";
import type { RequirementActionResult } from "./actions";

type LookupRow = { id: string; name: string };
type AreaRow = { id: string; city_id: string; name: string };

const PAYMENT_TYPES = ["ANY", "CASH", "INSTALLMENTS", "BANK_FINANCING"] as const;
const EXPIRY_OPTIONS = [
  { days: 30, label: "30 days" },
  { days: 60, label: "60 days" },
  { days: 90, label: "90 days" },
];

const labelClass = "flex flex-col gap-1.5 font-body text-[13.5px] font-medium text-[#344054]";
const inputClass = "rounded-lg border border-[#EAEFF6] px-3 py-2.5 text-sm text-[#101828] outline-none focus:border-[#2563EB]";

// Reused for both posting a new requirement (app/requirements/new) and
// editing an existing one (app/requirements/[id]/edit) — same split as
// PropertyForm between app/properties/new and .../[slug]/edit.
export function RequirementForm({
  cityId,
  cityName,
  areas,
  societies,
  action,
  initial,
  submitLabel = "Post Requirement — FREE",
  pendingLabel = "Posting...",
  successView,
}: {
  cityId: string;
  cityName: string;
  areas: AreaRow[];
  societies: AreaRow[];
  action: (prevState: RequirementActionResult, formData: FormData) => Promise<RequirementActionResult>;
  initial?: {
    title?: string;
    description?: string;
    purpose?: string;
    category?: PropertyCategory;
    propertyType?: string;
    areaId?: string;
    societyId?: string;
    minSize?: number;
    maxSize?: number;
    sizeUnit?: string;
    minBudgetLabel?: string;
    maxBudgetLabel?: string;
    paymentType?: string;
    possessionRequired?: boolean;
    bedroomsMin?: number;
    bathroomsMin?: number;
    furnishedStatus?: string;
    expiryDays?: number;
  };
  submitLabel?: string;
  pendingLabel?: string;
  successView?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [category, setCategory] = useState<PropertyCategory | "">(initial?.category ?? "");

  const availableTypes = category ? PROPERTY_TYPES_BY_CATEGORY[category] : [];
  const filteredAreas = useMemo(() => areas.filter((a) => a.city_id === cityId), [areas, cityId]);
  const filteredSocieties = useMemo(() => societies.filter((s) => s.city_id === cityId), [societies, cityId]);

  if (state && "ok" in state && successView) {
    return successView;
  }

  return (
    <form action={formAction} className="mx-auto flex w-full max-w-[680px] flex-col gap-6">
      <input type="hidden" name="city_id" value={cityId} />
      <input type="hidden" name="city_name" value={cityName} />

      {state && "error" in state && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 font-body text-sm text-red-700">
          {state.error}
        </p>
      )}

      <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
        <h2 className="font-display text-base font-bold text-[#101828]">What are you looking for?</h2>

        <div className="grid grid-cols-2 gap-4">
          <label className={labelClass}>
            Purpose *
            <select name="purpose" required defaultValue={initial?.purpose ?? "SALE"} className={inputClass}>
              {PROPERTY_PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p === "SALE" ? "Buy" : "Rent"}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            Category
            <select
              name="category"
              className={inputClass}
              value={category}
              onChange={(e) => setCategory(e.target.value as PropertyCategory | "")}
            >
              <option value="">Any category</option>
              {PROPERTY_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {labelize(c)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className={labelClass}>
          Property type
          <select name="property_type" className={inputClass} disabled={!category} defaultValue={initial?.propertyType ?? ""}>
            <option value="">{category ? "Any type" : "Choose a category first"}</option>
            {availableTypes.map((t) => (
              <option key={t} value={t}>
                {labelize(t)}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Title
          <input
            name="title"
            defaultValue={initial?.title}
            className={inputClass}
            placeholder={`e.g. 5 Marla Plot in DHA Phase 9, ${cityName}`}
          />
        </label>

        <label className={labelClass}>
          Anything else sellers should know?
          <textarea name="description" rows={3} defaultValue={initial?.description} className={inputClass} placeholder="Optional" />
        </label>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
        <h2 className="font-display text-base font-bold text-[#101828]">Location</h2>

        <label className={labelClass}>
          City
          <input value={cityName} disabled className={`${inputClass} bg-[#F7F9FC] text-[#98A2B3]`} />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className={labelClass}>
            Area
            <select name="area_id" className={inputClass} defaultValue={initial?.areaId ?? ""}>
              <option value="">Any area</option>
              {filteredAreas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            Society
            <select name="society_id" className={inputClass} defaultValue={initial?.societyId ?? ""}>
              <option value="">Any society</option>
              {filteredSocieties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
        <h2 className="font-display text-base font-bold text-[#101828]">Budget & size</h2>

        <div className="grid grid-cols-2 gap-4">
          <label className={labelClass}>
            Min budget (PKR) *
            <input
              name="min_budget"
              required
              defaultValue={initial?.minBudgetLabel}
              className={inputClass}
              placeholder="e.g. 1.40 Crore"
            />
          </label>
          <label className={labelClass}>
            Max budget (PKR) *
            <input
              name="max_budget"
              required
              defaultValue={initial?.maxBudgetLabel}
              className={inputClass}
              placeholder="e.g. 1.50 Crore"
            />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <label className={labelClass}>
            Min size
            <input
              name="min_size"
              type="number"
              min={0}
              step="0.01"
              defaultValue={initial?.minSize}
              className={inputClass}
              placeholder="Optional"
            />
          </label>
          <label className={labelClass}>
            Max size
            <input
              name="max_size"
              type="number"
              min={0}
              step="0.01"
              defaultValue={initial?.maxSize}
              className={inputClass}
              placeholder="Optional"
            />
          </label>
          <label className={labelClass}>
            Unit
            <select name="size_unit" className={inputClass} defaultValue={initial?.sizeUnit ?? ""}>
              <option value="">—</option>
              {SIZE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {labelize(u)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className={labelClass}>
            Payment
            <select name="payment_type" className={inputClass} defaultValue={initial?.paymentType ?? "ANY"}>
              {PAYMENT_TYPES.map((p) => (
                <option key={p} value={p}>
                  {labelize(p)}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Furnished
            <select name="furnished_status" className={inputClass} defaultValue={initial?.furnishedStatus ?? ""}>
              <option value="">No preference</option>
              {FURNISHED_STATUSES.filter((s) => s !== "NOT_APPLICABLE" && s !== "NOT_SPECIFIED").map((s) => (
                <option key={s} value={s}>
                  {labelize(s)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className={labelClass}>
            Min bedrooms
            <input
              name="bedrooms_min"
              type="number"
              min={0}
              defaultValue={initial?.bedroomsMin}
              className={inputClass}
              placeholder="Optional"
            />
          </label>
          <label className={labelClass}>
            Min bathrooms
            <input
              name="bathrooms_min"
              type="number"
              min={0}
              defaultValue={initial?.bathroomsMin}
              className={inputClass}
              placeholder="Optional"
            />
          </label>
        </div>

        <label className="flex items-center gap-2.5 font-body text-sm text-[#344054]">
          <input
            name="possession_required"
            type="checkbox"
            defaultChecked={initial?.possessionRequired}
            className="h-4 w-4"
          />
          I need possession immediately (can&apos;t wait for construction)
        </label>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
        <h2 className="font-display text-base font-bold text-[#101828]">How long should this stay active?</h2>
        <div className="flex gap-2.5">
          {EXPIRY_OPTIONS.map((opt) => (
            <label
              key={opt.days}
              className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-[#EAEFF6] py-2.5 font-display text-[13px] font-bold text-[#344054] has-[:checked]:border-[#2563EB] has-[:checked]:bg-[#EFF6FF] has-[:checked]:text-[#2563EB]"
            >
              <input
                type="radio"
                name="expiry_days"
                value={opt.days}
                defaultChecked={(initial?.expiryDays ?? 30) === opt.days}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </section>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-[10px] bg-gradient-to-br from-[#F59E0B] to-[#EA7D0B] px-6 py-3 font-display text-sm font-extrabold text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)] disabled:opacity-50"
      >
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
