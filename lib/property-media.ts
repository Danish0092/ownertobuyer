import type { SupabaseClient } from "@supabase/supabase-js";

export type MediaRow = {
  storage_path: string;
  media_type: "IMAGE" | "VIDEO";
  is_primary: boolean;
  sort_order: number;
};

// property-media is a private bucket (RLS keyed off the property's own
// status), so card grids can't just use a public URL — every photo needs
// a signed one. createSignedUrls signs a whole batch in a single request
// instead of one round trip per card.
export async function resolveCardMedia<T extends { id: string; property_media: MediaRow[] }>(
  supabase: SupabaseClient,
  properties: T[]
): Promise<Map<string, { photoUrl: string | null }>> {
  const primaryPathByProperty = new Map<string, string>();

  for (const p of properties) {
    const photos = p.property_media.filter((m) => m.media_type === "IMAGE").sort((a, b) => a.sort_order - b.sort_order);
    const primary = photos.find((m) => m.is_primary) ?? photos[0];
    if (primary) primaryPathByProperty.set(p.id, primary.storage_path);
  }

  const paths = [...primaryPathByProperty.values()];
  const { data: signed } =
    paths.length > 0 ? await supabase.storage.from("property-media").createSignedUrls(paths, 3600) : { data: [] };
  const urlByPath = new Map(
    (signed ?? []).filter((s): s is typeof s & { path: string } => s.path != null).map((s) => [s.path, s.signedUrl])
  );

  const result = new Map<string, { photoUrl: string | null }>();
  for (const p of properties) {
    const path = primaryPathByProperty.get(p.id);
    result.set(p.id, {
      photoUrl: path ? (urlByPath.get(path) ?? null) : null,
    });
  }
  return result;
}
