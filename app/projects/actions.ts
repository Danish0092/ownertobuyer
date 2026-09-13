"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error: string } | { ok: true };

// Projects have no DELETED status (only DRAFT/PUBLISHED/HIDDEN) — HIDDEN
// is the equivalent "take it down" action, same soft-removal spirit as
// properties.status = 'DELETED', just named for what it actually does
// here (a developer can always publish it again).
export async function hideProject(projectId: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("projects")
    .update({ status: "HIDDEN" })
    .eq("id", projectId)
    .eq("developer_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}
