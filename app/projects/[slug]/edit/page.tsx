import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProjectForm } from "@/app/projects/new/ProjectForm";
import { priceLabel } from "@/lib/format";
import { getAccountType } from "@/lib/auth-roles";
import { updateProject } from "./actions";

export default async function EditProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select(
      `id, developer_id, name, developer_name, description, city_id, area_id, society_id, address,
       approval_status, development_status, min_price, max_price, contact_name, contact_phone,
       status, cities(name)`
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!project) notFound();
  if (project.developer_id !== user.id) redirect(`/projects/${slug}`);

  const accountType = await getAccountType(supabase, user.id);
  if (accountType !== "DEVELOPER") redirect("/dashboard");

  const [{ data: areas }, { data: societies }] = await Promise.all([
    supabase.from("areas").select("id, city_id, name").eq("city_id", project.city_id).order("name"),
    supabase.from("societies").select("id, city_id, name").eq("city_id", project.city_id).order("name"),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-[#F7F9FC] font-body">
      <SiteHeader />
      <div className="mx-auto w-full max-w-[820px] px-6 py-10">
        <div className="mb-7 text-center">
          <h1 className="mb-2 font-display text-2xl font-extrabold text-[#0B2545]">Edit Project</h1>
          <a
            href={`/projects/${slug}/inventory`}
            className="font-body text-sm text-[#2563EB] hover:underline"
          >
            Manage Project Inventory →
          </a>
        </div>
        <ProjectForm
          cityId={project.city_id}
          cityName={project.cities?.name ?? "Lahore"}
          areas={areas ?? []}
          societies={societies ?? []}
          action={updateProject.bind(null, project.id)}
          submitLabel={project.status === "PUBLISHED" ? "Save Changes" : "Publish Project"}
          initial={{
            name: project.name,
            developerName: project.developer_name,
            description: project.description ?? undefined,
            areaId: project.area_id ?? undefined,
            societyId: project.society_id ?? undefined,
            address: project.address ?? undefined,
            approvalStatus: project.approval_status,
            developmentStatus: project.development_status,
            minPriceLabel: project.min_price ? priceLabel(project.min_price, "TOTAL").replace("PKR ", "") : undefined,
            maxPriceLabel: project.max_price ? priceLabel(project.max_price, "TOTAL").replace("PKR ", "") : undefined,
            contactName: project.contact_name ?? undefined,
            contactPhone: project.contact_phone ?? undefined,
          }}
        />
      </div>
      <SiteFooter />
    </div>
  );
}
