import type { SupabaseClient } from "@supabase/supabase-js";
import type { MediaRow } from "@/lib/property-media";

// Same shape and reasoning as resolveCardMedia in lib/property-media.ts
// (project-media is a private bucket, so card grids need signed URLs,
// batched via createSignedUrls) — kept as its own small function rather
// than a shared generic since the media field name and bucket differ.
export async function resolveProjectCardMedia<T extends { id: string; project_media: MediaRow[] }>(
  supabase: SupabaseClient,
  projects: T[]
): Promise<Map<string, { photoUrl: string | null }>> {
  const primaryPathByProject = new Map<string, string>();

  for (const p of projects) {
    const photos = p.project_media.filter((m) => m.media_type === "IMAGE").sort((a, b) => a.sort_order - b.sort_order);
    const primary = photos.find((m) => m.is_primary) ?? photos[0];
    if (primary) primaryPathByProject.set(p.id, primary.storage_path);
  }

  const paths = [...primaryPathByProject.values()];
  const { data: signed } =
    paths.length > 0 ? await supabase.storage.from("project-media").createSignedUrls(paths, 3600) : { data: [] };
  const urlByPath = new Map(
    (signed ?? []).filter((s): s is typeof s & { path: string } => s.path != null).map((s) => [s.path, s.signedUrl])
  );

  const result = new Map<string, { photoUrl: string | null }>();
  for (const p of projects) {
    const path = primaryPathByProject.get(p.id);
    result.set(p.id, { photoUrl: path ? (urlByPath.get(path) ?? null) : null });
  }
  return result;
}
