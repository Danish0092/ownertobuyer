"use client";

import { useState } from "react";
import { PROPERTY_TYPES, labelize, type PropertyType } from "@/lib/property-options";

export type SearchFilters = {
  propertyType: PropertyType | null;
  bedrooms: number | null;
  furnished: "FURNISHED" | "SEMI_FURNISHED" | "UNFURNISHED" | null;
  priceMax: number | null;
};

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5];
const FURNISHED_OPTIONS: SearchFilters["furnished"][] = ["FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-[#2563EB] px-3.5 py-2 font-display text-[12.5px] font-bold text-white"
          : "rounded-full bg-[#F1F5F9] px-3.5 py-2 font-display text-[12.5px] font-bold text-[#475467]"
      }
    >
      {children}
    </button>
  );
}

export function FilterModal({
  open,
  onClose,
  filters,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
}) {
  const [draft, setDraft] = useState<SearchFilters>(filters);

  if (!open) return null;

  const empty: SearchFilters = { propertyType: null, bedrooms: null, furnished: null, priceMax: null };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[85vh] w-full max-w-[440px] overflow-y-auto rounded-t-2xl bg-white p-6 sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-extrabold text-[#101828]">Filters</h3>
          <button type="button" onClick={onClose} className="text-sm text-[#667085]">
            Close
          </button>
        </div>

        <div className="mb-5">
          <div className="mb-2 font-display text-[13px] font-bold text-[#101828]">Property Type</div>
          <div className="flex flex-wrap gap-2">
            <Chip active={draft.propertyType === null} onClick={() => setDraft({ ...draft, propertyType: null })}>
              Any
            </Chip>
            {PROPERTY_TYPES.map((t) => (
              <Chip
                key={t}
                active={draft.propertyType === t}
                onClick={() => setDraft({ ...draft, propertyType: t })}
              >
                {labelize(t)}
              </Chip>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <div className="mb-2 font-display text-[13px] font-bold text-[#101828]">Bedrooms</div>
          <div className="flex flex-wrap gap-2">
            <Chip active={draft.bedrooms === null} onClick={() => setDraft({ ...draft, bedrooms: null })}>
              Any
            </Chip>
            {BEDROOM_OPTIONS.map((n) => (
              <Chip key={n} active={draft.bedrooms === n} onClick={() => setDraft({ ...draft, bedrooms: n })}>
                {n}
                {n === 5 ? "+" : ""}
              </Chip>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <div className="mb-2 font-display text-[13px] font-bold text-[#101828]">Furnished</div>
          <div className="flex flex-wrap gap-2">
            <Chip active={draft.furnished === null} onClick={() => setDraft({ ...draft, furnished: null })}>
              Any
            </Chip>
            {FURNISHED_OPTIONS.map((f) => (
              <Chip key={f} active={draft.furnished === f} onClick={() => setDraft({ ...draft, furnished: f })}>
                {labelize(f!)}
              </Chip>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-2 font-display text-[13px] font-bold text-[#101828]">
            Max Price {draft.priceMax ? `— PKR ${draft.priceMax.toLocaleString("en-PK")}` : ""}
          </div>
          <input
            type="range"
            min={1000000}
            max={500000000}
            step={1000000}
            value={draft.priceMax ?? 500000000}
            onChange={(e) => setDraft({ ...draft, priceMax: Number(e.target.value) })}
            className="w-full"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setDraft(empty);
              onApply(empty);
            }}
            className="flex-1 rounded-xl border border-[#E4E9F2] py-3 font-display text-sm font-bold text-[#475467]"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="flex-1 rounded-xl bg-[#2563EB] py-3 font-display text-sm font-bold text-white"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
