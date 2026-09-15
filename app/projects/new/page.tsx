import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getAccountType } from "@/lib/auth-roles";
import { ProjectForm } from "./ProjectForm";
import { createProject } from "./actions";

export default async function NewProjectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Project creation is Developer/Society-specific management, unlike
  // Post Property (which Owner and Dealer both legitimately use) —
  // anyone else landing here directly gets sent to their own dashboard.
  const accountType = await getAccountType(supabase, user.id);
  if (accountType !== "DEVELOPER") redirect("/dashboard");

  // Single-city platform for now, same as the property/requirement flows.
  const { data: city } = await supabase.from("cities").select("id, name").eq("slug", "lahore").single();

  const [{ data: areas }, { data: societies }] = await Promise.all([
    supabase.from("areas").select("id, city_id, name").eq("city_id", city?.id ?? "").order("name"),
    supabase.from("societies").select("id, city_id, name").eq("city_id", city?.id ?? "").order("name"),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-[#F7F9FC] font-body">
      <SiteHeader />
      <div className="mx-auto w-full max-w-[820px] px-6 py-10">
        <div className="mb-7 text-center">
          <h1 className="mb-2 font-display text-2xl font-extrabold text-[#0B2545]">Add a Project</h1>
          <p className="mx-auto max-w-[480px] font-body text-sm text-[#667085]">
            Publish your project page, then add unit types, sizes, and pricing under Project Inventory.
          </p>
        </div>
        <ProjectForm
          cityId={city?.id ?? ""}
          cityName={city?.name ?? "Lahore"}
          areas={areas ?? []}
          societies={societies ?? []}
          action={createProject}
        />
      </div>
      <SiteFooter />
    </div>
  );
}
