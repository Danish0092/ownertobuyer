"use client";

import { useActionState, useMemo, useState } from "react";
import { AUTHORITY_STATUSES, labelize } from "@/lib/property-options";
import { PROJECT_DEVELOPMENT_STATUSES } from "@/lib/project-options";
import type { ProjectActionResult } from "./actions";

type AreaRow = { id: string; city_id: string; name: string };

const labelClass = "flex flex-col gap-1.5 font-body text-[13.5px] font-medium text-[#344054]";
const inputClass = "rounded-lg border border-[#EAEFF6] px-3 py-2.5 text-sm text-[#101828] outline-none focus:border-[#2563EB]";

// Reused for both creating a project (app/projects/new) and editing
// one (app/projects/[slug]/edit) — same split as PropertyForm and
// RequirementForm.
export function ProjectForm({
  cityId,
  cityName,
  areas,
  societies,
  action,
  initial,
  submitLabel = "Publish Project",
  showDraftOption = true,
}: {
  cityId: string;
  cityName: string;
  areas: AreaRow[];
  societies: AreaRow[];
  action: (prevState: ProjectActionResult, formData: FormData) => Promise<ProjectActionResult>;
  initial?: {
    name?: string;
    developerName?: string;
    description?: string;
    areaId?: string;
    societyId?: string;
    address?: string;
    approvalStatus?: string;
    developmentStatus?: string;
    minPriceLabel?: string;
    maxPriceLabel?: string;
    contactName?: string;
    contactPhone?: string;
  };
  submitLabel?: string;
  showDraftOption?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [intent, setIntent] = useState<"draft" | "publish">("publish");

  const filteredAreas = useMemo(() => areas.filter((a) => a.city_id === cityId), [areas, cityId]);
  const filteredSocieties = useMemo(() => societies.filter((s) => s.city_id === cityId), [societies, cityId]);

  return (
    <form action={formAction} className="mx-auto flex w-full max-w-[680px] flex-col gap-6">
      <input type="hidden" name="city_id" value={cityId} />
      <input type="hidden" name="intent" value={intent} />

      {state && "error" in state && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 font-body text-sm text-red-700">
          {state.error}
        </p>
      )}

      <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
        <h2 className="font-display text-base font-bold text-[#101828]">Project basics</h2>

        <label className={labelClass}>
          Project name *
          <input
            name="name"
            required
            defaultValue={initial?.name}
            className={inputClass}
            placeholder="e.g. Al-Noor Heights"
          />
        </label>

        <label className={labelClass}>
          Developer / Society name *
          <input
            name="developer_name"
            required
            defaultValue={initial?.developerName}
            className={inputClass}
            placeholder="e.g. Al-Noor Builders & Developers"
          />
        </label>

        <label className={labelClass}>
          Description
          <textarea
            name="description"
            rows={4}
            defaultValue={initial?.description}
            className={inputClass}
            placeholder="Optional"
          />
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
            <select name="society_id" className={inputClass} defaultValue={initial?.societyId ?? ""}>
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
          <input name="address" defaultValue={initial?.address} className={inputClass} placeholder="Optional" />
        </label>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
        <h2 className="font-display text-base font-bold text-[#101828]">Status & pricing</h2>

        <div className="grid grid-cols-2 gap-4">
          <label className={labelClass}>
            Development status
            <select name="development_status" className={inputClass} defaultValue={initial?.developmentStatus ?? "PLANNING"}>
              {PROJECT_DEVELOPMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {labelize(s)}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Approval / authority status
            <span className="font-body text-[11px] font-normal text-[#98A2B3]">Your own claim — not verified</span>
            <select name="approval_status" className={inputClass} defaultValue={initial?.approvalStatus ?? "NOT_PROVIDED"}>
              {AUTHORITY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {labelize(s)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className={labelClass}>
            Starting price (PKR)
            <input name="min_price" defaultValue={initial?.minPriceLabel} className={inputClass} placeholder="e.g. 45 Lac" />
          </label>
          <label className={labelClass}>
            Up to (PKR)
            <input name="max_price" defaultValue={initial?.maxPriceLabel} className={inputClass} placeholder="e.g. 1.20 Crore" />
          </label>
        </div>
        <p className="text-[11.5px] text-[#98A2B3]">
          This is a headline range shown on the project card — exact unit prices are set per unit type in Project
          Inventory after saving.
        </p>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
        <h2 className="font-display text-base font-bold text-[#101828]">Contact</h2>
        <div className="grid grid-cols-2 gap-4">
          <label className={labelClass}>
            Contact name
            <input name="contact_name" defaultValue={initial?.contactName} className={inputClass} placeholder="e.g. Sales Office" />
          </label>
          <label className={labelClass}>
            Contact phone
            <input
              name="contact_phone"
              type="tel"
              defaultValue={initial?.contactPhone}
              className={inputClass}
              placeholder="03xx-xxxxxxx"
            />
          </label>
        </div>
      </section>

      <div className="flex gap-2.5">
        {showDraftOption && (
          <button
            type="submit"
            onClick={() => setIntent("draft")}
            disabled={pending}
            className="flex-1 rounded-[10px] bg-[#F1F5F9] px-6 py-3 font-display text-sm font-bold text-[#475467] disabled:opacity-50"
          >
            {pending && intent === "draft" ? "Saving..." : "Save as Draft"}
          </button>
        )}
        <button
          type="submit"
          onClick={() => setIntent("publish")}
          disabled={pending}
          className="flex-[2] rounded-[10px] bg-gradient-to-br from-[#F59E0B] to-[#EA7D0B] px-6 py-3 font-display text-sm font-extrabold text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)] disabled:opacity-50"
        >
          {pending && intent === "publish" ? "Publishing..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
