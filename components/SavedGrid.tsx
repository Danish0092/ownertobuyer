"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PropertyCard, type PropertyCardData } from "@/components/PropertyCard";

export type SavedCard = { propertyId: string; card: PropertyCardData };

// Client wrapper so unsaving here removes the card immediately, instead
// of only being possible from inside each property's own detail page.
export function SavedGrid({ initialItems }: { initialItems: SavedCard[] }) {
  const supabase = createClient();
  const [items, setItems] = useState(initialItems);

  async function unsave(propertyId: string) {
    const prev = items;
    setItems((cur) => cur.filter((i) => i.propertyId !== propertyId)); // optimistic

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("property_id", propertyId);
    if (error) setItems(prev); // revert on failure
  }

  if (items.length === 0) {
    return (
      <div className="px-6 py-24 text-center text-[#667085]">
        <h3 className="mb-2 font-display text-lg font-bold text-[#101828]">No saved properties yet</h3>
        <p className="mb-5 text-sm">Tap the heart on any listing to save it here for later.</p>
        <a
          href="/search"
          className="inline-block rounded-[10px] bg-[#2563EB] px-6 py-2.5 font-display text-[13px] font-bold text-white"
        >
          Browse Properties
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-[1140px] grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 px-6 pb-12 pt-2">
      {items.map(({ propertyId, card }) => (
        <PropertyCard key={propertyId} data={{ ...card, saved: true, onToggleSave: () => unsave(propertyId) }} />
      ))}
    </div>
  );
}
