"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Soft-delete, matching the schema's documented lifecycle
// (supabase/migrations/20260905124436_initial_schema.sql: "DELETED:
// soft-delete marker, so it disappears without losing the row —
// useful for analytics/audit") rather than an actual SQL DELETE.
export async function deleteProperty(propertyId: string): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("properties")
    .update({ status: "DELETED" })
    .eq("id", propertyId)
    .eq("seller_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}
