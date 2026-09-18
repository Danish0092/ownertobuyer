"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PurposeTabs } from "@/components/PurposeTabs";
import { SearchBar } from "@/components/SearchBar";
import { FilterModal, type SearchFilters } from "@/components/FilterModal";

export type SearchState = {
  purpose: "SALE" | "RENT";
  q: string;
  sort: string;
  filters: SearchFilters;
};

// Owns all interactive header state for the Search page and pushes it
// into the URL as query params — the page itself (a Server Component)
// reads those params and re-queries Supabase, so every control here
// is just "set search params and let the server re-render."
export function SearchControls({ initial }: { initial: SearchState }) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  function push(next: SearchState) {
    setState(next);
    const params = new URLSearchParams();
    if (next.purpose !== "SALE") params.set("purpose", next.purpose);
    if (next.q) params.set("q", next.q);
    if (next.sort !== "recommended") params.set("sort", next.sort);
    if (next.filters.propertyType) params.set("type", next.filters.propertyType);
    if (next.filters.bedrooms) params.set("beds", String(next.filters.bedrooms));
    if (next.filters.furnished) params.set("furnished", next.filters.furnished);
    if (next.filters.priceMax) params.set("priceMax", String(next.filters.priceMax));
    router.push(`/search?${params.toString()}`);
  }

  const activeFilterCount = [
    state.filters.propertyType,
    state.filters.bedrooms,
    state.filters.furnished,
    state.filters.priceMax,
  ].filter(Boolean).length;

  return (
    <div className="bg-gradient-to-br from-[#0B2545] to-[#1D4ED8] px-6 py-8">
      <div className="mx-auto max-w-[1140px]">
        <h1 className="mb-3.5 font-display text-[26px] font-extrabold text-white">Properties in Lahore</h1>
        <div className="flex flex-wrap items-center gap-2.5">
          <PurposeTabs value={state.purpose} onChange={(purpose) => push({ ...state, purpose })} variant="dark" />
          <SearchBar
            value={state.q}
            onChange={(q) => setState({ ...state, q })}
            onSubmit={() => push(state)}
            placeholder="Search location, area or society"
            inputClassName="border-none text-[#101828] bg-white"
          />
          <button
            type="button"
            onClick={() => setFilterModalOpen(true)}
            className="rounded-xl bg-[#F59E0B] px-5 py-3 font-display text-[13px] font-bold text-white"
          >
            Filters {activeFilterCount > 0 ? activeFilterCount : ""}
          </button>
        </div>
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <select
            value={state.sort}
            onChange={(e) => push({ ...state, sort: e.target.value })}
            className="ml-auto rounded-[10px] border-none px-3 py-2.5 font-display text-[12.5px] font-semibold text-[#123A63]"
          >
            <option value="recommended">Recommended</option>
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="views">Most Viewed</option>
          </select>
        </div>
      </div>

      <FilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        filters={state.filters}
        onApply={(filters) => {
          setFilterModalOpen(false);
          push({ ...state, filters });
        }}
      />
    </div>
  );
}
