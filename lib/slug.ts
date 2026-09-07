export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Appends a short random suffix so titles that collide still get a
// unique, URL-safe slug without a round-trip to check uniqueness first.
export function uniqueSlug(input: string): string {
  const base = slugify(input) || "property";
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}
