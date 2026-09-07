"use client";

import { useActionState, useMemo, useState } from "react";
import {
  PROPERTY_CATEGORIES,
  PROPERTY_TYPES_BY_CATEGORY,
  PROPERTY_PURPOSES,
  SIZE_UNITS,
  PRICE_TYPES,
  POSSESSION_STATUSES,
  FURNISHED_STATUSES,
  CONSTRUCTION_STATUSES,
  AUTHORITY_STATUSES,
  SELLER_TYPES,
  labelize,
  type PropertyCategory,
} from "@/lib/property-options";
import { createProperty } from "./actions";

type LookupRow = { id: string; name: string };
type AreaRow = { id: string; city_id: string; name: string };
type AmenityRow = { id: string; name: string; category: string | null };

const inputClass =
  "rounded border border-black/[.15] px-3 py-2 text-sm dark:border-white/[.2] dark:bg-black dark:text-zinc-50";
const labelClass = "flex flex-col gap-1 text-sm text-black dark:text-zinc-50";

export function PropertyForm({
  cities,
  areas,
  societies,
  amenities,
  defaultSellerType,
}: {
  cities: LookupRow[];
  areas: AreaRow[];
  societies: AreaRow[];
  amenities: AmenityRow[];
  defaultSellerType: string;
}) {
  const [state, formAction, pending] = useActionState(createProperty, null);

  const [category, setCategory] = useState<PropertyCategory>("RESIDENTIAL");
  const [cityId, setCityId] = useState(cities[0]?.id ?? "");

  const availableTypes = PROPERTY_TYPES_BY_CATEGORY[category];
  const filteredAreas = useMemo(
    () => areas.filter((a) => a.city_id === cityId),
    [areas, cityId]
  );
  const filteredSocieties = useMemo(
    () => societies.filter((s) => s.city_id === cityId),
    [societies, cityId]
  );

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {state?.error && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-medium text-black dark:text-zinc-50">Basics</h2>

        <label className={labelClass}>
          Title *
          <input name="title" required className={inputClass} placeholder="e.g. 5 Marla House in DHA Phase 6" />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className={labelClass}>
            Purpose *
            <select name="purpose" required className={inputClass} defaultValue="SALE">
              {PROPERTY_PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {labelize(p)}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            Seller type *
            <select name="seller_type" required className={inputClass} defaultValue={defaultSellerType}>
              {SELLER_TYPES.map((s) => (
                <option key={s} value={s}>
                  {labelize(s)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className={labelClass}>
            Category *
            <select
              name="category"
              required
              className={inputClass}
              value={category}
              onChange={(e) => setCategory(e.target.value as PropertyCategory)}
            >
              {PROPERTY_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {labelize(c)}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            Property type *
            <select name="property_type" required className={inputClass}>
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {labelize(t)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className={labelClass}>
          Description
          <textarea name="description" rows={4} className={inputClass} />
        </label>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-medium text-black dark:text-zinc-50">Location</h2>

        <label className={labelClass}>
          City *
          <select
            name="city_id"
            required
            className={inputClass}
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
          >
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className={labelClass}>
            Area
            <select name="area_id" className={inputClass} defaultValue="">
              <option value="">— None —</option>
              {filteredAreas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            Society
            <select name="society_id" className={inputClass} defaultValue="">
              <option value="">— None —</option>
              {filteredSocieties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className={labelClass}>
          Address
          <input name="address" className={inputClass} placeholder="Street / plot number" />
        </label>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-medium text-black dark:text-zinc-50">Price & size</h2>

        <div className="grid grid-cols-2 gap-4">
          <label className={labelClass}>
            Price (PKR) *
            <input name="price" type="number" min={0} step="0.01" required className={inputClass} />
          </label>
          <label className={labelClass}>
            Price type
            <select name="price_type" className={inputClass} defaultValue="TOTAL">
              {PRICE_TYPES.map((p) => (
                <option key={p} value={p}>
                  {labelize(p)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className={labelClass}>
            Size
            <input name="size" type="number" min={0} step="0.01" className={inputClass} />
          </label>
          <label className={labelClass}>
            Size unit
            <select name="size_unit" className={inputClass} defaultValue="">
              <option value="">— None —</option>
              {SIZE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {labelize(u)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-medium text-black dark:text-zinc-50">Details</h2>

        <div className="grid grid-cols-2 gap-4">
          <label className={labelClass}>
            Bedrooms
            <input name="bedrooms" type="number" min={0} className={inputClass} />
          </label>
          <label className={labelClass}>
            Bathrooms
            <input name="bathrooms" type="number" min={0} className={inputClass} />
          </label>
          <label className={labelClass}>
            Parking spaces
            <input name="parking_spaces" type="number" min={0} className={inputClass} />
          </label>
          <label className={labelClass}>
            Floor number
            <input name="floor_number" type="number" className={inputClass} />
          </label>
          <label className={labelClass}>
            Total floors
            <input name="total_floors" type="number" min={0} className={inputClass} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className={labelClass}>
            Possession status
            <select name="possession_status" className={inputClass} defaultValue="NOT_SPECIFIED">
              {POSSESSION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {labelize(s)}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Furnished status
            <select name="furnished_status" className={inputClass} defaultValue="NOT_SPECIFIED">
              {FURNISHED_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {labelize(s)}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Construction status
            <select name="construction_status" className={inputClass} defaultValue="NOT_SPECIFIED">
              {CONSTRUCTION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {labelize(s)}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Authority / NOC status <span className="text-xs text-zinc-500">(your claim, not verified)</span>
            <select name="authority_status" className={inputClass} defaultValue="NOT_PROVIDED">
              {AUTHORITY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {labelize(s)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-black dark:text-zinc-50">
          <input name="installment_available" type="checkbox" />
          Installments available
        </label>
      </section>

      {amenities.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-medium text-black dark:text-zinc-50">Amenities</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {amenities.map((a) => (
              <label key={a.id} className="flex items-center gap-2 text-sm text-black dark:text-zinc-50">
                <input type="checkbox" name="amenities" value={a.id} />
                {a.name}
              </label>
            ))}
          </div>
        </section>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-6 py-2.5 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? "Publishing..." : "Publish property"}
      </button>
    </form>
  );
}
