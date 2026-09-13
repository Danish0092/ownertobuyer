"use client";

import { useActionState } from "react";
import { PROPERTY_TYPES, SIZE_UNITS, labelize } from "@/lib/property-options";
import { addInventoryItem, type InventoryActionResult } from "./actions";

const labelClass = "flex flex-col gap-1.5 font-body text-[13px] font-medium text-[#344054]";
const inputClass = "rounded-lg border border-[#EAEFF6] px-3 py-2 text-sm text-[#101828] outline-none focus:border-[#2563EB]";

export function AddInventoryForm({ projectSlug }: { projectSlug: string }) {
  const boundAction = async (prev: InventoryActionResult, formData: FormData) =>
    addInventoryItem(projectSlug, prev, formData);
  const [state, formAction, pending] = useActionState(boundAction, null);

  return (
    <form
      action={formAction}
      key={state && "ok" in state ? Math.random() : "form"}
      className="flex flex-col gap-3.5 rounded-2xl bg-white p-5 shadow-[0_6px_18px_rgba(16,24,40,0.06)]"
    >
      <h3 className="font-display text-sm font-bold text-[#101828]">Add a unit type</h3>

      {state && "error" in state && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-body text-[12.5px] text-red-700">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Unit type *
          <select name="property_type" required className={inputClass} defaultValue="">
            <option value="" disabled>
              Choose type
            </option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {labelize(t)}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className={labelClass}>
            Size
            <input name="size" type="number" min={0} step="0.01" className={inputClass} placeholder="Optional" />
          </label>
          <label className={labelClass}>
            Unit
            <select name="size_unit" className={inputClass} defaultValue="">
              <option value="">—</option>
              {SIZE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {labelize(u)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Starting price (PKR) *
          <input name="price_min" type="number" min={0} required className={inputClass} placeholder="e.g. 4500000" />
        </label>
        <label className={labelClass}>
          Up to (PKR)
          <input name="price_max" type="number" min={0} className={inputClass} placeholder="Optional" />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Total units
          <input name="total_units" type="number" min={0} className={inputClass} placeholder="Optional" />
        </label>
        <label className={labelClass}>
          Available units
          <input name="available_units" type="number" min={0} className={inputClass} placeholder="Optional" />
        </label>
      </div>

      <label className={labelClass}>
        Payment plan
        <textarea name="payment_plan" rows={2} className={inputClass} placeholder="e.g. 20% down, 36 monthly installments" />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-[#0B2545] px-5 py-2.5 font-display text-sm font-bold text-white disabled:opacity-50"
      >
        {pending ? "Adding..." : "+ Add Unit Type"}
      </button>
    </form>
  );
}
