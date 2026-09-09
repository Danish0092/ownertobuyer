// SVG paths reproduced from the OwnerToBuyer landing page design
// (Claude Design artifact) for the homepage category quick-filters.

const PATHS: Record<string, string[]> = {
  house: ["M3 10.5 12 3l9 7.5", "M5 9.5V21h14V9.5", "M9 21v-6h6v6"],
  plot: ["M3 7l6-3 6 3 6-3v14l-6 3-6-3-6 3V7z", "M9 4v14", "M15 7v14"],
  commercial: ["M3 9l1.5-5h15L21 9", "M4 9h16v11H4z", "M9 20v-5h6v5"],
  agricultural: [
    "M2 20h20",
    "M6 20c0-4 2-6 2-6s2 2 2 6",
    "M14 20c0-5 2.5-8 2.5-8s2.5 3 2.5 8",
    "M8 14c0-3 1.5-5 1.5-5",
  ],
  farmhouse: ["M4 11.5 12 4l8 7.5", "M6 10.5V21h12V10.5", "M14 4.5V3h3v3"],
};

export function CategoryIcon({ name }: { name: keyof typeof PATHS | "apartment" }) {
  if (name === "apartment") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 22v-3h4v3" />
        <rect x="6" y="2" width="12" height="20" rx="1" />
        <path d="M9 6h1M14 6h1M9 10h1M14 10h1M9 14h1M14 14h1" />
      </svg>
    );
  }
  const paths = PATHS[name] ?? PATHS.house;
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
