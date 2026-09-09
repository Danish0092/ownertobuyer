// The PostProperty wizard design uses a free-text price field
// ("e.g. 5.25 Crore") rather than a plain number input — Pakistani
// real-estate listings are conventionally priced in Crore/Lac.
// Parses that into the plain numeric PKR value the schema stores.
export function parsePakistaniPrice(input: string): number | null {
  const cleaned = input.replace(/,/g, "").trim().toLowerCase();
  const m = cleaned.match(/^([\d.]+)\s*(crore|cr|lac|lakh|lakhs|k|thousand)?$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return null;
  switch (m[2]) {
    case "crore":
    case "cr":
      return n * 1e7;
    case "lac":
    case "lakh":
    case "lakhs":
      return n * 1e5;
    case "k":
    case "thousand":
      return n * 1e3;
    default:
      return n;
  }
}
