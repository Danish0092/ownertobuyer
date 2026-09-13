import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProjectCard } from "@/components/ProjectCard";
import { resolveProjectCardMedia } from "@/lib/project-media";
import { priceLabel } from "@/lib/format";
import { labelize } from "@/lib/property-options";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select(
      `id, name, slug, developer_name, min_price, max_price, development_status,
       cities(name), areas(name), societies(name),
       project_media(storage_path, media_type, is_primary, sort_order)`
    )
    .eq("status", "PUBLISHED")
    .order("created_at", { ascending: false });

  const rows = projects ?? [];
  const cardMedia = await resolveProjectCardMedia(supabase, rows);

  const cards = rows.map((p) => ({
    name: p.name,
    developerName: p.developer_name,
    locationLine: [p.societies?.name, p.areas?.name, p.cities?.name].filter(Boolean).join(", ") || "Lahore",
    priceLabel: p.min_price ? priceLabel(p.min_price, "TOTAL") : p.max_price ? priceLabel(p.max_price, "TOTAL") : null,
    developmentStatusLabel: labelize(p.development_status),
    photoUrl: cardMedia.get(p.id)?.photoUrl,
    href: `/projects/${p.slug}`,
  }));

  return (
    <div className="flex flex-1 flex-col bg-[#F7F9FC] font-body">
      <SiteHeader />

      <div className="mx-auto w-full max-w-[1140px] px-6 pt-8">
        <h1 className="mb-1 font-display text-2xl font-extrabold text-[#0B2545]">New Developments</h1>
        <p className="mb-6 font-body text-sm text-[#667085]">
          Housing societies and developer projects in Lahore — browse project inventory, pricing, and payment plans.
        </p>
      </div>

      {cards.length > 0 ? (
        <div className="mx-auto grid w-full max-w-[1140px] grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4.5 px-6 pb-12">
          {cards.map((card) => (
            <ProjectCard key={card.href} data={card} />
          ))}
        </div>
      ) : (
        <div className="mx-auto w-full max-w-[1140px] px-6 pb-16">
          <div className="rounded-2xl border border-dashed border-[#EAEFF6] bg-white px-6 py-14 text-center">
            <p className="mb-3 text-sm text-[#667085]">No projects published yet — be the first developer to list one.</p>
            <a
              href="/projects/new"
              className="inline-block rounded-[10px] bg-gradient-to-br from-[#F59E0B] to-[#EA7D0B] px-5 py-2.5 font-display text-[13px] font-extrabold text-white"
            >
              Add a Project
            </a>
          </div>
        </div>
      )}
      <SiteFooter />
    </div>
  );
}
