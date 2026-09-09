"use client";

// Buy/Rent segmented control. Reused on the Home hero search card and
// the Search page header, which use different color variants against
// their different backgrounds (white card vs. dark gradient).

export function PurposeTabs({
  value,
  onChange,
  variant = "light",
}: {
  value: "SALE" | "RENT";
  onChange: (v: "SALE" | "RENT") => void;
  variant?: "light" | "dark";
}) {
  const containerClass =
    variant === "light"
      ? "bg-[#F1F5F9]"
      : "bg-white/12";

  const activeClass =
    variant === "light"
      ? "bg-white text-[#0B2545] shadow-[0_2px_6px_rgba(16,24,40,0.12)]"
      : "bg-white text-[#0B2545]";

  const inactiveClass = variant === "light" ? "text-[#667085]" : "text-[#C7D6EE]";

  return (
    <div className={`flex w-fit gap-1.5 rounded-xl p-1 ${containerClass}`}>
      <button
        type="button"
        onClick={() => onChange("SALE")}
        className={`rounded-[9px] px-5 py-2 font-display text-[13px] font-bold ${value === "SALE" ? activeClass : inactiveClass}`}
      >
        Buy
      </button>
      <button
        type="button"
        onClick={() => onChange("RENT")}
        className={`rounded-[9px] px-5 py-2 font-display text-[13px] font-bold ${value === "RENT" ? activeClass : inactiveClass}`}
      >
        Rent
      </button>
    </div>
  );
}
