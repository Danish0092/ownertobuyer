"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { uniqueSlug } from "@/lib/slug";
import { parseProjectForm } from "@/lib/parse-project-form";

export type ProjectActionResult = { error: string } | null;

export async function createProject(_prevState: ProjectActionResult, formData: FormData): Promise<ProjectActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const parsed = parseProjectForm(formData);
  if ("error" in parsed) return parsed;

  const publish = formData.get("intent") === "publish";
  const slug = uniqueSlug(parsed.fields.name);

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      ...parsed.fields,
      developer_id: user.id,
      slug,
      status: publish ? "PUBLISHED" : "DRAFT",
      published_at: publish ? new Date().toISOString() : null,
    })
    .select("id, slug")
    .single();

  if (error || !project) {
    return { error: error?.message ?? "Failed to create project." };
  }

  redirect(`/projects/${project.slug}/inventory`);
}
