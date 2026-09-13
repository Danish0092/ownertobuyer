"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseProjectForm } from "@/lib/parse-project-form";
import type { ProjectActionResult } from "@/app/projects/new/actions";

export async function updateProject(
  projectId: string,
  _prevState: ProjectActionResult,
  formData: FormData
): Promise<ProjectActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const parsed = parseProjectForm(formData);
  if ("error" in parsed) return parsed;

  const publish = formData.get("intent") === "publish";

  // RLS ("Projects update: own or admin") already enforces developer_id
  // = auth.uid() at the database level — the .eq below is belt-and-
  // braces, same reasoning as updateProperty/updateRequirement.
  const { data: project, error } = await supabase
    .from("projects")
    .update({
      ...parsed.fields,
      status: publish ? "PUBLISHED" : "DRAFT",
      published_at: publish ? new Date().toISOString() : null,
    })
    .eq("id", projectId)
    .eq("developer_id", user.id)
    .select("slug")
    .single();

  if (error || !project) {
    return { error: error?.message ?? "Failed to update project. It may not belong to you." };
  }

  redirect(`/projects/${project.slug}`);
}
