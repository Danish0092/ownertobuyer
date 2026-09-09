"use client";

// All / Owner Direct / Dealer filter chips — used on the Search page,
// and reusable later on OwnerDirect or Dashboard-style listing pages.

const OPTIONS: { value: "ALL" | "OWNER" | "DEALER"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "OWNER", label: "Owner Direct" },
  { value: "DEALER", label: "Dealer" },
];

export function SellerTypeChips({
  value,
  onChange,
}: {
  value: "ALL" | "OWNER" | "DEALER";
  onChange: (v: "ALL" | "OWNER" | "DEALER") => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={
            value === o.value
              ? "rounded-full bg-gradient-to-br from-[#22C55E] to-[#14B8A6] px-4 py-2 font-display text-[12.5px] font-bold text-white"
              : "rounded-full bg-[#EEF2F7] px-4 py-2 font-display text-[12.5px] font-bold text-[#475467]"
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
