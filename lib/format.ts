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
