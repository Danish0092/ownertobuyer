export function priceLabel(price: number, priceType: string) {
  const n = Number(price);
  const formatted =
    n >= 10000000 ? `PKR ${(n / 10000000).toFixed(2)} Crore` :
    n >= 100000 ? `PKR ${(n / 100000).toFixed(1)} Lac` :
    `PKR ${n.toLocaleString("en-PK")}`;
  return priceType === "PER_MONTH" ? `${formatted}/mo` : formatted;
}

export function specsLine(size: number | null, sizeUnit: string | null, bedrooms: number | null, bathrooms: number | null) {
  return [
    size ? `${size} ${sizeUnit ?? ""}`.trim() : null,
    bedrooms != null ? `${bedrooms} Bed` : null,
    bathrooms != null ? `${bathrooms} Bath` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function areaLine(society: string | null | undefined, area: string | null | undefined, city: string | null | undefined) {
  return [society, area, city].filter(Boolean).join(", ");
}

// Used by buyer requirements, which store a min/max range rather than
// a single price. Formats each end the same way priceLabel does, but
// drops the repeated "PKR" prefix on the first number when both ends
// land in the same unit (e.g. "1.90 – 2.10 Crore" not "PKR 1.90 Crore
// – PKR 2.10 Crore").
export function priceRangeLabel(min: number, max: number) {
  const minLabel = priceLabel(min, "TOTAL");
  const maxLabel = priceLabel(max, "TOTAL");
  const minUnit = minLabel.split(" ").pop();
  const maxUnit = maxLabel.split(" ").pop();
  if (minUnit === maxUnit) {
    const minNumber = minLabel.replace("PKR ", "").replace(` ${minUnit}`, "");
    return `${minNumber} – ${maxLabel.replace("PKR ", "")}`;
  }
  return `${minLabel} – ${maxLabel}`;
}

export function sizeRangeLabel(min: number | null, max: number | null, unit: string | null) {
  if (min == null && max == null) return null;
  const u = unit ?? "";
  if (min != null && max != null && min !== max) return `${min} – ${max} ${u}`.trim();
  return `${min ?? max} ${u}`.trim();
}
