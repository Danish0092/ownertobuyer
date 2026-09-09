"use client";

// Search input + submit button. Reused on the Home hero (inside a
// white card) and the Search page header (directly on the dark
// gradient) — callers control the surrounding container.

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Search DHA, Bahria Town, Gulberg, Johar Town...",
  inputClassName = "border-[1.5px] border-[#E4E9F2] text-[#101828]",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  inputClassName?: string;
}) {
  return (
    <div className="flex flex-1 flex-wrap gap-2.5">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        placeholder={placeholder}
        className={`min-w-[220px] flex-1 rounded-xl px-4 py-3.5 text-sm outline-none ${inputClassName}`}
      />
      <button
        type="button"
        onClick={onSubmit}
        className="rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#EA7D0B] px-7 py-3.5 font-display text-sm font-bold text-white shadow-[0_8px_18px_rgba(245,158,11,0.35)]"
      >
        Search Property
      </button>
    </div>
  );
}
